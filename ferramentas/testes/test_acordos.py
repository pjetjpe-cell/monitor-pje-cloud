"""Testes da análise de acordos GAV.

Roda com: python3 -m pytest ferramentas/testes/test_acordos.py
     ou:  python3 ferramentas/testes/test_acordos.py

Cobre as contas que o escritório confere à mão (75%/80%/50%, corretagem fora,
sucumbência só com sentença, divisão), as travas (sem fonte não calcula) e a
coerência das estratégias da carteira.
"""

import io
import json
import sys
import tempfile
from contextlib import redirect_stdout
from datetime import date
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))

from gav import acordos  # noqa: E402
from gav.acordos import DadoInvalido, analisar_carteira, carregar_regras, processo_de_dict  # noqa: E402
from gav.nucleo import SemFonte  # noqa: E402

HOJE = date(2026, 11, 13)
F = "teste"


def _verde(msg): print(f"  ok   {msg}")


def _proc(**kw):
    d = {
        "id": "1", "cliente": "CLIENTE TESTE", "empreendimento": "PORTO 2 LIFE",
        "valor_pago": 62200.32, "corretagem": 3990, "honorario_contratual": 16,
        "data_protocolo": "2026-05-13", "contestado": True,
        "fontes": {"valor_pago": F, "corretagem": F, "honorario_contratual": F},
    }
    d.update(kw)
    return d


def _perto(a, b, tol=0.01):
    assert abs(a - b) <= tol, f"{a} != {b}"


def test_acordo_sem_sentenca_construido():
    r = carregar_regras()
    p = processo_de_dict(_proc(), r)
    assert p.construido and p.honorario == 0.16
    _perto(p.base, 58210.32)
    c = acordos.cenarios(p, r, HOJE)
    _perto(c["acordo"].restituicao, 43657.74)
    assert c["acordo"].sucumbencia == 0, "acordo sem sentença não paga sucumbência"
    _perto(c["acordo"].contratual_total, 6985.24)
    _perto(c["acordo"].escritorio, 6985.24 / 3)
    _perto(c["acordo"].cliente, 43657.74 - 6985.24)
    _verde("sem sentença, construído: 75% da base sem corretagem, sem sucumbência")


def test_sentenca_80_com_sucumbencia():
    r = carregar_regras()
    p = processo_de_dict(_proc(sentenca={"percentual": 80, "sucumbencia": 10},
                               fontes={"valor_pago": F, "corretagem": F,
                                       "honorario_contratual": F, "sentenca": "sentença.pdf"}), r)
    c = acordos.cenarios(p, r, HOJE)
    assert set(c) == {"acordo"}, "sentenciado só tem o acordo que paga a sentença"
    _perto(c["acordo"].restituicao, 46568.26)
    _perto(c["acordo"].sucumbencia, 4656.83)
    _perto(c["acordo"].escritorio, (7450.92 + 4656.83) / 3)
    _verde("sentença 80% + 10%: GAV paga tudo, honorários sucumbenciais inclusive")


def test_valor_condenacao_liquidado_prevalece():
    r = carregar_regras()
    p = processo_de_dict(_proc(sentenca={"percentual": 75, "sucumbencia": 15, "valor_condenacao": "50.000,00"},
                               fontes={"valor_pago": F, "corretagem": F,
                                       "honorario_contratual": F, "sentenca": F}), r)
    c = acordos.cenarios(p, r, HOJE)["acordo"]
    _perto(c.restituicao, 50000)
    _perto(c.sucumbencia, 7500)
    _verde("valor de condenação já liquidado substitui a conta por percentual")


def test_nao_construido_50():
    r = carregar_regras()
    p = processo_de_dict(_proc(empreendimento="Oikos Maragogi"), r)
    assert not p.construido
    c = acordos.cenarios(p, r, HOJE)
    _perto(c["acordo"].restituicao, 58210.32 * 0.5)
    _verde("não construído: 50%, corretagem fora")


