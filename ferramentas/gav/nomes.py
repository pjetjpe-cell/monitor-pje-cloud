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
    """Nome canônico no padrão dos vídeos de 30/10/2026:
    'NNN. NOME XX COTA(S) PP% R$ VALOR' (+ ' - Nº PROCESSO' na externa).
    Empreendimento não entra no nome (fica na descrição da pasta).
    Não preenche buraco com palpite: campo ausente simplesmente não aparece."""
    partes: list[str] = []
    if p.numero is not None:
        partes.append(f"{p.numero:02d}.")
    if p.cliente:
        partes.append(p.cliente)
    if p.cotas is not None:
        partes.append(f"{p.cotas:02d} {'COTAS' if p.cotas > 1 else 'COTA'}")
    if p.percentual is not None:
        partes.append(f"{p.percentual}%")
    if p.valor:
        partes.append(f"R$ {p.valor}")
    nome = " ".join(partes)
    if incluir_processo and p.processo:
        nome = f"{nome} - {p.processo}"
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


# Numeração dos documentos na pasta de peticionamento — a dos vídeos de
# 30/10/2026 (CLIENTE XXX → 110. VALTEMIR URCINO), que substitui a da JANICE.
# Nome do arquivo é só o código e o rótulo: "01 PROCURAÇÃO.pdf".
#
# 05 continua deliberadamente ausente: não se inventa rótulo para tapar buraco.
# 06-08 vêm da numeração anterior e não aparecem nos vídeos; se a pasta pedir
# outro documento, pergunte ao usuário como nomear.
DOCUMENTOS = [
    ("01", "PROCURAÇÃO", "procuração assinada já alterada (sem honorários/percentual/SM)"),
    ("02", "RG", "documento de identificação recortado do contrato (pp. 33-36)"),
    ("03", "EXTRATO DE PAGAMENTOS", "extrato/print dos pagamentos da cota"),
    ("04", "CONTRATO", "contrato comprimido; se não couber em 3 MB: 04 CONTRATO PARTE 1-N"),
    ("06", "CARTEIRA DE TRABALHO", "para justiça gratuita, quando for o caso"),
    ("07", "COMPROVANTE DE RESIDÊNCIA", "comprovante de endereço"),
    ("08", "NOTIFICAÇÃO EXTRAJUDICIAL", "PDF (impressão do Gmail) do e-mail de distrato enviado"),
]

# A petição não leva número: "Petição Inicial — NOME.pdf" (vídeo 6).
PREFIXO_PETICAO = "Petição Inicial — "


def nome_documento(codigo: str, cliente: str | None = None, extensao: str = ".pdf") -> str:
    """Nome de arquivo no padrão dos vídeos: '01 PROCURAÇÃO.pdf'. O `cliente`
    é aceito por compatibilidade e ignorado — o nome da pessoa vai na pasta."""
    entrada = next((d for d in DOCUMENTOS if d[0] == codigo), None)
    if entrada is None:
        extra = ""
        if codigo in ("05", "5"):
            extra = (" O 05 não existe nesta numeração — pergunte ao usuário "
                     "como nomear o documento em vez de escolher um rótulo.")
        raise ValueError(f"código de documento desconhecido: {codigo!r} "
                         f"(use um de {[d[0] for d in DOCUMENTOS]}).{extra}")
    return f"{entrada[0]} {entrada[1]}{extensao}"


if __name__ == "__main__":
    import json
    import sys
    for arg in sys.argv[1:]:
        print(json.dumps(normalizar(arg), ensure_ascii=False, indent=2))
