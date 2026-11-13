"""Painel geral de processos (TJPE/Ipojuca): números do Drive -> DataJud -> fase -> planilha.

    # titulos.txt = um título de pasta/arquivo por linha (exporte da busca do Drive)
    python3 -m gav.painel --titulos titulos.txt --saida PAINEL.xlsx [--nomes nomes.json] [--comarca 8.17.2730]

Passos (cada um confere o que fez):
 1. extrai números CNJ dos títulos; repara zeros à esquerda e SÓ aceita o número cujo
    dígito verificador (módulo 97) fechar — nada de chute;
 2. consulta o DataJud (API pública do CNJ; a chave é pública e o CNJ a troca de tempos em
    tempos: se der 401, copie a vigente de https://datajud-wiki.cnj.jus.br/api-publica/acesso);
 3. a VARA vem do órgão julgador, nunca da paridade do número (par/ímpar é sorteio);
 4. deriva a fase (gav.fases) e grava uma aba por vara, resumo por fase e pendências.
"""
from __future__ import annotations

import argparse, collections, concurrent.futures as cf, json, re, subprocess, sys
from pathlib import Path

from . import fases

CHAVE_PUBLICA = "cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=="  # pública; ver docstring


def dv_ok(n7: str, dd: str, ano: str, j: str, tr: str, oooo: str) -> bool:
    base = f"{int(n7):07d}{ano}{j}{tr}{oooo}"
    return (98 - (int(base + "00") % 97)) == int(dd)


def extrair_numeros(titulos: list[str], comarca: str = "8.17.2730") -> tuple[dict[str, list[str]], list[str]]:
    """{numero_cnj: [titulos]} e a lista de rejeitados (DV não fecha)."""
    j, tr, oooo = comarca.split(".")
    rx = re.compile(r"(?<![\d.])(\d{1,7})-(\d{2})\.(20\d{2})\." + re.escape(comarca))
    achados: dict[str, list[str]] = collections.defaultdict(list)
    rejeitados: list[str] = []
    for t in titulos:
        for m in rx.finditer(t):
            n7, dd, ano = m.groups()
            cand = [n7] + ([n7.zfill(7)] if len(n7) < 7 else [])
            ok = next((c for c in cand if dv_ok(c, dd, ano, j, tr, oooo)), None)
            if ok is None:
                rejeitados.append(m.group(0)); continue
            achados[f"{int(ok):07d}-{dd}.{ano}.{comarca}"].append(t)
    return dict(achados), rejeitados


def cnj_plano(n: str) -> str:
    return n.replace(".", "").replace("-", "")


def consultar(numeros: list[str], tribunal: str = "tjpe", chave: str = CHAVE_PUBLICA, lote: int = 13) -> dict[str, list[dict]]:
    def um(nums):
        corpo = {"size": 100, "query": {"terms": {"numeroProcesso": [cnj_plano(n) for n in nums]}}}
        for _ in range(3):
            r = subprocess.run(["curl", "-sS", "-m", "170", "-X", "POST", f"https://api-publica.datajud.cnj.jus.br/api_publica_{tribunal}/_search",
                                "-H", f"Authorization: APIKey {chave}", "-H", "Content-Type: application/json", "-d", json.dumps(corpo)],
                               capture_output=True, text=True)
            try:
                d = json.loads(r.stdout)
            except ValueError:
                continue
            if d.get("status") == 401:
                raise SystemExit("DataJud recusou a chave (401): copie a vigente da wiki do CNJ.")
            return d.get("hits", {}).get("hits", [])
        return []
    bruto: dict[str, list[dict]] = {}
    grupos = [numeros[i:i + lote] for i in range(0, len(numeros), lote)]
    with cf.ThreadPoolExecutor(6) as ex:
        for hits in ex.map(um, grupos):
            for h in hits:
                bruto.setdefault(h["_source"]["numeroProcesso"], []).append(h["_source"])
    return bruto


def linhas(achados: dict[str, list[str]], bruto: dict[str, list[dict]], nomes: dict[str, str] | None = None) -> list[dict]:
    nomes = nomes or {}
    out = []
    for cnj, tits in sorted(achados.items()):
        hits = bruto.get(cnj_plano(cnj))
        d = int(cnj[6])
        base = {"CLIENTE": nomes.get(cnj[:10], "(identificar)"), "PROCESSO": cnj, "FINAL (antes do traço)": d, "PARIDADE": "PAR" if d % 2 == 0 else "ÍMPAR"}
        g1 = next((h for h in hits or [] if h.get("grau") == "G1"), None)
        if not g1:
            out.append({**base, "TIPO": "A CONFERIR", "VARA": "(conferir no PJe)", "FASE (derivada)": "NÃO ENCONTRADO NO DATAJUD (ajuizamento recente?)",
                        "PENDÊNCIA / PRÓXIMO PASSO": "Consultar no PJe e informar a vara", "PRIORIDADE": "MÉDIA", "FONTE": "Drive (nome do arquivo)"}); continue
        g2 = next((h for h in hits if h.get("grau") == "G2"), None)
        f, det, pend, prio, regra = fases.fase_de(g1, g2)
        mv = sorted(g1["movimentos"], key=lambda m: m["dataHora"]); u = mv[-1]
        oj = g1["orgaoJulgador"]["nome"]; aj = g1["dataAjuizamento"]
        out.append({**base, "TIPO": "CLIENTE" if cnj[:10] in nomes else "A IDENTIFICAR", "VARA": oj.title().replace(" Da Comarca De ", " de "),
                    "CLASSE": g1["classe"]["nome"], "AJUIZADO EM": f"{aj[6:8]}/{aj[4:6]}/{aj[:4]}", "FASE (derivada)": f, "DETALHE DA FASE": det,
                    "ÚLTIMA MOVIMENTAÇÃO": fases.rotulo(u), "DATA ÚLTIMA MOV.": fases.data(u).strftime("%d/%m/%Y"), "DIAS SEM MOVIMENTO": (fases.HOJE - fases.data(u)).days,
                    "PENDÊNCIA / PRÓXIMO PASSO": pend, "PRIORIDADE": prio, "RECURSO NO TJPE": g2["orgaoJulgador"]["nome"] if g2 else "", "REGRA APLICADA": regra,
                    "FONTE": f"DataJud/CNJ em {fases.HOJE.strftime('%d/%m/%Y')}"})
    return out


