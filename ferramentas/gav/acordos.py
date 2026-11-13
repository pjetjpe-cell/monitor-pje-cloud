"""Análise de acordos GAV — valor de cada processo, por cenário e na carteira.

Responde, com conta e não com opinião:

* quanto o cliente e o escritório recebem se fizer acordo AGORA;
* quanto recebem se ESPERAR a sentença (com probabilidade e tempo);
* quanto muda se o cliente aceitar a PROPOSTA (acordo sem sentença em troca
  de +7 pontos de honorários contratuais);
* o que acontece na carteira inteira em cada estratégia — acordo com todos,
  com ninguém, só com parte, segurando os processos estratégicos — e em
  quantas quinzenas a captação de processos novos repõe o que se abriu mão.

As regras de negócio (percentuais do acordo, prazo da GAV, divisão de
honorários) ficam em `REGRAS_PADRAO` e podem ser sobrescritas por um JSON.
Nada de valor "de cabeça": todo dado do processo que pesa no cálculo exige
`fontes[campo]`, e tudo o que vier de premissa (e não do processo) sai listado
no relatório como premissa, para ser confirmado.

Uso:

    python3 -m gav.acordos pasta "86. SIBELY MARTELLO - 02 COTAS - 16% - R$ 62.200,32"
    python3 -m gav.acordos analisar carteira.json [--regras r.json] [--md rel.md] [--json r.json]
    python3 -m gav.acordos cliente carteira.json --id 86 [--regras r.json]
    python3 -m gav.acordos regras            # imprime as regras padrão
"""

from __future__ import annotations

import argparse
import copy
import json
import sys
from dataclasses import dataclass, field, asdict
from datetime import date
from pathlib import Path
from typing import Any

from . import nomes
from .nucleo import ErroEsteira, SemFonte


class DadoInvalido(ErroEsteira):
    """Processo com dado ausente, contraditório ou fora de faixa."""


# --------------------------------------------------------------------------
# Regras de negócio. Tudo aqui é parâmetro — o JSON de regras sobrescreve.
# --------------------------------------------------------------------------

REGRAS_PADRAO: dict[str, Any] = {
    # O que a GAV paga em acordo ANTES da sentença, sobre a base restituível
    # (valor pago − corretagem). Não paga honorários sucumbenciais.
    "acordo_sem_sentenca": {"construido": 0.75, "nao_construido": 0.50},
    # Percentual que se ESPERA da sentença quando ainda não há sentença.
    # Sentença real (75% ou 80%) substitui isto processo a processo.
    "sentenca_esperada": {"construido": 0.75, "nao_construido": 0.50},
    "sucumbencia_esperada": 0.10,          # 10% a 15% na prática
    "prazo_pagamento_acordo_dias": 15,     # GAV paga o acordo em 15 dias
    "tempo": {
        # Do protocolo até a sentença, em meses (premissa — ajustar com o
        # histórico das varas de Ipojuca).
        "protocolo_ate_sentenca_meses": 15,
        # Mesmo processo antigo ainda leva um mínimo até sentenciar.
        "minimo_restante_sem_contestacao_meses": 6,
        "minimo_restante_contestado_meses": 3,
        # Com sentença a GAV propõe pagar o que está nela (15 dias). Se em vez
        # disso recorrer, troque por ~12 meses e rode de novo.
        "sentenca_ate_pagamento_meses": 0.5,
    },
    # Custo do dinheiro no tempo (premissa). A condenação é atualizada por
    # IPCA + taxa legal (Selic − IPCA) desde a Lei 14.905/2024 — na prática,
    # perto da Selic; o acordo antes da sentença é nominal.
    "taxa_desconto_anual": 0.15,
    "taxa_atualizacao_judicial_anual": 0.15,
    "p_procedencia": {"construido": 0.90, "nao_construido": 0.90},
    # Proposta ao cliente: acordo antes da sentença + 7 pontos de honorários
    # contratuais. "pontos": 16% → 23%. "proporcional": 16% → 17,12%.
    "adicional_cliente": {"valor": 0.07, "modo": "pontos"},
    # Fração dos honorários que fica com o escritório. A CONFIRMAR com os
    # artefatos da cadeia de honorários — o relatório marca como premissa.
    "divisoes": {
        "padrao": {"contratual": 1 / 3, "sucumbencia": 1 / 3},
        "dois": {"contratual": 1 / 2, "sucumbencia": 1 / 2},
        "dois_tercos": {"contratual": 2 / 3, "sucumbencia": 2 / 3},
        "integral": {"contratual": 1.0, "sucumbencia": 1.0},
    },
    "divisao_padrao": "padrao",
    # Captação: processos novos por quinzena. Ticket/percentual None = média
    # da própria carteira.
    "reposicao": {"novos_por_quinzena": 6, "base_media": None,
                  "honorario_medio": None, "fracao_construido": None},
    # Estratégia "acordo_recentes": faz acordo onde faltam pelo menos tantos
    # meses para a sentença; espera os que estão perto.
    "limiar_recentes_meses": 9,
    "aliquota_tributos": 0.0,              # 0 = valores brutos
    # Status de obra por empreendimento (orientação do usuário em 13/11/2026).
    "empreendimentos": {
        "PORTO 2 LIFE": "construido",
        "PORTO ALTO": "construido",
        "GRAND VALLEY": "construido",
        "OIKOS MARAGOGI": "nao_construido",   # AL
        "JERIQUIÁ DUNAS": "nao_construido",   # CE
        "JERIQUIÁ LAGOA": "nao_construido",   # CE
    },
}

