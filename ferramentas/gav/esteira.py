"""CLI do dossiê: estado da esteira, campos com fonte e marcação de etapas.

    python3 -m gav.esteira iniciar  --dossie d.json --cliente "JANICE BRUTTI" \
                                    --pasta-id 1uNsi... 
    python3 -m gav.esteira campo    --dossie d.json --nome cpf --valor 026.621.010-40 \
                                    --fonte drive:1FXa4s --pagina 1 --trecho "OUTORGANTE"
    python3 -m gav.esteira marcar   --dossie d.json --etapa procuracao --status ok \
                                    --evidencia saida="01 - PROCURAÇÃO.pdf" --evidencia removidas=7
    python3 -m gav.esteira status   --dossie d.json
    python3 -m gav.esteira proxima  --dossie d.json
"""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

from .nucleo import (
    ETAPAS, ORDEM_ETAPAS, Dossie, EtapaBloqueada, Fonte, SemFonte, VerificacaoFalhou,
)


def _fonte_de_texto(texto: str, pagina: int | None, trecho: str | None) -> Fonte:
    """Aceita 'tipo:referencia', ex.: 'drive:1FXa4s' ou 'arquivo:/tmp/x.pdf'."""
    if ":" not in texto:
        raise SemFonte(
            f"fonte {texto!r} malformada. Use tipo:referencia — "
            f"tipos: {', '.join(Fonte.TIPOS)}. Ex.: drive:1FXa4stg, usuario:perguntei-no-chat"
        )
    tipo, referencia = texto.split(":", 1)
    return Fonte(tipo=tipo.strip(), referencia=referencia.strip(), pagina=pagina, trecho=trecho)


def _pares(valores: list[str]) -> dict[str, str]:
    saida: dict[str, str] = {}
    for item in valores or []:
        if "=" not in item:
            raise ValueError(f"evidência {item!r} precisa ser chave=valor")
        chave, valor = item.split("=", 1)
        saida[chave.strip()] = valor.strip()
    return saida


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="gav-esteira", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="comando", required=True)

    def com_dossie(p):
        p.add_argument("--dossie", required=True, help="caminho do dossie.json")
        return p

    p_ini = com_dossie(sub.add_parser("iniciar", help="cria o dossiê do cliente"))
    p_ini.add_argument("--cliente", required=True)
    p_ini.add_argument("--pasta-id", required=True, help="fileId da pasta no Drive")
    p_ini.add_argument("--pasta-nome", default="")

    p_campo = com_dossie(sub.add_parser("campo", help="grava um campo com fonte"))
    p_campo.add_argument("--nome", required=True)
    p_campo.add_argument("--valor", required=True)
    p_campo.add_argument("--fonte", required=True, help="tipo:referencia")
    p_campo.add_argument("--pagina", type=int)
    p_campo.add_argument("--trecho")

    p_marcar = com_dossie(sub.add_parser("marcar", help="registra o resultado de uma etapa"))
    p_marcar.add_argument("--etapa", required=True, choices=ORDEM_ETAPAS)
    p_marcar.add_argument("--status", required=True, choices=["ok", "falhou", "pendente"])
    p_marcar.add_argument("--detalhe", default="")
    p_marcar.add_argument("--evidencia", action="append", metavar="CHAVE=VALOR")

    com_dossie(sub.add_parser("status", help="relatório do que falta"))
    com_dossie(sub.add_parser("proxima", help="diz qual é a próxima etapa liberada"))

    p_checar = com_dossie(sub.add_parser("checar", help="verifica se uma etapa pode rodar"))
    p_checar.add_argument("--etapa", required=True, choices=ORDEM_ETAPAS)

    args = ap.parse_args(argv)
    dossie = Dossie(args.dossie)

    try:
        if args.comando == "iniciar":
            fonte = Fonte("drive", args.pasta_id)
            dossie.definir("cliente_nome", args.cliente, fonte)
            dossie.definir("pasta_id", args.pasta_id, fonte)
            if args.pasta_nome:
                dossie.definir("pasta_nome", args.pasta_nome, fonte)
            dossie.salvar()
            print(f"Dossiê criado: {args.dossie}")
            print(f"Próxima etapa: localizar — {ETAPAS['localizar']['titulo']}")
            return 0

        if args.comando == "campo":
            dossie.definir(args.nome, args.valor,
                           _fonte_de_texto(args.fonte, args.pagina, args.trecho))
            dossie.salvar()
            print(f"{args.nome} = {args.valor!r}  (fonte: {args.fonte})")
            return 0

        if args.comando == "marcar":
            if args.status == "ok":
                dossie.exigir(args.etapa)  # trava: pré-requisito pendente barra aqui
            dossie.registrar(args.etapa, args.status, args.detalhe, _pares(args.evidencia))
            dossie.salvar()
            print(f"{args.etapa}: {args.status}")
            faltam = dossie.pendencias()
            print("Pendente: " + (", ".join(faltam) if faltam else "nada — esteira completa"))
            return 0

        if args.comando == "status":
            print(dossie.relatorio())
            return 0

        if args.comando == "proxima":
            for etapa in ORDEM_ETAPAS:
                if dossie.status_de(etapa) == "ok":
                    continue
                try:
                    dossie.exigir(etapa)
                except EtapaBloqueada as e:
                    print(f"BLOQUEADA: {e}")
                    return 1
                print(f"{etapa} — {ETAPAS[etapa]['titulo']}")
                return 0
            print("Esteira completa.")
            return 0

        if args.comando == "checar":
            dossie.exigir(args.etapa)
            print(f"{args.etapa} liberada — {ETAPAS[args.etapa]['titulo']}")
            return 0

    except (EtapaBloqueada, SemFonte, VerificacaoFalhou) as e:
        print(f"RECUSADO: {e}", file=sys.stderr)
        return 2
    except ValueError as e:
        print(f"ERRO: {e}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
