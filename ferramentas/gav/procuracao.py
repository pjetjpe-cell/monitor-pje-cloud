"""Limpeza da procuração assinada: remove honorários, percentual e 0,5 SM.

O que sai da procuração antes de ir para os autos:

  * o destaque do percentual ("VINTE E UM POR CENTO 21%" e variantes);
  * "sobre o valor restituído com as devidas correções";
  * a menção a meio salário mínimo devido na suspensão das parcelas;
  * as declarações de ciência de honorários (I e II).

O que NUNCA sai: outorgante, CPF, endereço, outorgados/OAB, poderes conferidos,
data, assinatura. A conferência final barra o arquivo se qualquer um sumir.

Três decisões de projeto que valem explicação:

1. Redação de verdade. `apply_redactions()` apaga os glifos do fluxo de
   conteúdo. Tarja por cima não serve: o texto continua no arquivo e sai num
   copiar-colar ou num `pdftotext`.

2. Por padrão não se pinta nada (`--fundo auto`). Removendo só os glifos, o
   fundo original — caixa colorida, papel timbrado, gradiente — permanece
   intacto, o que casa com o fundo melhor do que qualquer cor amostrada. O modo
   `amostrar` existe para quando o glifo deixa resíduo visível.

3. Não se renumera as declarações remanescentes. Renumerar III→I significaria
   escrever texto novo num instrumento assinado. Remover é supressão por
   sigilo; reescrever seria outra coisa. A lacuna fica visível de propósito.
"""

from __future__ import annotations

import argparse
import json
import re
import sys
import unicodedata
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any

import pymupdf

from .nucleo import VerificacaoFalhou, sha256, tamanho_mb


# --------------------------------------------------------------------------
# Alvos
# --------------------------------------------------------------------------

def _normalizar(texto: str) -> str:
    """Minúsculas, sem acento, espaços colapsados — para casar padrões."""
    texto = unicodedata.normalize("NFKD", texto)
    texto = "".join(c for c in texto if not unicodedata.combining(c))
    return re.sub(r"\s+", " ", texto).strip().lower()


# Por extenso, de 1 a 100, como aparecem no destaque do percentual.
_EXTENSOS = (
    r"(?:um|dois|tres|quatro|cinco|seis|sete|oito|nove|dez|onze|doze|treze|"
    r"quatorze|catorze|quinze|dezesseis|dezessete|dezoito|dezenove|vinte|"
    r"trinta|quarenta|cinquenta|sessenta|setenta|oitenta|noventa|cem)"
)

ALVOS: list[dict[str, str]] = [
    {
        "id": "destaque_percentual",
        "descricao": "Destaque do percentual de honorários (ex.: VINTE E UM POR CENTO 21%)",
        "padrao": rf"\b{_EXTENSOS}(?:\s+e\s+{_EXTENSOS})*\s+por\s+cento\b|\b\d{{1,2}}\s*%",
    },
    {
        "id": "sobre_valor_restituido",
        "descricao": "Base de cálculo dos honorários",
        "padrao": r"sobre o valor restituido",
    },
    {
        "id": "meio_salario_minimo",
        "descricao": "Meio salário mínimo devido na suspensão das parcelas",
        "padrao": r"meio salario minimo|0[,.]5\s*sm\b",
    },
    {
        "id": "declaracao_honorarios",
        "descricao": "Declaração de ciência dos honorários",
        "padrao": r"ciente dos honorarios|ciente de que o valor equivalente",
    },
    {
        "id": "suspensao_parcelas_pagamento",
        "descricao": "Pagamento atrelado à decisão de suspensão das parcelas",
        "padrao": r"decisao (?:judicial )?de suspensao das parcelas",
    },
    {
        "id": "honorarios_avulso",
        "descricao": "Menção isolada a honorários",
        "padrao": r"\bhonorarios?\b",
    },
]

# Linhas intocáveis. Um padrão de honorários largo demais pode casar com um
# poder ("receber honorários", "transigir e acordar") e amputar o mandato. Estes
# padrões vencem os alvos: casou aqui, a linha fica, e o motivo entra no
# manifesto. A conferência por sentinela não pegaria isto sozinha — ela só vê
# que o cabeçalho PODERES CONFERIDOS sobreviveu, não que um poder sumiu.
PROTEGIDAS = [
    ("poder_judicial", r"ad judicia|judiciais"),
    ("poder_extrajudicial", r"ad negotia|extrajudiciais"),
    ("poder_especifico", r"substabelecer|especificos"),
    ("cabecalho_poderes", r"poderes conferidos"),
    ("assinatura", r"outorgante|outorgad[oa]s?\b|oab/?\s*[a-z]{2}"),
]