HORIZONTES_MESES = (1, 3, 6, 12, 18, 24, 36)
_DIAS_MES = 30.4375


def mesclar(base: dict[str, Any], extra: dict[str, Any]) -> dict[str, Any]:
    saida = copy.deepcopy(base)
    for k, v in (extra or {}).items():
        if isinstance(v, dict) and isinstance(saida.get(k), dict):
            saida[k] = mesclar(saida[k], v)
        else:
            saida[k] = v
    return saida


def carregar_regras(caminho: str | None = None) -> dict[str, Any]:
    if not caminho:
        return copy.deepcopy(REGRAS_PADRAO)
    return mesclar(REGRAS_PADRAO, json.loads(Path(caminho).read_text(encoding="utf-8")))


# --------------------------------------------------------------------------
# Utilidades financeiras
# --------------------------------------------------------------------------

def valor_presente(valor: float, meses: float, taxa_anual: float) -> float:
    return valor / (1 + taxa_anual) ** (max(meses, 0.0) / 12)


def capitalizar(valor: float, meses: float, taxa_anual: float) -> float:
    return valor * (1 + taxa_anual) ** (max(meses, 0.0) / 12)


def meses_entre(inicio: date, fim: date) -> float:
    return (fim - inicio).days / _DIAS_MES


def brl(v: float | None) -> str:
    if v is None:
        return "—"
    s = f"{abs(v):,.2f}".replace(",", "X").replace(".", ",").replace("X", ".")
    return ("-R$ " if v < 0 else "R$ ") + s


def pct(v: float | None, casas: int = 1) -> str:
    return "—" if v is None else f"{v * 100:.{casas}f}%".replace(".", ",")


def _fracao(v: Any, nome: str) -> float:
    """Aceita 16, '16%', 0.16 → 0.16."""
    if isinstance(v, str):
        v = v.replace("%", "").replace(",", ".").strip()
    try:
        f = float(v)
    except (TypeError, ValueError):
        raise DadoInvalido(f"{nome}: valor não numérico {v!r}") from None
    if f > 1:
        f /= 100
    if not 0 <= f <= 1:
        raise DadoInvalido(f"{nome}: fora de 0–100% ({v!r})")
    return f


def _dinheiro(v: Any, nome: str) -> float:
    """Aceita 62200.32 ou '62.200,32'."""
    if isinstance(v, str):
        v = v.replace("R$", "").strip().replace(".", "").replace(",", ".")
    try:
        f = float(v)
    except (TypeError, ValueError):
        raise DadoInvalido(f"{nome}: valor em dinheiro inválido {v!r}") from None
    if f < 0:
        raise DadoInvalido(f"{nome}: negativo ({v!r})")
    return f


def _data(v: Any, nome: str) -> date:
    if isinstance(v, date):
        return v
    s = str(v).strip()
    try:
        if "/" in s:
            d, m, a = s.split("/")
            return date(int(a), int(m), int(d))
        return date.fromisoformat(s)
    except ValueError:
        raise DadoInvalido(f"{nome}: data inválida {v!r} (use AAAA-MM-DD ou DD/MM/AAAA)") from None


# --------------------------------------------------------------------------
# Processo
# --------------------------------------------------------------------------

