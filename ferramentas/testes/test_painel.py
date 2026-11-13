"""Testes do painel: validação do número CNJ, reparo de zeros, paridade e fases (sem rede).

Roda com: python3 ferramentas/testes/test_painel.py
"""
import datetime as dt
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from gav import fases, painel  # noqa: E402


def test_aceita_numero_valido_e_repara_zeros():
    a, rej = painel.extrair_numeros(["0001835-59.2025.8.17.2730 Porto Alto", "1835-59.2025.8.17.2730 sem zeros"])
    assert list(a) == ["0001835-59.2025.8.17.2730"] and not rej and len(a["0001835-59.2025.8.17.2730"]) == 2


def test_rejeita_quando_o_digito_verificador_nao_fecha():
    a, rej = painel.extrair_numeros(["0001835-60.2025.8.17.2730 dv errado", "0963-11.2026.8.17.2730 dv errado"])
    assert not a and len(rej) == 2


def test_paridade_e_do_digito_antes_do_traco():
    assert int("0001835-59"[6]) % 2 == 1 and int("0001808-76"[6]) % 2 == 0   # 5 ímpar; 8 par


def _mov(nome, data, **comp):
    return {"nome": nome, "dataHora": data + "T10:00:00.000Z", "complementosTabelados": [{"descricao": k, "nome": v} for k, v in comp.items()]}


def _g1(movs, classe="Procedimento Comum Cível"):
    return {"classe": {"nome": classe}, "orgaoJulgador": {"nome": "2ª VARA CÍVEL DA COMARCA DE IPOJUCA"}, "movimentos": movs, "grau": "G1"}


def test_contestacao_sem_replica_vira_falta_replica():
    fases.HOJE = dt.date(2026, 11, 13)
    f = fases.fase_de(_g1([_mov("Distribuição", "2026-01-10"), _mov("Petição", "2026-03-01", tipo_de_peticao="Contestação")]), None)
    assert f[0] == "FALTA RÉPLICA" and f[3] == "ALTA"


def test_replica_depois_da_contestacao_e_concluso_para_despacho():
    fases.HOJE = dt.date(2026, 11, 13)
    f = fases.fase_de(_g1([_mov("Petição", "2026-03-01", tipo_de_peticao="Contestação"), _mov("Petição", "2026-03-20", tipo_de_peticao="Replica"),
                          _mov("Conclusão", "2026-04-01", tipo_de_conclusao="para despacho")]), None)
    assert f[0] == "RÉPLICA JUNTADA — CONCLUSO PARA DESPACHO"


def test_sentenca_sem_recurso_e_prazo_recursal_e_com_transito_e_transitada():
    fases.HOJE = dt.date(2026, 11, 13)
    s = [_mov("Distribuição", "2026-01-10"), _mov("Procedência em Parte", "2026-07-20")]
    assert fases.fase_de(_g1(s), None)[0] == "SENTENCIADO — PRAZO RECURSAL"
    assert fases.fase_de(_g1(s + [_mov("Trânsito em julgado", "2026-09-21")]), None)[0] == "SENTENÇA TRANSITADA EM JULGADO"


def test_desistencia_com_arquivamento_e_extinto():
    f = fases.fase_de(_g1([_mov("Desistência", "2026-02-02"), _mov("Definitivo", "2026-03-10")]), None)
    assert f[0] == "EXTINTO POR DESISTÊNCIA — ARQUIVADO" and f[3] == "BAIXA"


if __name__ == "__main__":
    falhas = 0
    for nome, fn in list(globals().items()):
        if nome.startswith("test_"):
            try:
                fn(); print(f"  ok   {nome}")
            except Exception as e:  # noqa: BLE001
                falhas += 1; print(f"  FALHOU {nome}: {e!r}")
    sys.exit(1 if falhas else 0)