# Fragmentos órfãos. Uma cláusula quebrada em duas linhas some na primeira e
# deixa a segunda pendurada ("...devidos ao final do processo."). A conferência
# final procura estes restos — detectar e verificar pelo mesmo padrão criaria um
# ponto cego comum aos dois.
RESIDUOS_PROIBIDOS = [
    ("cauda_correcoes", r"com as devidas correcoes"),
    ("cauda_final_processo", r"devidos? ao final do processo"),
    ("cauda_restituido", r"valor restituido"),
    ("cauda_salario", r"salario minimo"),
    ("cauda_por_cento", r"por cento"),
]

# Tem de sobreviver à limpeza. Se algum sumir, o arquivo é rejeitado.
SENTINELAS = [
    ("outorgante", r"outorgante"),
    ("cpf", r"cpf"),
    ("poderes", r"poderes conferidos|ad judicia"),
    ("outorgados", r"oab/?\s*[a-z]{2}"),
]


@dataclass
class Protegida:
    """Linha que casou um alvo mas foi poupada por ser conteúdo do mandato."""
    pagina: int
    texto: str
    alvo: str
    motivo: str


@dataclass
class Ocorrencia:
    pagina: int
    alvo: str
    descricao: str
    texto: str
    rect: tuple[float, float, float, float]
    continuacao: bool = False


# --------------------------------------------------------------------------
# Localização
# --------------------------------------------------------------------------

def _linhas_da_pagina(page: pymupdf.Page) -> list[tuple[str, pymupdf.Rect]]:
    """Devolve (texto, rect) por linha, ignorando blocos de imagem."""
    linhas: list[tuple[str, pymupdf.Rect]] = []
    dados = page.get_text("dict")
    for bloco in dados.get("blocks", []):
        if bloco.get("type") != 0:  # 0 = texto
            continue
        for linha in bloco.get("lines", []):
            texto = "".join(s.get("text", "") for s in linha.get("spans", []))
            if not texto.strip():
                continue
            linhas.append((texto, pymupdf.Rect(linha["bbox"])))
    return linhas


_MARCADOR_ITEM = re.compile(r"^\s*(?:[ivxlcdm]+|\d+)\s*[\u2014\u2013\-.)]", re.IGNORECASE)


def _e_cabecalho(texto: str) -> bool:
    """Linha curta toda em caixa alta — título de seção, não continuação."""
    limpo = texto.strip()
    return bool(limpo) and len(limpo) < 60 and limpo == limpo.upper() and any(c.isalpha() for c in limpo)


def _continua(anterior: pymupdf.Rect, atual: pymupdf.Rect, texto: str) -> bool:
    """A linha `atual` é continuação do parágrafo que termina em `anterior`?"""
    if _MARCADOR_ITEM.match(texto) or _e_cabecalho(texto):
        return False
    altura = max(anterior.height, 1.0)
    folga = atual.y0 - anterior.y1
    if folga > altura * 1.6 or folga < -altura:
        return False
    # Continuação de parágrafo mantém a margem esquerda; recuo grande é outra coisa.
    return abs(atual.x0 - anterior.x0) <= altura * 3


def localizar(doc: pymupdf.Document, alvos: list[dict[str, str]] = ALVOS) -> list[Ocorrencia]:
    """Acha as linhas que precisam sair.

    Trabalha por linha, não por palavra: tarjar palavra solta deixa o resto da
    frase legível e entrega o sentido. E arrasta as linhas de continuação —
    remover só a primeira linha de uma cláusula quebrada deixaria a cauda
    ("...devidos ao final do processo.") pendurada nos autos.
    """
    compilados = [(a, re.compile(a["padrao"])) for a in alvos]
    protegidas_rx = [(nome, re.compile(pad)) for nome, pad in PROTEGIDAS]
    achados: list[Ocorrencia] = []
    poupadas: list[Protegida] = []
    for num, page in enumerate(doc, start=1):
        linhas = _linhas_da_pagina(page)
        marcadas: set[int] = set()
        for i, (texto, rect) in enumerate(linhas):
            if i in marcadas:
                continue
            norm = _normalizar(texto)
            alvo_casado = next((a for a, rx in compilados if rx.search(norm)), None)
            if alvo_casado is None:
                continue
            protecao = next((nome for nome, rx in protegidas_rx if rx.search(norm)), None)
            if protecao:
                poupadas.append(Protegida(
                    pagina=num, texto=texto.strip(), alvo=alvo_casado["id"],
                    motivo=f"linha preservada: é conteúdo do mandato ({protecao})",
                ))
                marcadas.add(i)
                continue
            marcadas.add(i)
            achados.append(Ocorrencia(
                pagina=num, alvo=alvo_casado["id"], descricao=alvo_casado["descricao"],
                texto=texto.strip(), rect=tuple(rect), continuacao=False,
            ))
            anterior = rect
            for j in range(i + 1, len(linhas)):
                if j in marcadas:
                    break
                texto_j, rect_j = linhas[j]
                if not _continua(anterior, rect_j, texto_j):
                    break
                marcadas.add(j)
                achados.append(Ocorrencia(
                    pagina=num, alvo=alvo_casado["id"],
                    descricao=alvo_casado["descricao"] + " (continuação)",
                    texto=texto_j.strip(), rect=tuple(rect_j), continuacao=True,
                ))
                anterior = rect_j
    return achados, poupadas