@dataclass
class Sentenca:
    percentual: float                 # 0.75, 0.80, 0.50...
    sucumbencia: float                # 0.10 a 0.15
    valor_condenacao: float | None = None   # se a sentença/cálculo já liquidou


@dataclass
class Processo:
    id: str
    cliente: str
    construido: bool
    valor_pago: float
    corretagem: float
    honorario: float                  # contratual, fração
    divisao: dict[str, float]
    processo: str | None = None
    empreendimento: str | None = None
    data_protocolo: date | None = None
    contestado: bool = False
    sentenca: Sentenca | None = None
    p_procedencia: float = 0.9
    fator_correcao: float = 1.0       # correção já acumulada até hoje (extrato)
    parceria: bool = False
    fontes: dict[str, str] = field(default_factory=dict)
    premissas: list[str] = field(default_factory=list)

    @property
    def base(self) -> float:
        """Base restituível: corretagem nunca volta."""
        return max(self.valor_pago - self.corretagem, 0.0)

    @property
    def tipo(self) -> str:
        return "construido" if self.construido else "nao_construido"

    @property
    def fase(self) -> str:
        if self.sentenca:
            return "sentenciado"
        return "contestado" if self.contestado else "sem contestação"


_EXIGEM_FONTE = ("valor_pago", "corretagem", "honorario_contratual")


def processo_de_dict(d: dict[str, Any], regras: dict[str, Any]) -> Processo:
    pid = str(d.get("id") or d.get("processo") or "").strip()
    if not pid:
        raise DadoInvalido("processo sem 'id'")
    fontes = {k: str(v) for k, v in (d.get("fontes") or {}).items() if str(v).strip()}
    rotulo = f"[{pid}]"

    for campo in _EXIGEM_FONTE:
        if d.get(campo) is None:
            raise DadoInvalido(f"{rotulo} falta '{campo}'")
        if campo not in fontes:
            raise SemFonte(f"{rotulo} '{campo}' sem fonte — diga de onde veio (pasta, contrato, extrato, usuário)")

    premissas: list[str] = []

    # Construído ou não: do processo, ou do mapa de empreendimentos.
    emp = d.get("empreendimento")
    if d.get("construido") is not None:
        if "construido" not in fontes:
            raise SemFonte(f"{rotulo} 'construido' sem fonte")
        construido = bool(d["construido"])
    else:
        mapa = {nomes.sem_acento(k).upper(): v for k, v in regras["empreendimentos"].items()}
        status = mapa.get(nomes.sem_acento(emp or "").upper())
        if status is None:
            raise DadoInvalido(
                f"{rotulo} não sei se o empreendimento {emp!r} está construído — "
                "informe 'construido' com fonte ou inclua o empreendimento nas regras")
        construido = status == "construido"
        fontes["construido"] = f"regras.empreendimentos[{emp}]"
    tipo = "construido" if construido else "nao_construido"

    sentenca = None
    if d.get("sentenca"):
        s = d["sentenca"]
        if "sentenca" not in fontes:
            raise SemFonte(f"{rotulo} sentença sem fonte — informe o arquivo/ID da sentença lida")
        if s.get("percentual") is None:
            raise DadoInvalido(f"{rotulo} sentença sem 'percentual' (75%, 80%, 50%...) — leia a sentença")
        if s.get("sucumbencia") is None:
            raise DadoInvalido(f"{rotulo} sentença sem 'sucumbencia' (10% a 15%) — leia a sentença")
        sentenca = Sentenca(
            percentual=_fracao(s["percentual"], f"{rotulo} sentenca.percentual"),
            sucumbencia=_fracao(s["sucumbencia"], f"{rotulo} sentenca.sucumbencia"),
            valor_condenacao=(_dinheiro(s["valor_condenacao"], f"{rotulo} valor_condenacao")
                              if s.get("valor_condenacao") is not None else None),
        )

    data_protocolo = None
    if d.get("data_protocolo"):
        data_protocolo = _data(d["data_protocolo"], f"{rotulo} data_protocolo")
    elif not sentenca:
        raise DadoInvalido(f"{rotulo} sem sentença e sem 'data_protocolo' — o tempo até a sentença sai dela")

    div = d.get("divisao")
    if div is None:
        nome_div = regras["divisao_padrao"]
        divisao = dict(regras["divisoes"][nome_div])
        premissas.append(f"divisão '{nome_div}' (padrão — conferir na cadeia de honorários)")
    elif isinstance(div, str):
        if div not in regras["divisoes"]:
            raise DadoInvalido(f"{rotulo} divisão desconhecida {div!r}; use {sorted(regras['divisoes'])}")
        divisao = dict(regras["divisoes"][div])
    else:
        divisao = {"contratual": _fracao(div["contratual"], f"{rotulo} divisao.contratual"),
                   "sucumbencia": _fracao(div["sucumbencia"], f"{rotulo} divisao.sucumbencia")}

    if d.get("p_procedencia") is not None:
        p = _fracao(d["p_procedencia"], f"{rotulo} p_procedencia")
    else:
        p = regras["p_procedencia"][tipo]
        if not sentenca:
            premissas.append(f"probabilidade de procedência {pct(p, 0)} (premissa)")
    if not sentenca:
        premissas.append(f"sentença esperada {pct(regras['sentenca_esperada'][tipo], 0)} "
                         f"+ sucumbência {pct(regras['sucumbencia_esperada'], 0)} (premissa)")

    fator = float(d.get("fator_correcao") or 1.0)
    if fator < 1:
        raise DadoInvalido(f"{rotulo} fator_correcao < 1")

    return Processo(
        id=pid,
        cliente=str(d.get("cliente") or pid),
        construido=construido,
        valor_pago=_dinheiro(d["valor_pago"], f"{rotulo} valor_pago"),
        corretagem=_dinheiro(d["corretagem"], f"{rotulo} corretagem"),
        honorario=_fracao(d["honorario_contratual"], f"{rotulo} honorario_contratual"),
        divisao=divisao,
        processo=d.get("processo"),
        empreendimento=emp,
        data_protocolo=data_protocolo,
        contestado=bool(d.get("contestado")),
        sentenca=sentenca,
        p_procedencia=p,
        fator_correcao=fator,
        parceria=bool(d.get("parceria")),
        fontes=fontes,
        premissas=premissas,
    )


