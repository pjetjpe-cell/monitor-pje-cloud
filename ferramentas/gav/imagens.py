"""Imagens da esteira: "printar" a peça e usar prints como prova.

Três usos, todos conferidos depois de gravar:

    # 1. Printar: um PNG por página de um PDF (conferência visual da peça)
    python3 -m gav.imagens paginas PETICAO.pdf --saida /tmp/paginas [--dpi 80]

    # 2. Anexo de prova: prints do WhatsApp/e-mail num PDF A4, um por página,
    #    com legenda — vira o "Doc. 06 – Capturas de tela" da inicial
    python3 -m gav.imagens anexo p1.jpg p2.jpg --saida "06 - PRINTS WHATSAPP.pdf" \
        --titulo "Doc. 06 – Atendimento da ré pelo WhatsApp (04/11/2026)" \
        --legenda "Pergunta do autor sobre o prazo" --legenda "Resposta da ré"

    # 3. Ler o texto de um print (OCR). Exige o binário do Tesseract.
    python3 -m gav.imagens ocr print.jpg

    # Bônus: figura HTML com a imagem embutida, para colar dentro da peça
    python3 -m gav.imagens figura print.jpg --legenda "Print 1 – resposta da ré"

O anexo é reaberto e reprovado se o número de páginas não bater com o de
imagens: imagem corrompida não vira página em branco silenciosa.
"""

from __future__ import annotations

import argparse
import base64
import shutil
import subprocess
import sys
from pathlib import Path

import pymupdf

A4 = pymupdf.paper_rect("a4")
MARGEM = 36  # 0,5 pol.
MIME = {".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
        ".webp": "image/webp", ".gif": "image/gif"}


class ImagemInvalida(Exception):
    pass


def paginas(pdf: str | Path, saida: str | Path, dpi: int = 80,
            primeira: int = 1, ultima: int | None = None) -> list[Path]:
    """Renderiza cada página do PDF em PNG. Devolve os caminhos gerados."""
    saida = Path(saida)
    saida.mkdir(parents=True, exist_ok=True)
    gerados = []
    with pymupdf.open(pdf) as doc:
        fim = min(ultima or doc.page_count, doc.page_count)
        for n in range(primeira - 1, fim):
            pix = doc[n].get_pixmap(dpi=dpi)
            destino = saida / f"pagina-{n + 1:02d}.png"
            pix.save(destino)
            gerados.append(destino)
    if not gerados:
        raise ImagemInvalida(f"nenhuma página renderizada de {pdf}")
    return gerados


def anexo(imagens: list[str | Path], saida: str | Path, titulo: str = "",
          legendas: list[str] | None = None) -> Path:
    """Monta um PDF A4 com uma imagem por página, centralizada, com legenda."""
    legendas = legendas or []
    if not imagens:
        raise ImagemInvalida("nenhuma imagem informada")
    doc = pymupdf.open()
    for i, img in enumerate(imagens):
        img = Path(img)
        if not img.exists():
            raise ImagemInvalida(f"imagem não encontrada: {img}")
        try:
            pix = pymupdf.Pixmap(str(img))
        except Exception as e:  # imagem corrompida ou formato desconhecido
            raise ImagemInvalida(f"não consegui abrir {img}: {e}") from e
        pg = doc.new_page(width=A4.width, height=A4.height)
        topo = MARGEM
        if titulo and i == 0:
            pg.insert_textbox(pymupdf.Rect(MARGEM, topo, A4.width - MARGEM, topo + 40),
                              titulo, fontsize=12, fontname="helv", align=1)
            topo += 44
        leg = legendas[i] if i < len(legendas) else ""
        base = A4.height - MARGEM - (30 if leg else 0)
        caixa = pymupdf.Rect(MARGEM, topo, A4.width - MARGEM, base)
        escala = min(caixa.width / pix.width, caixa.height / pix.height, 1.0 if pix.width > 600 else 2.0)
        w, h = pix.width * escala, pix.height * escala
        x0 = MARGEM + (caixa.width - w) / 2
        alvo = pymupdf.Rect(x0, topo, x0 + w, topo + h)
        pg.insert_image(alvo, filename=str(img))
        pg.draw_rect(alvo, color=(0.55, 0.55, 0.55), width=0.6)
        if leg:
            pg.insert_textbox(pymupdf.Rect(MARGEM, alvo.y1 + 6, A4.width - MARGEM, alvo.y1 + 34),
                              leg, fontsize=9, fontname="helv", align=1)
    saida = Path(saida)
    saida.parent.mkdir(parents=True, exist_ok=True)
    doc.save(saida, deflate=True, garbage=3)
    doc.close()
    # conferência: reabre e conta páginas e imagens
    with pymupdf.open(saida) as chk:
        if chk.page_count != len(imagens):
            raise ImagemInvalida(f"anexo com {chk.page_count} páginas para {len(imagens)} imagens")
        sem_imagem = [n + 1 for n, p in enumerate(chk) if not p.get_images()]
        if sem_imagem:
            raise ImagemInvalida(f"páginas sem imagem no anexo: {sem_imagem}")
    return saida