def test_sem_fonte_recusa():
    r = carregar_regras()
    for campo in ("valor_pago", "corretagem", "honorario_contratual"):
        d = _proc()
        del d["fontes"][campo]
        try:
            processo_de_dict(d, r)
            raise AssertionError(f"aceitou {campo} sem fonte")
        except SemFonte:
            pass
    try:
        processo_de_dict(_proc(sentenca={"percentual": 80, "sucumbencia": 10}), r)
        raise AssertionError("aceitou sentença sem fonte")
    except SemFonte:
        pass
    try:
        processo_de_dict(_proc(sentenca={"sucumbencia": 10},
                               fontes={"valor_pago": F, "corretagem": F, "honorario_contratual": F,
                                       "sentenca": F}), r)
        raise AssertionError("aceitou sentença sem percentual")
    except DadoInvalido:
        pass
    _verde("dado sem fonte ou sentença sem percentual: recusa")


def test_empreendimento_desconhecido_recusa():
    r = carregar_regras()
    try:
        processo_de_dict(_proc(empreendimento="MURO ALTO"), r)
        raise AssertionError("adivinhou o status de obra")
    except DadoInvalido as e:
        assert "construído" in str(e)
    p = processo_de_dict(_proc(empreendimento="MURO ALTO", construido=False,
                               fontes={"valor_pago": F, "corretagem": F, "honorario_contratual": F,
                                       "construido": "usuário"}), r)
    assert not p.construido
    _verde("empreendimento fora do mapa: pergunta em vez de adivinhar")


def test_adicional_do_cliente():
    r = carregar_regras()
    _perto(acordos.honorario_com_adicional(0.16, r), 0.23, 1e-9)
    r["adicional_cliente"]["modo"] = "proporcional"
    _perto(acordos.honorario_com_adicional(0.16, r), 0.1712, 1e-9)
    r = carregar_regras()
    c = acordos.cenarios(processo_de_dict(_proc(), r), r, HOJE)
    _perto(c["proposta"].restituicao, c["acordo"].restituicao)
    _perto(c["proposta"].contratual_total, 43657.74 * 0.23)
    assert c["proposta"].cliente < c["acordo"].cliente
    _verde("proposta: +7 pontos só nos contratuais, mesma restituição")


def test_tempo_processo_antigo_vs_recente():
    r = carregar_regras()
    antigo = processo_de_dict(_proc(data_protocolo="2025-08-01"), r)
    recente = processo_de_dict(_proc(data_protocolo="2026-10-20", contestado=False), r)
    t_ant = acordos.meses_ate_sentenca(antigo, r, HOJE)
    t_rec = acordos.meses_ate_sentenca(recente, r, HOJE)
    assert t_ant == r["tempo"]["minimo_restante_contestado_meses"], t_ant
    assert 14 < t_rec < 15, t_rec
    c_ant = acordos.cenarios(antigo, r, HOJE)["esperar"]
    c_rec = acordos.cenarios(recente, r, HOJE)["esperar"]
    assert c_ant.meses < c_rec.meses
    _verde("tempo: antigo perto da sentença (piso), recente com o prazo quase cheio")


def test_probabilidade_de_empate():
    r = carregar_regras()
    a = acordos.analisar_processo(processo_de_dict(_proc(), r), r, HOJE)
    p2 = processo_de_dict(_proc(p_procedencia=a.p_empate), r)
    c = acordos.cenarios(p2, r, HOJE)
    _perto(c["esperar"].vp_escritorio, c["acordo"].vp_escritorio)
    _verde("na probabilidade de empate, esperar e acordo valem o mesmo")


def test_divisao():
    r = carregar_regras()
    p3 = processo_de_dict(_proc(), r)
    p2 = processo_de_dict(_proc(divisao="dois"), r)
    px = processo_de_dict(_proc(divisao={"contratual": 0.5, "sucumbencia": 1}), r)
    e3 = acordos.cenarios(p3, r, HOJE)["acordo"].escritorio
    e2 = acordos.cenarios(p2, r, HOJE)["acordo"].escritorio
    _perto(e2, e3 * 1.5)
    assert any("divisão" in x for x in p3.premissas), "divisão padrão tem de aparecer como premissa"
    assert not any("divisão" in x for x in p2.premissas)
    assert px.divisao == {"contratual": 0.5, "sucumbencia": 1.0}
    _verde("divisão por três, por dois e explícita; padrão sinalizado")