# --------------------------------------------------------------------------
# Cenários de um processo
# --------------------------------------------------------------------------

@dataclass
class Cenario:
    nome: str
    meses: float                       # até o dinheiro entrar
    probabilidade: float
    restituicao: float                 # bruta, paga pela GAV ao cliente
    sucumbencia: float
    honorario_aplicado: float
    contratual_total: float
    escritorio: float                  # parte do escritório, nominal, se der certo
    cliente: float                     # líquido do cliente, nominal, se der certo
    vp_escritorio: float               # esperado e trazido a valor presente
    vp_cliente: float


def meses_ate_sentenca(p: Processo, regras: dict[str, Any], hoje: date) -> float:
    if p.sentenca:
        return 0.0
    t = regras["tempo"]
    idade = meses_entre(p.data_protocolo, hoje) if p.data_protocolo else 0.0
    minimo = (t["minimo_restante_contestado_meses"] if p.contestado
              else t["minimo_restante_sem_contestacao_meses"])
    return max(minimo, t["protocolo_ate_sentenca_meses"] - idade)


def honorario_com_adicional(h: float, regras: dict[str, Any]) -> float:
    a = regras["adicional_cliente"]
    novo = h + a["valor"] if a["modo"] == "pontos" else h * (1 + a["valor"])
    return min(novo, 1.0)


def _montar(nome: str, p: Processo, regras: dict[str, Any], meses: float, prob: float,
            restituicao: float, sucumbencia: float, h: float) -> Cenario:
    liquido = 1 - regras["aliquota_tributos"]
    contratual = restituicao * h
    escritorio = (contratual * p.divisao["contratual"] + sucumbencia * p.divisao["sucumbencia"]) * liquido
    cliente = restituicao - contratual
    taxa = regras["taxa_desconto_anual"]
    return Cenario(
        nome=nome, meses=meses, probabilidade=prob, restituicao=restituicao,
        sucumbencia=sucumbencia, honorario_aplicado=h, contratual_total=contratual,
        escritorio=escritorio, cliente=cliente,
        vp_escritorio=prob * valor_presente(escritorio, meses, taxa),
        vp_cliente=prob * valor_presente(cliente, meses, taxa),
    )


