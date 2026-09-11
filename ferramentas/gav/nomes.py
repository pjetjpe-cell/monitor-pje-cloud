"""Leitura e normalização dos nomes de pasta de cliente no Drive.

O padrão em uso na pasta de processos é:

    NN. [EMPREENDIMENTO -] NOME - XX COTA(S) - PP% - R$ VALOR [- Nº PROCESSO]

Exemplos reais (variações e tudo):

    92. KAREN CARDOSO VENTURATO - 01 COTA - 18% - R$ 17.418,84
    91. ARIEL ANTEBI - 06 COTAS - JERIQUIÁ LAGOA - 18% - R$ 152.652,45
    83. JANICE BRUTTI - 01 COTA R$ 29.883,63 - 0003701-68.2026.8.17.2730
    79. PORTO 2 LIFE - LUIZ PAULO 30% R$ 29.316,28 1 COTA - 0003460-94...
    10. PITANGUI - FILLIPE E PAULA - 02 COTAS - 20% - R$ 66.415,56

Os campos aparecem em ordens diferentes, com e sem hífen, com e sem o
empreendimento. Por isso a leitura é por extração de padrões, não por posição.

Renomear é destrutivo à sua maneira: quebra link salvo e atalho. `normalizar`
devolve o nome proposto e o que mudou — quem decide aplicar é a etapa, depois
de mostrar a proposta.
"""

from __future__ import annotations

import re
import unicodedata
from dataclasses import dataclass, asdict, field
from typing import Any

# Empreendimentos da GAV que aparecem nos nomes de pasta.
EMPREENDIMENTOS = [
    "PORTO 2 LIFE", "PORTO ALTO", "MURO ALTO", "JERIQUIÁ LAGOA", "JERIQUIA LAGOA",
    "JERIQUIÁ DUNAS", "JERIQUIA DUNAS", "OIKOS MARAGOGI", "GRAN GARDEN",
    "PITANGUI",
]

# Pastas de originais: as variantes que já existem no Drive.
VARIANTES_NAO_USAR = ["não usar", "nao usar", "não-usar", "naousar"]
NOME_CANONICO_NAO_USAR = "NÃO USAR"

_RE_NUMERO = re.compile(r"^\s*(\d{1,3})\s*[.\-)]\s*")
_RE_PROCESSO = re.compile(r"\b(\d{7}-\d{2}\.\d{4}\.\d\.\d{2}\.\d{4})\b")
_RE_VALOR = re.compile(r"R\$\s*([\d.]+,\d{2})")
_RE_PERCENTUAL = re.compile(r"\b(\d{1,2})\s*%")
_RE_COTAS = re.compile(r"\b(\d{1,2})\s*COTAS?\b", re.IGNORECASE)


def sem_acento(texto: str) -> str:
    texto = unicodedata.normalize("NFKD", texto)
    return "".join(c for c in texto if not unicodedata.combining(c))


def e_pasta_nao_usar(nome: str) -> bool:
    """Reconhece 'Não usar ', 'NAO USAR', 'não-usar' — tudo a mesma pasta."""
    limpo = sem_acento(nome).strip().lower().replace("-", " ")
    limpo = re.sub(r"\s+", " ", limpo)
    return limpo in [sem_acento(v).replace("-", " ") for v in VARIANTES_NAO_USAR]


@dataclass
class PastaCliente:
    numero: int | None = None
    empreendimento: str | None = None
    cliente: str | None = None
    cotas: int | None = None
    percentual: int | None = None
    valor: str | None = None
    processo: str | None = None
    observacoes: list[str] = field(default_factory=list)
    nome_original: str = ""

    def como_dict(self) -> dict[str, Any]:
        return asdict(self)


def analisar(nome: str) -> PastaCliente:
    """Extrai os campos de um nome de pasta. Campo ausente vira None — nunca
    um valor inventado para preencher a lacuna."""
    p = PastaCliente(nome_original=nome)
    resto = nome.strip()

    m = _RE_NUMERO.match(resto)
    if m:
        p.numero = int(m.group(1))
        resto = resto[m.end():]

    m = _RE_PROCESSO.search(resto)
    if m:
        p.processo = m.group(1)
        resto = resto.replace(m.group(0), " ")

    m = _RE_VALOR.search(resto)
    if m:
        p.valor = m.group(1)
        resto = resto.replace(m.group(0), " ")

    m = _RE_PERCENTUAL.search(resto)
    if m:
        p.percentual = int(m.group(1))
        resto = resto.replace(m.group(0), " ")

    m = _RE_COTAS.search(resto)
    if m:
        p.cotas = int(m.group(1))
        resto = resto.replace(m.group(0), " ")

    resto_sem_acento = sem_acento(resto).upper()
    for emp in EMPREENDIMENTOS:
        alvo = sem_acento(emp).upper()
        if alvo in resto_sem_acento:
            p.empreendimento = emp
            idx = resto_sem_acento.index(alvo)
            resto = resto[:idx] + " " + resto[idx + len(alvo):]
            break

    # O que sobra é o nome do cliente.
    cliente = re.sub(r"[-–—]+", " ", resto)
    cliente = re.sub(r"\s+", " ", cliente).strip(" ,.-")
    if cliente:
        p.cliente = cliente.upper()

    for campo, rotulo in [
        ("cliente", "nome do cliente"), ("cotas", "quantidade de cotas"),
        ("percentual", "percentual"), ("valor", "valor"),
    ]:
        if getattr(p, campo) is None:
            p.observacoes.append(f"{rotulo} ausente no nome da pasta")
    return p