def _cor_de_fundo(page: pymupdf.Page, rect: pymupdf.Rect) -> tuple[float, float, float] | None:
    """Cor predominante dentro do retângulo — numa linha de texto, o que mais
    aparece é o fundo, não o glifo. Devolve None se não houver cor dominante
    clara (fundo com gradiente ou imagem), caso em que não se deve pintar."""
    try:
        pix = page.get_pixmap(clip=rect, annots=False, dpi=110)
    except Exception:
        return None
    if pix.width == 0 or pix.height == 0:
        return None
    try:
        fracao, cor = pix.color_topusage()
    except Exception:
        return None
    if fracao < 0.55:  # sem fundo liso dominante
        return None
    if pix.n >= 3:
        r, g, b = cor[0], cor[1], cor[2]
    else:
        r = g = b = cor[0]
    return (r / 255, g / 255, b / 255)


# --------------------------------------------------------------------------
# Limpeza
# --------------------------------------------------------------------------

def limpar(
    entrada: str | Path,
    saida: str | Path,
    fundo: str = "auto",
    margem: float = 1.0,
) -> dict[str, Any]:
    """Aplica a redação e confere o resultado. Levanta VerificacaoFalhou se o
    arquivo gerado não estiver limpo ou tiver perdido conteúdo essencial."""
    entrada, saida = Path(entrada), Path(saida)
    if not entrada.exists():
        raise FileNotFoundError(f"procuração não encontrada: {entrada}")
    if fundo not in ("auto", "amostrar", "nenhum"):
        raise ValueError(f"--fundo inválido: {fundo!r} (auto | amostrar | nenhum)")

    doc = pymupdf.open(entrada)
    paginas_antes = doc.page_count
    texto_antes = "\n".join(p.get_text() for p in doc)
    norm_antes = _normalizar(texto_antes)

    ocorrencias, poupadas = localizar(doc)
    if not ocorrencias:
        doc.close()
        raise VerificacaoFalhou(
            f"nenhuma cláusula de honorários encontrada em {entrada.name}. "
            "Confira se é mesmo a procuração assinada — não gere um arquivo 'limpo' "
            "que na verdade não foi limpo."
        )

    # Sentinelas conferidas ANTES, para distinguir "nunca teve" de "a limpeza comeu".
    sentinelas_antes = {nome: bool(re.search(p, norm_antes)) for nome, p in SENTINELAS}

    pintadas: list[dict[str, Any]] = []
    for oc in ocorrencias:
        page = doc[oc.pagina - 1]
        rect = pymupdf.Rect(oc.rect)
        rect.x0 -= margem
        rect.y0 -= margem
        rect.x1 += margem
        rect.y1 += margem
        cor = None
        if fundo == "amostrar":
            cor = _cor_de_fundo(page, rect)
        page.add_redact_annot(rect, fill=cor if cor else False)
        pintadas.append({
            "pagina": oc.pagina, "alvo": oc.alvo, "descricao": oc.descricao,
            "texto_removido": oc.texto,
            "continuacao": oc.continuacao,
            "fundo_pintado": list(cor) if cor else None,
        })

    for page in doc:
        # text=0 apaga os caracteres; images/graphics=0 preserva a arte da
        # página, que é justamente o fundo que se quer manter.
        page.apply_redactions(images=0, graphics=0, text=0)

    doc.scrub(metadata=False, redactions=False)
    saida.parent.mkdir(parents=True, exist_ok=True)
    doc.save(saida, garbage=4, deflate=True, clean=True)
    doc.close()

    conferencia = conferir(saida, paginas_antes, sentinelas_antes)
    return {
        "entrada": str(entrada),
        "saida": str(saida),
        "sha256_entrada": sha256(entrada),
        "sha256_saida": sha256(saida),
        "mb_entrada": round(tamanho_mb(entrada), 3),
        "mb_saida": round(tamanho_mb(saida), 3),
        "remocoes": pintadas,
        "linhas_poupadas": [asdict(p) for p in poupadas],
        "conferencia": conferencia,
    }