def cenarios(p: Processo, regras: dict[str, Any], hoje: date) -> dict[str, Cenario]:
    prazo = regras["prazo_pagamento_acordo_dias"] / _DIAS_MES
    out: dict[str, Cenario] = {}

    if p.sentenca:
        # Com sentença a GAV paga o que está nela, honorários inclusive.
        rest = p.sentenca.valor_condenacao
        if rest is None:
            rest = p.base * p.sentenca.percentual * p.fator_correcao
        out["acordo"] = _montar("acordo (paga a sentença)", p, regras, prazo, 1.0,
                                rest, rest * p.sentenca.sucumbencia, p.honorario)
        return out

    rest_acordo = p.base * regras["acordo_sem_sentenca"][p.tipo]
    out["acordo"] = _montar("acordo agora", p, regras, prazo, 1.0, rest_acordo, 0.0, p.honorario)
    out["proposta"] = _montar("acordo + adicional do cliente", p, regras, prazo, 1.0,
                              rest_acordo, 0.0, honorario_com_adicional(p.honorario, regras))

    t_sent = meses_ate_sentenca(p, regras, hoje)
    t_pag = t_sent + regras["tempo"]["sentenca_ate_pagamento_meses"]
    rest_sent = capitalizar(p.base * regras["sentenca_esperada"][p.tipo] * p.fator_correcao,
                            t_pag, regras["taxa_atualizacao_judicial_anual"])
    out["esperar"] = _montar("esperar a sentença", p, regras, t_pag, p.p_procedencia,
                             rest_sent, rest_sent * regras["sucumbencia_esperada"], p.honorario)
    return out


@dataclass
class Analise:
    processo: Processo
    meses_ate_sentenca: float
    cenarios: dict[str, Cenario]
    melhor_sem_proposta: str
    melhor_com_proposta: str
    p_empate: float | None             # prob. mínima p/ esperar valer mais que o acordo
    custo_cliente_proposta: float | None   # VP que o cliente abre mão vs esperar
    recomendacao: str


def analisar_processo(p: Processo, regras: dict[str, Any], hoje: date) -> Analise:
    c = cenarios(p, regras, hoje)
    t_sent = meses_ate_sentenca(p, regras, hoje)
    if "esperar" not in c:
        return Analise(p, 0.0, c, "acordo", "acordo", None, None,
                       "ACORDO — sentença já fixa o valor; GAV paga integral em 15 dias")

    e = c["esperar"]
    vp_esperar_certo = e.vp_escritorio / e.probabilidade if e.probabilidade else 0.0
    p_empate = c["acordo"].vp_escritorio / vp_esperar_certo if vp_esperar_certo else None

    sem = max(("acordo", "esperar"), key=lambda k: c[k].vp_escritorio)
    com = max(("acordo", "proposta", "esperar"), key=lambda k: c[k].vp_escritorio)
    custo = c["esperar"].vp_cliente - c["proposta"].vp_cliente

    if com == "esperar":
        rec = f"ESPERAR — sentença em ~{t_sent:.0f} meses vale mais que qualquer acordo agora"
    elif com == "proposta":
        rec = ("PROPOR AO CLIENTE (+adicional) — "
               + ("o cliente também ganha em valor presente" if custo <= 0
                  else f"cliente abre mão de {brl(custo)} em valor presente pela antecipação"))
    else:
        rec = "ACORDO agora"
    return Analise(p, t_sent, c, sem, com, p_empate, custo, rec)


# --------------------------------------------------------------------------
# Carteira
# --------------------------------------------------------------------------

ESTRATEGIAS = (
    ("esperar_todos", "Não fazer acordo (só os sentenciados recebem a sentença)"),
    ("acordo_todos", "Acordo com todos agora"),
    ("acordo_todos_proposta", "Acordo com todos + adicional dos clientes"),
    ("otimo", "Ótimo por processo (sem proposta)"),
    ("otimo_proposta", "Ótimo por processo (com proposta)"),
    ("acordo_recentes", "Acordo só nos recentes; espera os perto da sentença"),
    ("acordo_exceto_estrategicos", "Acordo com todos menos os estratégicos"),
)


def escolha(a: Analise, estrategia: str, regras: dict[str, Any], estrategicos: set[str]) -> str:
    if "esperar" not in a.cenarios:
        return "acordo"
    if estrategia == "esperar_todos":
        return "esperar"
    if estrategia == "acordo_todos":
        return "acordo"
    if estrategia == "acordo_todos_proposta":
        return "proposta"
    if estrategia == "otimo":
        return a.melhor_sem_proposta
    if estrategia == "otimo_proposta":
        return a.melhor_com_proposta
    if estrategia == "acordo_recentes":
        return "proposta" if a.meses_ate_sentenca >= regras["limiar_recentes_meses"] else "esperar"
    if estrategia == "acordo_exceto_estrategicos":
        return "esperar" if a.processo.id in estrategicos else "proposta"
    raise ValueError(estrategia)


