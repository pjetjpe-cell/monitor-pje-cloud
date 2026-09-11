"""Ponte entre o Drive (MCP) e o disco, para a esteira rodando na web.

`download_file_content` devolve o PDF em base64 dentro do contexto do modelo.
Isso tem um teto prático: cada MB de PDF vira ~1,4 MB de base64, e o agente
ainda precisa reemitir esse texto para gravá-lo em disco. Na prática:

    até  ~800 KB   tranquilo          (procuração, extrato, RG, comprovante)
    800 KB - 2 MB  caro, mas possível (uma vez por sessão)
    acima de 2 MB  inviável           → use o compressor no navegador

O limite é do transporte, não do PDF: `verificar_tamanho` avisa antes de
alguém gastar meio contexto para descobrir que não cabia.

Uso:
    python3 -m gav.drive_io gravar SAIDA.pdf --base64-de /tmp/b.txt --esperado 521917
    python3 -m gav.drive_io ler ENTRADA.pdf --para /tmp/b.txt
    python3 -m gav.drive_io cabe --bytes 3724220
"""

from __future__ import annotations

import argparse
import base64
import sys
from pathlib import Path

TETO_CONFORTAVEL = 800 * 1024
TETO_ABSOLUTO = 2 * 1024 * 1024


def _milhar(n: int) -> str:
    """123456 -> '123.456'. Aplicado só ao número, nunca à frase inteira."""
    return f"{n:,}".replace(",", ".")


def verificar_tamanho(bytes_do_arquivo: int) -> tuple[bool, str]:
    """(cabe, explicação). Chame ANTES de baixar, com o fileSize do Drive."""
    mb = bytes_do_arquivo / (1024 * 1024)
    tokens = _milhar(int(bytes_do_arquivo * 1.37 / 3.5))
    if bytes_do_arquivo <= TETO_CONFORTAVEL:
        return True, f"{mb:.2f} MB — cabe (~{tokens} tokens em base64)"
    if bytes_do_arquivo <= TETO_ABSOLUTO:
        return True, (f"{mb:.2f} MB — passa, mas custa caro (~{tokens} tokens). "
                      "Só se for uma vez.")
    return False, (
        f"{mb:.2f} MB — não vale a pena baixar pelo MCP (~{tokens} tokens em base64, "
        "e o agente ainda teria de reemitir tudo para gravar em disco). "
        "Use o compressor no navegador."
    )


def gravar(destino: Path, texto_base64: str, esperado: int | None = None) -> dict:
    """Grava o base64 vindo do Drive e prova que o arquivo chegou inteiro.

    Três conferências, porque as duas primeiras sozinhas deixam passar:

    1. Começa com `%PDF` — pega o caso de não ser PDF, e só isso: base64 cortado
       no meio continua começando com %PDF.
    2. Termina com `%%EOF` — é o marcador de fim do PDF. Download cortado não
       tem. Esta é a que pega truncamento.
    3. Tem exatamente os bytes que o Drive informou, quando `esperado` é passado.
       Conferência exata; use sempre que tiver o `fileSize` do Drive à mão.

    Abrir o documento não serve de prova: o PyMuPDF reconstrói PDF quebrado
    varrendo os objetos, e um arquivo mutilado abre normalmente.
    """
    bruto = base64.b64decode(texto_base64, validate=False)
    destino.parent.mkdir(parents=True, exist_ok=True)
    destino.write_bytes(bruto)

    if not bruto.startswith(b"%PDF"):
        raise ValueError(f"{destino.name} não começa com %PDF — o conteúdo não é um PDF.")

    if esperado is not None and len(bruto) != esperado:
        faltam = esperado - len(bruto)
        raise ValueError(
            f"{destino.name} chegou com {len(bruto)} bytes, mas o Drive informou "
            f"{esperado} ({faltam:+d}). O base64 veio truncado — não siga com ele."
        )

    # O %%EOF fica nos últimos bytes; alguns geradores deixam lixo depois.
    if b"%%EOF" not in bruto[-2048:]:
        raise ValueError(
            f"{destino.name} não termina com %%EOF — o arquivo está incompleto. "
            "A saída do MCP provavelmente foi cortada. Baixe de novo, ou use o "
            "compressor no navegador se o arquivo for grande demais para o MCP."
        )

    try:
        import pymupdf
        doc = pymupdf.open(destino)
        paginas = doc.page_count
        doc.close()
    except Exception as e:
        raise ValueError(f"{destino.name} não abre como PDF ({e}).") from e
    if paginas == 0:
        raise ValueError(f"{destino.name} abriu com 0 páginas — arquivo incompleto.")

    return {"arquivo": str(destino), "bytes": len(bruto), "paginas": paginas,
            "mb": round(len(bruto) / 1048576, 3),
            "conferido_contra_drive": esperado is not None}


def ler(origem: Path) -> str:
    return base64.b64encode(origem.read_bytes()).decode("ascii")


def main(argv: list[str] | None = None) -> int:
    ap = argparse.ArgumentParser(prog="gav-drive-io", description=__doc__,
                                 formatter_class=argparse.RawDescriptionHelpFormatter)
    sub = ap.add_subparsers(dest="comando", required=True)

    p_g = sub.add_parser("gravar", help="base64 -> arquivo")
    p_g.add_argument("destino")
    p_g.add_argument("--base64-de", help="arquivo com o base64 (padrão: stdin)")
    p_g.add_argument("--esperado", type=int,
                     help="fileSize que o Drive informou — confere o tamanho exato")

    p_l = sub.add_parser("ler", help="arquivo -> base64")
    p_l.add_argument("origem")
    p_l.add_argument("--para", help="arquivo de saída (padrão: stdout)")

    p_c = sub.add_parser("cabe", help="diz se vale baixar pelo MCP")
    p_c.add_argument("--bytes", type=int, required=True, help="fileSize do Drive")

    args = ap.parse_args(argv)

    if args.comando == "cabe":
        ok, msg = verificar_tamanho(args.bytes)
        print(msg)
        return 0 if ok else 1

    if args.comando == "gravar":
        texto = (Path(args.base64_de).read_text() if args.base64_de else sys.stdin.read())
        try:
            info = gravar(Path(args.destino), texto.strip(), args.esperado)
        except ValueError as e:
            print(f"REPROVADO: {e}", file=sys.stderr)
            return 2
        prova = ("tamanho confere com o Drive" if info["conferido_contra_drive"]
                 else "passe --esperado para conferir o tamanho contra o Drive")
        print(f"{info['arquivo']} — {info['mb']} MB, {info['paginas']} página(s); {prova}")
        return 0

    if args.comando == "ler":
        texto = ler(Path(args.origem))
        if args.para:
            Path(args.para).write_text(texto)
            print(f"{args.para} — {len(texto)} caracteres de base64")
        else:
            print(texto)
        return 0
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
