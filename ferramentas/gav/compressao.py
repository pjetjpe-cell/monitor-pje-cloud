"""Compressão de PDF com alvo de tamanho, para o contrato de 4 MB+.

O contrato da GAV passa de 4 MB e não sobe no PJe. A meta é ficar abaixo de
3 MB — folga suficiente para o limite prático de 4 MB por arquivo.

A compressão é buscada, não chutada: tenta-se um degrau, mede-se o arquivo e
só se desce mais se ainda não couber. Um "70%" fixo às vezes derruba a
legibilidade sem necessidade e às vezes não chega no alvo.

O contrato é prova. A conferência barra a saída se o número de páginas mudar
ou se o texto extraível encolher — imagem borrada ainda é discutível, página
faltando não é.
"""

from __future__ import annotations

import argparse
import json
import shutil
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import Any

import pymupdf

from .nucleo import VerificacaoFalhou, sha256, tamanho_mb


@dataclass(frozen=True)
class Degrau:
    """Um nível de agressividade. Ordem: do mais conservador ao mais agressivo."""
    nome: str
    dpi: int
    qualidade: int


DEGRAUS = [
    Degrau("leve",         200, 85),
    Degrau("moderado",     150, 75),
    Degrau("padrao",       120, 70),
    Degrau("forte",        100, 60),
    Degrau("agressivo",     84, 50),
    Degrau("maximo",        72, 40),
]


def _so_recomprimir(origem: Path, destino: Path) -> None:
    """Degrau zero: limpeza estrutural, sem tocar nas imagens.

    Muito PDF de contrato carrega objeto órfão e fonte repetida; às vezes isto
    sozinho já resolve, sem perda nenhuma de qualidade."""
    doc = pymupdf.open(origem)
    doc.subset_fonts()
    doc.save(destino, garbage=4, deflate=True, clean=True, deflate_images=True)
    doc.close()


def _comprimir_no_degrau(origem: Path, destino: Path, degrau: Degrau) -> None:
    doc = pymupdf.open(origem)
    doc.rewrite_images(
        dpi_threshold=degrau.dpi + 20,
        dpi_target=degrau.dpi,
        quality=degrau.qualidade,
    )
    doc.subset_fonts()
    doc.save(destino, garbage=4, deflate=True, clean=True, deflate_images=True)
    doc.close()


def _medir(caminho: Path) -> tuple[int, int]:
    """(páginas, caracteres de texto) — o que a conferência compara."""
    doc = pymupdf.open(caminho)
    paginas = doc.page_count
    caracteres = sum(len(p.get_text().strip()) for p in doc)
    doc.close()
    return paginas, caracteres


def comprimir(
    entrada: str | Path,
    saida: str | Path,
    alvo_mb: float = 3.0,
    tolerancia_texto: float = 0.98,
) -> dict[str, Any]:
    """Comprime até caber em `alvo_mb`, parando no primeiro degrau que couber."""
    entrada, saida = Path(entrada), Path(saida)
    if not entrada.exists():
        raise FileNotFoundError(f"PDF não encontrado: {entrada}")

    mb_antes = tamanho_mb(entrada)
    paginas_antes, texto_antes = _medir(entrada)
    saida.parent.mkdir(parents=True, exist_ok=True)

    tentativas: list[dict[str, Any]] = []

    if mb_antes <= alvo_mb:
        # Já cabe: copiar é melhor que recomprimir à toa. A conferência aqui é a
        # igualdade byte a byte — declarar "páginas preservadas" sem olhar seria
        # exatamente o tipo de aprovação vazia que esta esteira existe para evitar.
        shutil.copy2(entrada, saida)
        h_entrada, h_saida = sha256(entrada), sha256(saida)
        if h_entrada != h_saida:
            raise VerificacaoFalhou(
                f"a cópia de {entrada.name} saiu diferente do original "
                f"({h_entrada[:12]} != {h_saida[:12]})."
            )
        return {
            "entrada": str(entrada), "saida": str(saida),
            "mb_antes": round(mb_antes, 3), "mb_depois": round(mb_antes, 3),
            "reducao_percentual": 0.0,
            "degrau": "nenhum", "atingiu_alvo": True,
            "motivo": f"já estava sob o alvo de {alvo_mb} MB — copiado sem recomprimir",
            "tentativas": [], "paginas": paginas_antes,
            "sha256_entrada": h_entrada, "sha256_saida": h_saida,
            "conferencia": {
                "copia_identica": True,
                "paginas_preservadas": True,
                "texto_preservado": True,
                "caracteres_antes": texto_antes,
                "caracteres_depois": texto_antes,
            },
        }

    temporario = saida.with_suffix(".tmp.pdf")
    escolhido: Degrau | None = None

    try:
        _so_recomprimir(entrada, temporario)
        mb = tamanho_mb(temporario)
        tentativas.append({"degrau": "recompactar", "mb": round(mb, 3)})
        if mb <= alvo_mb:
            temporario.replace(saida)
            escolhido = Degrau("recompactar", 0, 0)

        if escolhido is None:
            for degrau in DEGRAUS:
                _comprimir_no_degrau(entrada, temporario, degrau)
                mb = tamanho_mb(temporario)
                tentativas.append({
                    "degrau": degrau.nome, "dpi": degrau.dpi,
                    "qualidade": degrau.qualidade, "mb": round(mb, 3),
                })
                if mb <= alvo_mb:
                    temporario.replace(saida)
                    escolhido = degrau
                    break
            else:
                # Nenhum degrau bastou: fica o mais agressivo e o chamador decide
                # (normalmente dividir o contrato em partes, como já se faz).
                temporario.replace(saida)
                escolhido = DEGRAUS[-1]
    finally:
        temporario.unlink(missing_ok=True)

    mb_depois = tamanho_mb(saida)
    paginas_depois, texto_depois = _medir(saida)

    if paginas_depois != paginas_antes:
        raise VerificacaoFalhou(
            f"a compressão mudou o número de páginas ({paginas_antes} -> {paginas_depois}). "
            "Contrato é prova: não pode perder página."
        )
    if texto_antes > 0 and texto_depois < texto_antes * tolerancia_texto:
        raise VerificacaoFalhou(
            f"a compressão comeu texto extraível ({texto_antes} -> {texto_depois} caracteres). "
            "Use um degrau mais leve ou divida o contrato em partes."
        )

    resultado = {
        "entrada": str(entrada), "saida": str(saida),
        "mb_antes": round(mb_antes, 3), "mb_depois": round(mb_depois, 3),
        "reducao_percentual": round((1 - mb_depois / mb_antes) * 100, 1),
        "degrau": escolhido.nome if escolhido else "nenhum",
        "alvo_mb": alvo_mb,
        "atingiu_alvo": mb_depois <= alvo_mb,
        "tentativas": tentativas,
        "paginas": paginas_depois,
        "sha256_entrada": sha256(entrada), "sha256_saida": sha256(saida),
        "conferencia": {
            "paginas_preservadas": True,
            "texto_preservado": True,
            "caracteres_antes": texto_antes,
            "caracteres_depois": texto_depois,
        },
    }
    if not resultado["atingiu_alvo"]:
        resultado["aviso"] = (
            f"não coube em {alvo_mb} MB nem no degrau máximo (ficou em {mb_depois:.2f} MB). "
            "Divida o contrato em partes (04.1 - CONTRATO PARTE 1-3.pdf etc.)."
        )
    return resultado


