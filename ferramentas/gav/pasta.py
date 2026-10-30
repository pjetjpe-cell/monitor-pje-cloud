"""Confere se a pasta do cliente está completa antes de subir ou compartilhar.

Uso:
    python3 -m gav.pasta --dir "C:/.../110. VALTEMIR URCINO 01 COTA 18% R$ 13.507,38" --para upload
    python3 -m gav.pasta --lista listagem.json --nome "110. VALTEMIR ..." --para compartilhar

`--lista` é a listagem da pasta interna vinda do Drive (search_files com
parentId), salva em JSON: [{"title": ..., "fileSize": ...}, ...].

Regra do escritório (30/10/2026): a pasta só é compartilhada com a equipe
quando estiver COMPLETA — incluindo o PDF da notificação de distrato enviada
pelo Gmail. Esta conferência é a trava; o agente não decide no olho.
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path
from typing import Any

from .nomes import PREFIXO_PETICAO, analisar, e_pasta_nao_usar, sem_acento

LIMITE_PJE = 3 * 1024 * 1024          # 3 MB por arquivo (margem sob os 4 MB do PJe)
EXT_DOC = (".pdf",)
EXT_EXTRATO = (".pdf", ".jpg", ".jpeg", ".png")


def _chave(nome: str) -> str:
    return sem_acento(nome).upper().strip()


def _item(arquivos: list[dict], prefixo: str, exts: tuple[str, ...]) -> list[dict]:
    alvo = _chave(prefixo)
    return [a for a in arquivos
            if _chave(a["nome"]).startswith(alvo) and a["nome"].lower().endswith(exts)]


def conferir(nome_pasta: str, arquivos: list[dict], para: str,
             tem_nao_usar: bool | None = None) -> dict[str, Any]:
    """arquivos: [{"nome": str, "bytes": int}]. para: organizar|upload|compartilhar."""
    faltas: list[str] = []
    grandes: list[str] = []
    avisos: list[str] = []

    p = analisar(nome_pasta)
    for campo, rotulo in [("numero", "número"), ("cliente", "nome do cliente"),
                          ("cotas", "quantidade de cotas"), ("percentual", "percentual"),
                          ("valor", "valor R$")]:
        if getattr(p, campo) in (None, ""):
            faltas.append(f"nome da pasta sem {rotulo} (padrão: NNN. NOME XX COTA PP% R$ VALOR)")

    exigidos = [
        ("01 PROCURAÇÃO", EXT_DOC),
        ("02 RG", EXT_DOC),
        ("03 EXTRATO DE PAGAMENTOS", EXT_EXTRATO),
        (PREFIXO_PETICAO.strip(), EXT_DOC),
    ]
    if para == "compartilhar":
        exigidos.append(("08 NOTIFICAÇÃO EXTRAJUDICIAL", EXT_DOC))
    for prefixo, exts in exigidos:
        if not _item(arquivos, prefixo, exts):
            faltas.append(f"falta '{prefixo}' ({'/'.join(exts)})")

    contrato = _item(arquivos, "04 CONTRATO", EXT_DOC)
    if not contrato:
        faltas.append("falta '04 CONTRATO' (.pdf)")
    else:
        partes = [a for a in contrato if "PARTE" in _chave(a["nome"])]
        if partes:
            totais = {m.group(2) for a in partes if (m := re.search(r"PARTE\s*(\d+)\s*-\s*(\d+)", _chave(a["nome"])))}
            if len(totais) != 1:
                faltas.append("partes do contrato com totais diferentes (PARTE x-N)")
            else:
                n = int(totais.pop())
                achadas = {int(m.group(1)) for a in partes if (m := re.search(r"PARTE\s*(\d+)", _chave(a["nome"])))}
                for k in range(1, n + 1):
                    if k not in achadas:
                        faltas.append(f"falta 04 CONTRATO PARTE {k}-{n}")

    if para in ("upload", "compartilhar") and tem_nao_usar is False:
        faltas.append("falta a pasta NAO USAR com os originais")

    conhecidos = ("01 ", "02 ", "03 ", "04 ", "06 ", "07 ", "08 ", _chave(PREFIXO_PETICAO)[:15])
    for a in arquivos:
        if a.get("bytes") is not None and a["bytes"] > LIMITE_PJE:
            grandes.append(f"{a['nome']} tem {a['bytes'] / 1048576:.1f} MB (> 3 MB): comprimir ou dividir")
        if not _chave(a["nome"]).startswith(conhecidos):
            avisos.append(f"arquivo fora da numeração: {a['nome']}")

    ok = not faltas and not grandes
    return {"pasta": nome_pasta, "para": para, "aprovado": ok,
            "faltas": faltas, "acima_de_3mb": grandes, "avisos": avisos}


def _de_diretorio(d: Path) -> tuple[list[dict], bool]:
    arquivos = [{"nome": f.name, "bytes": f.stat().st_size} for f in sorted(d.iterdir()) if f.is_file()]
    vizinhos = list(d.parent.iterdir()) + list(d.iterdir())
    tem_nao_usar = any(v.is_dir() and e_pasta_nao_usar(v.name) for v in vizinhos)
    return arquivos, tem_nao_usar


def _de_lista(caminho: Path) -> list[dict]:
    dados = json.loads(caminho.read_text(encoding="utf-8"))
    if isinstance(dados, dict):
        dados = dados.get("files", [])
    return [{"nome": x.get("title") or x.get("nome") or x.get("name"),
             "bytes": int(x["fileSize"]) if x.get("fileSize") else x.get("bytes")}
            for x in dados if (x.get("mimeType") or "") != "application/vnd.google-apps.folder"]


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="gav-pasta", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--dir", help="pasta interna local (a que tem 01-04 e a petição)")
    ap.add_argument("--lista", help="JSON da listagem da pasta interna no Drive")
    ap.add_argument("--nome", help="nome da pasta (obrigatório com --lista)")
    ap.add_argument("--nao-usar", choices=["sim", "nao"], help="com --lista: existe NÃO USAR ao lado?")
    ap.add_argument("--para", choices=["organizar", "upload", "compartilhar"], required=True)
    a = ap.parse_args(argv)
    if a.dir:
        d = Path(a.dir)
        arquivos, tem_nu = _de_diretorio(d)
        r = conferir(d.name, arquivos, a.para, tem_nu)
    elif a.lista and a.nome:
        tem_nu = None if a.nao_usar is None else a.nao_usar == "sim"
        r = conferir(a.nome, _de_lista(Path(a.lista)), a.para, tem_nu)
    else:
        ap.error("use --dir, ou --lista com --nome")
    print(json.dumps(r, ensure_ascii=False, indent=2))
    print("APROVADO" if r["aprovado"] else "REPROVADO — não siga para a próxima etapa")
    return 0 if r["aprovado"] else 1


if __name__ == "__main__":
    sys.exit(main())