def formatar(p: PastaCliente, incluir_processo: bool = True) -> str:
    """Monta o nome canônico com o que existe. Não preenche buraco com palpite."""
    partes: list[str] = []
    if p.numero is not None:
        partes.append(f"{p.numero:02d}.")
    if p.empreendimento:
        partes.append(f"{p.empreendimento} -")
    if p.cliente:
        partes.append(p.cliente)
    cauda: list[str] = []
    if p.cotas is not None:
        cauda.append(f"{p.cotas:02d} {'COTAS' if p.cotas > 1 else 'COTA'}")
    if p.percentual is not None:
        cauda.append(f"{p.percentual}%")
    if p.valor:
        cauda.append(f"R$ {p.valor}")
    if incluir_processo and p.processo:
        cauda.append(p.processo)
    nome = " ".join(partes)
    if cauda:
        nome = f"{nome} - {' - '.join(cauda)}" if nome else " - ".join(cauda)
    return re.sub(r"\s+", " ", nome).strip()


def normalizar(nome: str) -> dict[str, Any]:
    """Compara o nome atual com o canônico e diz o que mudaria."""
    p = analisar(nome)
    externo = formatar(p, incluir_processo=True)
    interno = formatar(p, incluir_processo=False)
    return {
        "nome_atual": nome,
        "nome_externo": externo,
        "nome_interno": interno,
        "precisa_renomear": nome.strip() != externo,
        "campos": p.como_dict(),
        "observacoes": p.observacoes,
    }


def estrutura_esperada(nome_externo: str, nome_interno: str) -> dict[str, Any]:
    """A árvore que a etapa de organização tem de produzir."""
    return {
        "pasta_externa": nome_externo,
        "filhos": [
            {"tipo": "pasta", "nome": nome_interno,
             "papel": "arquivos numerados, prontos para peticionar"},
            {"tipo": "pasta", "nome": NOME_CANONICO_NAO_USAR,
             "papel": "originais preservados, fora dos autos"},
        ],
    }


# Numeração dos documentos na pasta de peticionamento.
#
# Esta é a numeração da pasta da cliente 193 (JANICE), confirmada como a
# oficial. Existe outra em uso no Drive — a do AYRES e da KAREN, em que 02 é o
# documento de identificação, 03 o histórico de pagamentos e 05 o comprovante de
# residência. São incompatíveis: 05 é comprovante de residência lá e 07 aqui.
# Ao organizar uma pasta que siga a outra, avise o usuário antes de renumerar.
#
# O 05 está deliberadamente ausente. Nenhuma pasta nesta numeração tem um, e não
# se inventa um rótulo para tapar buraco: precisando de um documento entre o
# contrato e a carteira de trabalho, pergunte ao usuário como nomear.
DOCUMENTOS = [
    ("01", "PROCURAÇÃO", "procuração limpa (sem honorários/percentual/0,5 SM)"),
    ("02", "EXTRATO DE COTA", "extrato da cota enviado pela GAV"),
    ("03", "DOC - IDENTIFICAÇÃO", "RG/CNH extraído do contrato (pp. 33-35)"),
    ("04.1", "CONTRATO", "contrato dividido por tamanho: PARTE 1-N, cada uma <3 MB"),
    ("06", "CARTEIRA DE TRABALHO", "para justiça gratuita, quando for o caso"),
    ("07", "COMPROVANTE DE RESIDÊNCIA", "comprovante de endereço"),
    ("08", "NOTIFICAÇÃO EXTRAJUDICIAL", "PDF do e-mail enviado à GAV"),
]


def nome_documento(codigo: str, cliente: str | None = None) -> str:
    """Nome de arquivo no padrão da pasta: '01 - PROCURAÇÃO - JANICE.pdf'."""
    entrada = next((d for d in DOCUMENTOS if d[0] == codigo), None)
    if entrada is None:
        extra = ""
        if codigo in ("05", "5"):
            extra = (" O 05 não existe nesta numeração — pergunte ao usuário "
                     "como nomear o documento em vez de escolher um rótulo.")
        raise ValueError(f"código de documento desconhecido: {codigo!r} "
                         f"(use um de {[d[0] for d in DOCUMENTOS]}).{extra}")
    base = f"{entrada[0]} - {entrada[1]}"
    if cliente:
        primeiro = cliente.strip().split()[0].upper()
        base = f"{base} - {primeiro}"
    return f"{base}.pdf"


if __name__ == "__main__":
    import json
    import sys
    for arg in sys.argv[1:]:
        print(json.dumps(normalizar(arg), ensure_ascii=False, indent=2))