def _carteira():
    fs = {"valor_pago": F, "corretagem": F, "honorario_contratual": F}
    return {
        "data_base": "2026-11-13",
        "estrategicos": ["3"],
        "processos": [
            _proc(id="1", data_protocolo="2025-06-01"),
            _proc(id="2", data_protocolo="2026-10-01", contestado=False, valor_pago=150000),
            _proc(id="3", empreendimento="OIKOS MARAGOGI", data_protocolo="2026-03-01"),
            _proc(id="4", sentenca={"percentual": 75, "sucumbencia": 10},
                  fontes={**fs, "sentenca": F}, parceria=True),
        ],
    }


def test_carteira_estrategias_coerentes():
    r = carregar_regras()
    res = analisar_carteira(_carteira(), r)
    e = res["estrategias"]
    vp = {k: v["vp_escritorio"] for k, v in e.items()}
    assert vp["otimo"] >= max(vp["acordo_todos"], vp["esperar_todos"]) - 1e-6
    assert vp["otimo_proposta"] >= vp["otimo"] - 1e-6
    assert min(v["sacrificio_vs_melhor"] for v in e.values()) == 0
    for v in e.values():
        assert v["escolhas"]["4"] == "acordo", "sentenciado sempre recebe a sentença"
    assert e["acordo_exceto_estrategicos"]["escolhas"]["3"] == "esperar"
    # Acordo com todos põe mais caixa nos primeiros meses que esperar.
    assert e["acordo_todos"]["caixa_acumulado"][3] > e["esperar_todos"]["caixa_acumulado"][3]
    assert res["processo_novo"]["vp_escritorio"] > 0
    _verde("carteira: ótimo domina, sentenciado sempre fecha, estratégicos seguram")


def test_ids_e_estrategicos_validados():
    r = carregar_regras()
    c = _carteira()
    c["estrategicos"] = ["99"]
    try:
        analisar_carteira(c, r)
        raise AssertionError("aceitou estratégico inexistente")
    except DadoInvalido:
        pass
    c = _carteira()
    c["processos"][1]["id"] = "1"
    try:
        analisar_carteira(c, r)
        raise AssertionError("aceitou id repetido")
    except DadoInvalido:
        pass
    _verde("estratégico inexistente e id repetido: recusa")


def test_pasta_vira_esqueleto():
    d = acordos.processo_da_pasta("86. SIBELY MARTELLO - 02 COTAS - 16% - R$ 62.200,32")
    assert d["id"] == "86" and d["honorario_contratual"] == 0.16
    _perto(d["valor_pago"], 62200.32)
    assert "corretagem" in d["faltando"] and "data_protocolo" in d["faltando"]
    assert d["fontes"]["valor_pago"].startswith("nome da pasta")
    _verde("nome da pasta vira esqueleto com fonte; o resto fica pendente")


def test_cli():
    with tempfile.TemporaryDirectory() as tmp:
        cart = Path(tmp) / "c.json"
        cart.write_text(json.dumps(_carteira()), encoding="utf-8")
        md, js = Path(tmp) / "r.md", Path(tmp) / "r.json"
        buf = io.StringIO()
        with redirect_stdout(buf):
            assert acordos.main(["analisar", str(cart), "--md", str(md), "--json", str(js)]) == 0
        assert "Estratégias para a carteira" in md.read_text(encoding="utf-8")
        assert json.loads(js.read_text(encoding="utf-8"))["estrategias"]
        buf = io.StringIO()
        with redirect_stdout(buf):
            assert acordos.main(["cliente", str(cart), "--id", "2"]) == 0
        txt = buf.getvalue()
        assert "Acordo agora" in txt and "escritório" not in txt.lower()
        ruim = _carteira()
        del ruim["processos"][0]["fontes"]["corretagem"]
        cart.write_text(json.dumps(ruim), encoding="utf-8")
        assert acordos.main(["analisar", str(cart)]) == 2
    _verde("CLI: relatório, JSON, versão do cliente sem números do escritório, recusa sem fonte")


if __name__ == "__main__":
    testes = [v for k, v in sorted(globals().items()) if k.startswith("test_")]
    for t in testes:
        t()
    print(f"\n{len(testes)} testes ok")