def conferir(
    arquivo: str | Path,
    paginas_esperadas: int,
    sentinelas_antes: dict[str, bool],
) -> dict[str, Any]:
    """Reabre o arquivo gerado e prova que ficou limpo. Sem isto a etapa não
    pode ser marcada 'ok'."""
    doc = pymupdf.open(arquivo)
    texto = "\n".join(p.get_text() for p in doc)
    paginas = doc.page_count
    doc.close()
    norm = _normalizar(texto)

    residuos = []
    for alvo in ALVOS:
        achado = re.search(alvo["padrao"], norm)
        if achado:
            residuos.append({"alvo": alvo["id"], "trecho": achado.group(0)})
    for nome, padrao in RESIDUOS_PROIBIDOS:
        achado = re.search(padrao, norm)
        if achado:
            residuos.append({"alvo": nome, "trecho": achado.group(0)})

    perdidas = [
        nome for nome, padrao in SENTINELAS
        if sentinelas_antes.get(nome) and not re.search(padrao, norm)
    ]

    if paginas != paginas_esperadas:
        raise VerificacaoFalhou(
            f"a limpeza mudou o número de páginas ({paginas_esperadas} -> {paginas}). "
            "Procuração não pode perder página."
        )
    if residuos:
        raise VerificacaoFalhou(
            "sobrou cláusula de honorários no arquivo gerado: "
            + "; ".join(f"{r['alvo']} ({r['trecho']!r})" for r in residuos)
        )
    if perdidas:
        raise VerificacaoFalhou(
            "a limpeza removeu conteúdo essencial: " + ", ".join(perdidas)
            + ". Reduza os alvos — a procuração precisa continuar válida."
        )

    return {
        "paginas": paginas,
        "residuos": [],
        "sentinelas_preservadas": sorted(n for n, v in sentinelas_antes.items() if v),
        "limpo": True,
    }


# --------------------------------------------------------------------------
# CLI
# --------------------------------------------------------------------------

def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(
        prog="gav-procuracao",
        description="Limpa honorários/percentual/0,5 SM da procuração assinada.",
    )
    ap.add_argument("entrada", help="PDF da procuração assinada (original)")
    ap.add_argument("saida", help="PDF limpo a gerar")
    ap.add_argument("--fundo", default="auto", choices=["auto", "amostrar", "nenhum"],
                    help="auto/nenhum: só apaga os glifos e preserva o fundo original "
                         "(recomendado). amostrar: pinta a cor predominante por cima.")
    ap.add_argument("--margem", type=float, default=1.0,
                    help="folga em pontos ao redor da linha (padrão: 1.0)")
    ap.add_argument("--conferir", action="store_true",
                    help="apenas lista o que seria removido, sem gravar nada")
    ap.add_argument("--manifesto", help="grava o relatório da limpeza neste JSON")
    args = ap.parse_args(argv)

    if args.conferir:
        doc = pymupdf.open(args.entrada)
        achados, poupadas = localizar(doc)
        doc.close()
        if not achados:
            print("Nenhuma cláusula de honorários localizada.")
            return 1
        print(f"{len(achados)} linha(s) seriam removidas de {args.entrada}:\n")
        for oc in achados:
            print(f"  p.{oc.pagina} [{oc.alvo}] {oc.texto[:100]}")
        if poupadas:
            print(f"\n{len(poupadas)} linha(s) casaram um alvo mas foram POUPADAS:")
            for pp in poupadas:
                print(f"  p.{pp.pagina} {pp.texto[:80]}\n      {pp.motivo}")
        return 0

    try:
        rel = limpar(args.entrada, args.saida, fundo=args.fundo, margem=args.margem)
    except VerificacaoFalhou as e:
        print(f"REPROVADO: {e}", file=sys.stderr)
        return 2

    if args.manifesto:
        Path(args.manifesto).write_text(
            json.dumps(rel, ensure_ascii=False, indent=2), encoding="utf-8")

    print(f"Limpo: {rel['saida']}")
    print(f"  {len(rel['remocoes'])} linha(s) removidas, {rel['conferencia']['paginas']} página(s) preservadas")
    for r in rel["remocoes"]:
        print(f"  - p.{r['pagina']} [{r['alvo']}] {r['texto_removido'][:80]}")
    for pp in rel["linhas_poupadas"]:
        print(f"  ~ POUPADA p.{pp['pagina']} {pp['texto'][:70]} ({pp['motivo']})")
    print("  conferência: arquivo gerado não contém mais nenhum dos alvos")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