def dividir(entrada: str | Path, saida_dir: str | Path, alvo_mb: float = 3.0,
            prefixo: str = "04.1 - CONTRATO PARTE") -> list[dict[str, Any]]:
    """Divide o PDF em partes que caibam no alvo, seguindo o padrão do escritório.

    Só entra em cena quando nem o degrau máximo resolve."""
    entrada, saida_dir = Path(entrada), Path(saida_dir)
    saida_dir.mkdir(parents=True, exist_ok=True)
    doc = pymupdf.open(entrada)
    total = doc.page_count
    mb = tamanho_mb(entrada)
    n_partes = max(2, int(mb / alvo_mb) + 1)
    por_parte = -(-total // n_partes)  # teto

    partes: list[dict[str, Any]] = []
    for i in range(n_partes):
        inicio, fim = i * por_parte, min((i + 1) * por_parte, total) - 1
        if inicio > fim:
            break
        parte = pymupdf.open()
        parte.insert_pdf(doc, from_page=inicio, to_page=fim)
        destino = saida_dir / f"{prefixo} {i + 1}-{n_partes}.pdf"
        parte.save(destino, garbage=4, deflate=True, clean=True)
        parte.close()
        partes.append({
            "arquivo": str(destino), "paginas": f"{inicio + 1}-{fim + 1}",
            "mb": round(tamanho_mb(destino), 3),
        })
    doc.close()

    somadas = sum(int(p["paginas"].split("-")[1]) - int(p["paginas"].split("-")[0]) + 1 for p in partes)
    if somadas != total:
        raise VerificacaoFalhou(
            f"a divisão perdeu páginas ({total} no original, {somadas} nas partes)."
        )
    return partes


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="gav-comprimir",
        description="Comprime um PDF até caber no alvo de tamanho (padrão: 3 MB).")
    ap.add_argument("entrada")
    ap.add_argument("saida")
    ap.add_argument("--alvo-mb", type=float, default=3.0)
    ap.add_argument("--dividir-se-nao-couber", action="store_true",
                    help="se nem o degrau máximo couber, divide em partes")
    ap.add_argument("--manifesto")
    args = ap.parse_args(argv)

    try:
        rel = comprimir(args.entrada, args.saida, alvo_mb=args.alvo_mb)
    except VerificacaoFalhou as e:
        print(f"REPROVADO: {e}", file=sys.stderr)
        return 2

    print(f"{rel['mb_antes']:.2f} MB -> {rel['mb_depois']:.2f} MB "
          f"({rel.get('reducao_percentual', 0)}% menor, degrau '{rel['degrau']}')")
    print(f"  {rel['paginas']} páginas preservadas, texto preservado")

    if not rel.get("atingiu_alvo", True):
        print(f"  AVISO: {rel['aviso']}")
        if args.dividir_se_nao_couber:
            partes = dividir(args.saida, Path(args.saida).parent, alvo_mb=args.alvo_mb)
            rel["partes"] = partes
            print(f"  dividido em {len(partes)} partes:")
            for p in partes:
                print(f"    {Path(p['arquivo']).name}  pp.{p['paginas']}  {p['mb']:.2f} MB")

    if args.manifesto:
        Path(args.manifesto).write_text(
            json.dumps(rel, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0 if rel.get("atingiu_alvo", True) or args.dividir_se_nao_couber else 1


if __name__ == "__main__":
    raise SystemExit(main())