def xlsx(rows: list[dict], saida: Path) -> Path:
    from openpyxl import Workbook
    from openpyxl.styles import Alignment, Font, PatternFill
    cols = ["TIPO", "CLIENTE", "PROCESSO", "VARA", "PARIDADE", "FASE (derivada)", "DETALHE DA FASE", "PENDÊNCIA / PRÓXIMO PASSO", "PRIORIDADE",
            "ÚLTIMA MOVIMENTAÇÃO", "DATA ÚLTIMA MOV.", "DIAS SEM MOVIMENTO", "CLASSE", "AJUIZADO EM", "RECURSO NO TJPE", "REGRA APLICADA", "FONTE"]
    ordem = {"ALTA": 0, "MÉDIA": 1, "BAIXA": 2}
    cor = {"ALTA": "F8D7DA", "MÉDIA": "FFF3CD", "BAIXA": "E2F0D9"}
    wb = Workbook(); wb.remove(wb.active)
    def aba(nome, rs):
        ws = wb.create_sheet(nome[:31]); ws.append(cols)
        for r in sorted(rs, key=lambda r: (ordem.get(r.get("PRIORIDADE"), 3), -(r.get("DIAS SEM MOVIMENTO") or 0))): ws.append([r.get(c, "") for c in cols])
        for i, c in enumerate(ws[1], 1):
            c.fill = PatternFill("solid", fgColor="1F3A5F"); c.font = Font(color="FFFFFF", bold=True); ws.column_dimensions[c.column_letter].width = 26
        pi = cols.index("PRIORIDADE") + 1
        for row in ws.iter_rows(min_row=2):
            for c in row: c.alignment = Alignment(wrap_text=True, vertical="top")
            v = row[pi - 1].value
            if v in cor: row[pi - 1].fill = PatternFill("solid", fgColor=cor[v])
        ws.freeze_panes = "D2"; ws.auto_filter.ref = ws.dimensions
    aba("PAINEL GERAL", rows)
    for n in ("1", "2"):
        aba(f"{n}ª VARA CÍVEL", [r for r in rows if r.get("VARA", "").startswith(n)])
    aba("AÇÃO PENDENTE (ALTA)", [r for r in rows if r.get("PRIORIDADE") == "ALTA"])
    tab = collections.Counter((r["VARA"][:2], r["PARIDADE"]) for r in rows if r.get("VARA", "")[:1].isdigit())
    ws = wb.create_sheet("PAR x ÍMPAR x VARA"); ws.append(["", "PAR", "ÍMPAR"])
    for v in ("1ª", "2ª"): ws.append([f"{v} Vara", tab[(v, "PAR")], tab[(v, "ÍMPAR")]])
    ws.append(["A vara vem do órgão julgador do CNJ; paridade do número não a determina (sorteio)."])
    saida.parent.mkdir(parents=True, exist_ok=True); wb.save(saida); return saida


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="gav.painel", description=__doc__.splitlines()[0])
    ap.add_argument("--titulos", required=True); ap.add_argument("--saida", required=True)
    ap.add_argument("--nomes", help='JSON {"0001835-59": "Fulano"} (chave = 10 primeiros caracteres do número)')
    ap.add_argument("--comarca", default="8.17.2730"); ap.add_argument("--tribunal", default="tjpe")
    a = ap.parse_args(argv)
    titulos = [l.rstrip("\n") for l in open(a.titulos, encoding="utf-8")]
    achados, rej = extrair_numeros(titulos, a.comarca)
    print(f"{len(achados)} números válidos | {len(rej)} rejeitados pelo dígito verificador {rej[:5]}")
    bruto = consultar(sorted(achados), a.tribunal)
    rows = linhas(achados, bruto, json.load(open(a.nomes)) if a.nomes else None)
    print(f"{sum(1 for r in rows if r['VARA'][:1].isdigit())}/{len(rows)} encontrados no DataJud")
    print(xlsx(rows, Path(a.saida))); return 0


if __name__ == "__main__":
    sys.exit(main())