def vp_processo_novo(analises: list[Analise], regras: dict[str, Any]) -> dict[str, float]:
    """Valor presente, para o escritório, de UM processo novo captado hoje."""
    r = regras["reposicao"]
    procs = [a.processo for a in analises]
    base = r["base_media"] or (sum(p.base for p in procs) / len(procs))
    h = r["honorario_medio"] or (sum(p.honorario for p in procs) / len(procs))
    fc = r["fracao_construido"]
    if fc is None:
        fc = sum(p.construido for p in procs) / len(procs)
    div = regras["divisoes"][regras["divisao_padrao"]]
    t = regras["tempo"]["protocolo_ate_sentenca_meses"] + regras["tempo"]["sentenca_ate_pagamento_meses"]
    liquido = 1 - regras["aliquota_tributos"]
    vp = 0.0
    for tipo, peso in (("construido", fc), ("nao_construido", 1 - fc)):
        rest = capitalizar(base * regras["sentenca_esperada"][tipo], t, regras["taxa_atualizacao_judicial_anual"])
        esc = (rest * h * div["contratual"] + rest * regras["sucumbencia_esperada"] * div["sucumbencia"]) * liquido
        vp += peso * regras["p_procedencia"][tipo] * valor_presente(esc, t, regras["taxa_desconto_anual"])
    return {"base_media": base, "honorario_medio": h, "fracao_construido": fc,
            "meses_ate_receber": t, "vp_escritorio": vp}


def analisar_carteira(dados: dict[str, Any], regras: dict[str, Any]) -> dict[str, Any]:
    hoje = _data(dados["data_base"], "data_base") if dados.get("data_base") else date.today()
    processos = [processo_de_dict(d, regras) for d in dados.get("processos", [])]
    if not processos:
        raise DadoInvalido("carteira vazia")
    ids = [p.id for p in processos]
    if len(ids) != len(set(ids)):
        raise DadoInvalido("ids repetidos na carteira")
    estrategicos = {str(x) for x in dados.get("estrategicos", [])}
    desconhecidos = estrategicos - set(ids)
    if desconhecidos:
        raise DadoInvalido(f"estratégicos que não estão na carteira: {sorted(desconhecidos)}")

    analises = [analisar_processo(p, regras, hoje) for p in processos]
    novo = vp_processo_novo(analises, regras)

    estrategias: dict[str, Any] = {}
    for chave, titulo in ESTRATEGIAS:
        if chave == "acordo_exceto_estrategicos" and not estrategicos:
            continue
        vp_esc = vp_cli = nominal = 0.0
        caixa = {h: 0.0 for h in HORIZONTES_MESES}
        escolhas = {}
        for a in analises:
            k = escolha(a, chave, regras, estrategicos)
            c = a.cenarios[k]
            escolhas[a.processo.id] = k
            vp_esc += c.vp_escritorio
            vp_cli += c.vp_cliente
            nominal += c.probabilidade * c.escritorio
            for h in HORIZONTES_MESES:
                if c.meses <= h:
                    caixa[h] += c.probabilidade * c.escritorio
        estrategias[chave] = {"titulo": titulo, "vp_escritorio": vp_esc, "vp_clientes": vp_cli,
                              "nominal_esperado": nominal, "caixa_acumulado": caixa,
                              "escolhas": escolhas}

    referencia = max(v["vp_escritorio"] for v in estrategias.values())
    ritmo = regras["reposicao"]["novos_por_quinzena"] * novo["vp_escritorio"]
    for v in estrategias.values():
        sacrificio = referencia - v["vp_escritorio"]
        v["sacrificio_vs_melhor"] = sacrificio
        v["quinzenas_para_repor"] = (sacrificio / ritmo) if ritmo > 0 else None

    return {"data_base": hoje.isoformat(), "regras": regras, "analises": analises,
            "processo_novo": novo, "estrategias": estrategias, "estrategicos": sorted(estrategicos)}


# --------------------------------------------------------------------------
# Saída
# --------------------------------------------------------------------------