def ocr(imagem: str | Path, idioma: str = "por") -> str:
    """Texto do print via Tesseract. Sem o binário, recusa em vez de adivinhar."""
    if not shutil.which("tesseract"):
        raise ImagemInvalida(
            "Tesseract não instalado — sem OCR. Instale (apt-get install tesseract-ocr "
            "tesseract-ocr-por) ou leia o print a olho; o Read do Claude mostra a imagem.")
    r = subprocess.run(["tesseract", str(imagem), "stdout", "-l", idioma],
                       capture_output=True, text=True, check=False)
    if r.returncode != 0:
        raise ImagemInvalida(f"tesseract falhou: {r.stderr.strip()[:200]}")
    return r.stdout


def figura(imagem: str | Path, legenda: str = "", largura: str = "62%") -> str:
    """<figure> com a imagem em data URI, pronta para inserir na peça."""
    p = Path(imagem)
    mime = MIME.get(p.suffix.lower())
    if not mime:
        raise ImagemInvalida(f"formato não suportado: {p.suffix}")
    b64 = base64.b64encode(p.read_bytes()).decode()
    cap = f'<figcaption style="font-size:9pt;text-indent:0">{legenda}</figcaption>' if legenda else ""
    return ('<figure style="text-align:center;margin:12px 0;page-break-inside:avoid">'
            f'<img src="data:{mime};base64,{b64}" style="max-width:{largura};border:1px solid #888">'
            f'{cap}</figure>')


def main(argv=None) -> int:
    ap = argparse.ArgumentParser(prog="gav.imagens", description=__doc__.splitlines()[0])
    sub = ap.add_subparsers(dest="cmd", required=True)
    a = sub.add_parser("paginas"); a.add_argument("pdf"); a.add_argument("--saida", required=True)
    a.add_argument("--dpi", type=int, default=80); a.add_argument("--primeira", type=int, default=1)
    a.add_argument("--ultima", type=int)
    b = sub.add_parser("anexo"); b.add_argument("imagens", nargs="+"); b.add_argument("--saida", required=True)
    b.add_argument("--titulo", default=""); b.add_argument("--legenda", action="append", default=[])
    c = sub.add_parser("ocr"); c.add_argument("imagem"); c.add_argument("--idioma", default="por")
    d = sub.add_parser("figura"); d.add_argument("imagem"); d.add_argument("--legenda", default="")
    d.add_argument("--largura", default="62%")
    ns = ap.parse_args(argv)
    try:
        if ns.cmd == "paginas":
            for p in paginas(ns.pdf, ns.saida, ns.dpi, ns.primeira, ns.ultima):
                print(p)
        elif ns.cmd == "anexo":
            print(anexo(ns.imagens, ns.saida, ns.titulo, ns.legenda))
        elif ns.cmd == "ocr":
            print(ocr(ns.imagem, ns.idioma))
        elif ns.cmd == "figura":
            print(figura(ns.imagem, ns.legenda, ns.largura))
    except ImagemInvalida as e:
        print(f"REPROVADO: {e}", file=sys.stderr)
        return 2
    return 0


if __name__ == "__main__":
    sys.exit(main())
