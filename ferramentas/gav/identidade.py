"""Extração do documento de identificação de dentro do contrato da GAV.

No contrato da GAV o RG do cliente fica digitalizado por volta da página 33 —
às vezes 34, ocasionalmente 35. A busca é restrita a essa faixa de propósito:
varrer o contrato inteiro atrás de "RG" acha menção contratual em vez do
documento.

A escolha da página é pontuada, não adivinhada: pesa termos do documento de
identidade e a fração da página ocupada por imagem (RG entra escaneado, ocupa
quase a folha toda e quase não tem texto). A pontuação de cada página candidata
sai no relatório, para conferir a escolha em vez de confiar nela.

O RG entra no contrato como digitalização: os dizeres estão nos pixels, não no
fluxo de texto, e sem OCR as três páginas da faixa empatam. Por isso a
pontuação roda OCR nas páginas que parecem escaneadas (muita imagem, pouco
texto). Sem Tesseract instalado a ferramenta não inventa um vencedor — informa
o empate e manda renderizar as candidatas para conferência a olho.

Contrato dividido em partes: passe as partes na ordem e a numeração é contada
como se fosse um documento só — a página 33 do contrato quase nunca é a página
33 do arquivo "PARTE 2-3".
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import dataclass, asdict
from pathlib import Path
from typing import Any

import pymupdf

from .nucleo import VerificacaoFalhou, sha256


def _tessdata() -> str | None:
    """Caminho do tessdata, ou None se o Tesseract não estiver instalado."""
    import os
    import shutil
    if not shutil.which("tesseract"):
        return None
    prefixo = os.environ.get("TESSDATA_PREFIX")
    if prefixo and Path(prefixo).is_dir():
        return prefixo
    for candidato in sorted(Path("/usr/share/tesseract-ocr").glob("*/tessdata"), reverse=True):
        return str(candidato)
    for candidato in ("/usr/share/tessdata", "/usr/local/share/tessdata"):
        if Path(candidato).is_dir():
            return candidato
    return None


OCR_DISPONIVEL = _tessdata() is not None


def _texto_com_ocr(page: pymupdf.Page, idioma: str = "por") -> str:
    """Lê a página por OCR. Devolve string vazia se o OCR não estiver disponível."""
    tess = _tessdata()
    if not tess:
        return ""
    try:
        tp = page.get_textpage_ocr(language=idioma, dpi=200, full=True, tessdata=tess)
        return page.get_text(textpage=tp)
    except Exception:
        return ""


def _normalizar(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", texto).strip().lower()


# (padrão, peso). Peso alto = praticamente só aparece em documento de identidade.
TERMOS: list[tuple[str, int]] = [
    (r"republica federativa do brasil", 5),
    (r"carteira de identidade", 5),
    (r"registro geral", 5),
    (r"carteira nacional de habilitacao", 5),
    (r"valida em todo o territorio nacional", 5),
    (r"secretaria de (?:estado da )?seguranca", 4),
    (r"instituto de identificacao", 4),
    (r"orgao (?:emissor|expedidor)", 3),
    (r"\bfiliacao\b", 3),
    (r"\bnaturalidade\b", 3),
    (r"\bdata de nascimento\b", 2),
    (r"\bdoc\.? identidade\b", 2),
    (r"\bssp\b|\bdetran\b|\bdic\b", 2),
    (r"\brg\b", 2),
    (r"\bcpf\b", 1),
]


@dataclass
class Candidata:
    pagina: int          # número na numeração contínua (1-indexado)
    arquivo: str
    pagina_no_arquivo: int
    pontos: int
    termos_achados: list[str]
    fracao_imagem: float
    caracteres: int
    motivo: str
    usou_ocr: bool = False


def _indice_continuo(arquivos: list[Path]) -> list[tuple[Path, int]]:
    """Mapeia a numeração contínua -> (arquivo, página dentro do arquivo)."""
    mapa: list[tuple[Path, int]] = []
    for caminho in arquivos:
        doc = pymupdf.open(caminho)
        for i in range(doc.page_count):
            mapa.append((caminho, i))
        doc.close()
    return mapa


def _fracao_imagem(page: pymupdf.Page) -> float:
    """Quanto da página é coberto por imagem (0..1)."""
    area_pagina = abs(page.rect.get_area()) or 1.0
    coberto = 0.0
    for info in page.get_image_info():
        bbox = pymupdf.Rect(info["bbox"])
        coberto += abs(bbox.get_area())
    return min(coberto / area_pagina, 1.0)


def avaliar(
    arquivos: list[str | Path],
    faixa: tuple[int, int] = (33, 35),
) -> list[Candidata]:
    """Pontua cada página da faixa. Não decide nada — só mede."""
    caminhos = [Path(a) for a in arquivos]
    for c in caminhos:
        if not c.exists():
            raise FileNotFoundError(f"contrato não encontrado: {c}")

    mapa = _indice_continuo(caminhos)
    total = len(mapa)
    inicio, fim = faixa
    if inicio > total:
        raise VerificacaoFalhou(
            f"o contrato tem {total} páginas, menos que a página inicial da faixa ({inicio}). "
            "Confira se passou todas as partes do contrato, na ordem."
        )

    compilados = [(re.compile(p), peso) for p, peso in TERMOS]
    candidatas: list[Candidata] = []

    abertos: dict[Path, pymupdf.Document] = {}
    try:
        for num in range(inicio, min(fim, total) + 1):
            caminho, idx = mapa[num - 1]
            if caminho not in abertos:
                abertos[caminho] = pymupdf.open(caminho)
            page = abertos[caminho][idx]
            texto_nativo = page.get_text()
            fracao_img = _fracao_imagem(page)
            usou_ocr = False
            # Página escaneada: os dizeres do RG estão na imagem, não no texto.
            if fracao_img >= 0.15 and len(texto_nativo.strip()) < 600:
                lido = _texto_com_ocr(page)
                if lido.strip():
                    texto_nativo = texto_nativo + "\n" + lido
                    usou_ocr = True
            texto = _normalizar(texto_nativo)
            pontos, achados = 0, []
            for regex, peso in compilados:
                if regex.search(texto):
                    pontos += peso
                    achados.append(regex.pattern)
            fracao = fracao_img
            if usou_ocr:
                achados.append("lido-por-ocr")
            # Documento escaneado: página quase toda imagem e quase sem texto.
            if fracao >= 0.30 and len(texto) < 400:
                # Só vale ponto quando o OCR não conseguiu ler nada: se leu,
                # quem decide são os termos encontrados, não o formato da página.
                if not usou_ocr:
                    pontos += 4
                    achados.append("pagina-imagem-sem-texto")
            elif fracao >= 0.15:
                pontos += 2
                achados.append("imagem-relevante")
            candidatas.append(Candidata(
                pagina=num, arquivo=str(caminho), pagina_no_arquivo=idx + 1,
                pontos=pontos, termos_achados=achados,
                fracao_imagem=round(fracao, 3), caracteres=len(texto),
                motivo="", usou_ocr=usou_ocr,
            ))
    finally:
        for doc in abertos.values():
            doc.close()

    return candidatas


def extrair(
    arquivos: list[str | Path],
    saida: str | Path,
    faixa: tuple[int, int] = (33, 35),
    pagina_forcada: int | None = None,
    minimo_pontos: int = 4,
) -> dict[str, Any]:
    """Escolhe a melhor página da faixa e grava só ela num PDF."""
    candidatas = avaliar(arquivos, faixa)

    if pagina_forcada is not None:
        escolhida = next((c for c in candidatas if c.pagina == pagina_forcada), None)
        if escolhida is None:
            raise VerificacaoFalhou(
                f"página {pagina_forcada} está fora da faixa {faixa[0]}-{faixa[1]} avaliada."
            )
        escolhida.motivo = f"página {pagina_forcada} indicada manualmente"
    else:
        ordenadas = sorted(candidatas, key=lambda c: (-c.pontos, c.pagina))
        escolhida = ordenadas[0]
        if escolhida.pontos < minimo_pontos:
            detalhe = "; ".join(f"p.{c.pagina}={c.pontos}pt" for c in candidatas)
            raise VerificacaoFalhou(
                f"nenhuma página da faixa {faixa[0]}-{faixa[1]} parece um documento de "
                f"identidade ({detalhe}). Abra o contrato e indique a página com "
                "--pagina em vez de aceitar um palpite."
            )
        empatadas = [c for c in ordenadas[1:] if c.pontos == escolhida.pontos]
        if empatadas:
            paginas = ", ".join(f"p.{c.pagina}" for c in [escolhida, *empatadas])
            dica = ("" if OCR_DISPONIVEL else
                    " O Tesseract não está instalado, então o RG escaneado não pôde ser lido: "
                    "instale-o (apt-get install tesseract-ocr tesseract-ocr-por) ou")
            raise VerificacaoFalhou(
                f"empate de {escolhida.pontos} pontos entre {paginas} — não dá para "
                f"saber qual é o documento de identificação.{dica} rode com "
                "--renderizar para ver as páginas e indique a certa com --pagina. "
                "Um palpite aqui coloca a folha errada nos autos."
            )
        escolhida.motivo = f"maior pontuação da faixa ({escolhida.pontos} pontos)"

    saida = Path(saida)
    saida.parent.mkdir(parents=True, exist_ok=True)

    origem = pymupdf.open(escolhida.arquivo)
    destino = pymupdf.open()
    destino.insert_pdf(origem, from_page=escolhida.pagina_no_arquivo - 1,
                       to_page=escolhida.pagina_no_arquivo - 1)
    destino.save(saida, garbage=4, deflate=True, clean=True)
    destino.close()
    origem.close()

    conferencia = pymupdf.open(saida)
    paginas = conferencia.page_count
    conferencia.close()
    if paginas != 1:
        raise VerificacaoFalhou(f"o arquivo gerado tem {paginas} páginas, esperava 1.")

    return {
        "saida": str(saida),
        "sha256_saida": sha256(saida),
        "pagina_escolhida": escolhida.pagina,
        "arquivo_de_origem": escolhida.arquivo,
        "pagina_no_arquivo": escolhida.pagina_no_arquivo,
        "pontos": escolhida.pontos,
        "motivo": escolhida.motivo,
        "candidatas": [asdict(c) for c in candidatas],
        "conferencia": {"paginas": paginas, "ok": True},
    }


def renderizar(
    arquivos: list[str | Path],
    destino_dir: str | Path,
    faixa: tuple[int, int] = (33, 35),
    dpi: int = 130,
) -> list[str]:
    """Grava PNG de cada página da faixa, para conferir a olho qual é o RG."""
    caminhos = [Path(a) for a in arquivos]
    mapa = _indice_continuo(caminhos)
    destino_dir = Path(destino_dir)
    destino_dir.mkdir(parents=True, exist_ok=True)
    gerados: list[str] = []
    abertos: dict[Path, pymupdf.Document] = {}
    try:
        for num in range(faixa[0], min(faixa[1], len(mapa)) + 1):
            caminho, idx = mapa[num - 1]
            if caminho not in abertos:
                abertos[caminho] = pymupdf.open(caminho)
            png = destino_dir / f"pagina-{num:03d}.png"
            abertos[caminho][idx].get_pixmap(dpi=dpi).save(png)
            gerados.append(str(png))
    finally:
        for doc in abertos.values():
            doc.close()
    return gerados


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="gav-rg",
        description="Extrai o documento de identificação do contrato (padrão: pp. 33-35).")
    ap.add_argument("saida", help="PDF de uma página a gerar")
    ap.add_argument("--contrato", action="append", required=True,
                    help="PDF do contrato. Repita na ordem se estiver dividido em partes.")
    ap.add_argument("--de", type=int, default=33, help="primeira página da faixa (padrão: 33)")
    ap.add_argument("--ate", type=int, default=35, help="última página da faixa (padrão: 35)")
    ap.add_argument("--pagina", type=int, help="força esta página, sem pontuar")
    ap.add_argument("--avaliar", action="store_true", help="só mostra a pontuação, não grava")
    ap.add_argument("--renderizar", metavar="DIR",
                    help="grava PNG das páginas da faixa para conferência visual")
    ap.add_argument("--manifesto")
    args = ap.parse_args(argv)

    try:
        if args.renderizar:
            for png in renderizar(args.contrato, args.renderizar, (args.de, args.ate)):
                print(png)
            return 0
        if args.avaliar:
            for c in avaliar(args.contrato, (args.de, args.ate)):
                marca = " [ocr]" if c.usou_ocr else "     "
                print(f"p.{c.pagina:<4} {c.pontos:>3} pontos{marca}  "
                      f"imagem={c.fracao_imagem:.0%}  texto={c.caracteres}c  "
                      f"{', '.join(t for t in c.termos_achados[:4])}")
            return 0
        rel = extrair(args.contrato, args.saida, (args.de, args.ate), args.pagina)
    except VerificacaoFalhou as e:
        print(f"REPROVADO: {e}", file=sys.stderr)
        return 2

    print(f"Documento de identificação: página {rel['pagina_escolhida']} -> {rel['saida']}")
    print(f"  {rel['motivo']}")
    for c in rel["candidatas"]:
        marca = "<-" if c["pagina"] == rel["pagina_escolhida"] else "  "
        print(f"  {marca} p.{c['pagina']}: {c['pontos']} pontos, "
              f"imagem {c['fracao_imagem']:.0%}, {c['caracteres']} caracteres")
    if args.manifesto:
        Path(args.manifesto).write_text(
            json.dumps(rel, ensure_ascii=False, indent=2), encoding="utf-8")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