def relatorio_md(r: dict[str, Any]) -> str:
    g = r["regras"]
    L = [f"# Análise de acordos GAV — base {r['data_base']}", ""]
    L += ["## Premissas em uso", "",
          f"- Acordo sem sentença: construído {pct(g['acordo_sem_sentenca']['construido'], 0)}, "
          f"não construído {pct(g['acordo_sem_sentenca']['nao_construido'], 0)} da base (valor pago − corretagem), sem sucumbência.",
          f"- Sentença esperada (sem sentença nos autos): construído {pct(g['sentenca_esperada']['construido'], 0)}, "
          f"não construído {pct(g['sentenca_esperada']['nao_construido'], 0)}; sucumbência {pct(g['sucumbencia_esperada'], 0)}.",
          f"- Tempo protocolo→sentença {g['tempo']['protocolo_ate_sentenca_meses']} meses; "
          f"sentença→pagamento {g['tempo']['sentenca_ate_pagamento_meses']} mês; acordo pago em {g['prazo_pagamento_acordo_dias']} dias.",
          f"- Desconto {pct(g['taxa_desconto_anual'])} a.a.; atualização judicial {pct(g['taxa_atualizacao_judicial_anual'])} a.a.; "
          f"tributos {pct(g['aliquota_tributos'])}.",
          f"- Adicional do cliente: {pct(g['adicional_cliente']['valor'], 0)} ({g['adicional_cliente']['modo']}).",
          ""]

    L += ["## Por processo (valores do escritório em valor presente esperado)", "",
          "| # | Cliente | Fase | Meses p/ sentença | Base | Acordo | Proposta | Esperar | Prob. de empate | Recomendação |",
          "|---|---|---|---:|---:|---:|---:|---:|---:|---|"]
    for a in r["analises"]:
        p, c = a.processo, a.cenarios
        L.append(
            f"| {p.id} | {p.cliente} | {p.fase}{' · parceria' if p.parceria else ''} | "
            f"{a.meses_ate_sentenca:.0f} | {brl(p.base)} | {brl(c['acordo'].vp_escritorio)} | "
            f"{brl(c['proposta'].vp_escritorio) if 'proposta' in c else '—'} | "
            f"{brl(c['esperar'].vp_escritorio) if 'esperar' in c else '—'} | "
            f"{pct(a.p_empate, 0) if a.p_empate is not None else '—'} | {a.recomendacao} |")
    L += ["", "*Prob. de empate*: abaixo dessa chance de procedência, o acordo agora vale mais que esperar.", ""]

    L += ["## Estratégias para a carteira", "",
          "| Estratégia | VP escritório | Caixa em 3m | 6m | 12m | VP clientes | Abre mão vs melhor | Quinzenas p/ repor |",
          "|---|---:|---:|---:|---:|---:|---:|---:|"]
    for v in r["estrategias"].values():
        cx = v["caixa_acumulado"]
        q = v["quinzenas_para_repor"]
        L.append(f"| {v['titulo']} | {brl(v['vp_escritorio'])} | {brl(cx[3])} | {brl(cx[6])} | {brl(cx[12])} | "
                 f"{brl(v['vp_clientes'])} | {brl(v['sacrificio_vs_melhor'])} | {'—' if q is None else f'{q:.1f}'} |")
    n = r["processo_novo"]
    L += ["", f"Reposição: {g['reposicao']['novos_por_quinzena']} processos novos/quinzena; cada um vale "
          f"{brl(n['vp_escritorio'])} hoje para o escritório (base média {brl(n['base_media'])}, "
          f"honorário médio {pct(n['honorario_medio'])}, recebimento em ~{n['meses_ate_receber']:.0f} meses).", ""]

    pend = [(a.processo.id, a.processo.cliente, x) for a in r["analises"] for x in a.processo.premissas]
    if pend:
        L += ["## A confirmar (veio de premissa, não do processo)", ""]
        L += [f"- {pid} {cli}: {x}" for pid, cli, x in pend]
        L.append("")
    return "\n".join(L)


def relatorio_cliente(a: Analise) -> str:
    """Versão para conversar com o cliente: só os números dele."""
    p, c = a.processo, a.cenarios
    L = [f"# {p.cliente} — opções de recebimento", "",
         f"Base restituível (valor pago sem a corretagem): {brl(p.base)}", ""]
    if "esperar" not in c:
        ac = c["acordo"]
        L += [f"Sentença proferida: restituição de {brl(ac.restituicao)}.",
              f"Líquido para você após honorários ({pct(ac.honorario_aplicado)}): {brl(ac.cliente)}, "
              f"pago pela GAV em até 15 dias do acordo."]
        return "\n".join(L)
    ac, pr, es = c["acordo"], c["proposta"], c["esperar"]
    L += ["| Opção | Quando recebe | Você recebe (líquido) | Observação |", "|---|---|---:|---|",
          f"| Acordo agora | ~15 dias | {brl(pr.cliente)} | sem risco; honorários {pct(pr.honorario_aplicado)} |",
          f"| Aguardar a sentença | ~{es.meses:.0f} meses | {brl(es.cliente)} | se a ação for procedente; "
          f"a GAV ainda pode recorrer |", "",
          f"Em valor de hoje, aguardar equivale a {brl(es.vp_cliente)} (já considerando o risco e o tempo); "
          f"o acordo agora equivale a {brl(pr.vp_cliente)}."]
    return "\n".join(L)


def _para_json(r: dict[str, Any]) -> dict[str, Any]:
    def conv(o: Any) -> Any:
        if isinstance(o, (Analise, Processo, Cenario, Sentenca)):
            return conv(asdict(o))
        if isinstance(o, dict):
            return {str(k): conv(v) for k, v in o.items()}
        if isinstance(o, (list, tuple)):
            return [conv(x) for x in o]
        if isinstance(o, date):
            return o.isoformat()
        if isinstance(o, float):
            return round(o, 4)
        return o
    return conv(r)


def processo_da_pasta(nome: str) -> dict[str, Any]:
    """Esqueleto de processo a partir do nome da pasta, com fonte marcada.
    O que o nome não traz fica None — para ser preenchido, não adivinhado."""
    pa = nomes.analisar(nome)
    fonte = f"nome da pasta: {nome}"
    d: dict[str, Any] = {
        "id": str(pa.numero) if pa.numero is not None else None,
        "cliente": pa.cliente, "processo": pa.processo, "empreendimento": pa.empreendimento,
        "cotas": pa.cotas,
        "valor_pago": _dinheiro(pa.valor, "valor") if pa.valor else None,
        "honorario_contratual": pa.percentual / 100 if pa.percentual is not None else None,
        "corretagem": None, "data_protocolo": None, "contestado": None, "sentenca": None,
        "fontes": {},
        "faltando": [],
    }
    if d["valor_pago"] is not None:
        d["fontes"]["valor_pago"] = fonte
    if d["honorario_contratual"] is not None:
        d["fontes"]["honorario_contratual"] = fonte
    d["faltando"] = [k for k in ("valor_pago", "honorario_contratual", "corretagem", "empreendimento",
                                 "data_protocolo", "contestado") if d.get(k) is None]
    return d


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="gav-acordos", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("analisar")
    a.add_argument("carteira")
    a.add_argument("--regras")
    a.add_argument("--md")
    a.add_argument("--json")
    c = sub.add_parser("cliente")
    c.add_argument("carteira")
    c.add_argument("--id", required=True)
    c.add_argument("--regras")
    p = sub.add_parser("pasta")
    p.add_argument("nome")
    sub.add_parser("regras")
    args = ap.parse_args(argv)

    try:
        if args.cmd == "regras":
            print(json.dumps(REGRAS_PADRAO, ensure_ascii=False, indent=2))
            return 0
        if args.cmd == "pasta":
            print(json.dumps(processo_da_pasta(args.nome), ensure_ascii=False, indent=2))
            return 0
        regras = carregar_regras(args.regras)
        dados = json.loads(Path(args.carteira).read_text(encoding="utf-8"))
        r = analisar_carteira(dados, regras)
        if args.cmd == "cliente":
            alvo = [x for x in r["analises"] if x.processo.id == str(args.id)]
            if not alvo:
                raise DadoInvalido(f"id {args.id} não está na carteira")
            print(relatorio_cliente(alvo[0]))
            return 0
        md = relatorio_md(r)
        if args.md:
            Path(args.md).write_text(md, encoding="utf-8")
        if args.json:
            Path(args.json).write_text(json.dumps(_para_json(r), ensure_ascii=False, indent=2), encoding="utf-8")
        print(md)
        return 0
    except ErroEsteira as e:
        print(f"RECUSADO: {e}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
