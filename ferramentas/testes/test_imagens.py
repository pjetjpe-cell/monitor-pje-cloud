"""Testes de gav.imagens: printar páginas, montar anexo de prints, figura e OCR.

Roda com: python3 ferramentas/testes/test_imagens.py
"""

import shutil
import sys
import tempfile
from pathlib import Path

RAIZ = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(RAIZ))

import pymupdf  # noqa: E402

from gav import imagens  # noqa: E402


def _png(destino: Path, w=300, h=600, cor=(0, 128, 255)) -> Path:
    pix = pymupdf.Pixmap(pymupdf.csRGB, pymupdf.IRect(0, 0, w, h), False)
    pix.set_rect(pix.irect, cor)
    pix.save(destino)
    return destino


def _pdf(destino: Path, n=3) -> Path:
    doc = pymupdf.open()
    for i in range(n):
        doc.new_page().insert_text((72, 72), f"Página {i + 1}")
    doc.save(destino)
    return destino


def test_paginas_gera_um_png_por_pagina(tmp: Path):
    gerados = imagens.paginas(_pdf(tmp / "p.pdf", 3), tmp / "png", dpi=40)
    assert [p.name for p in gerados] == ["pagina-01.png", "pagina-02.png", "pagina-03.png"]
    assert all(p.stat().st_size > 0 for p in gerados)


def test_anexo_um_print_por_pagina_com_legenda(tmp: Path):
    a = _png(tmp / "a.png"); b = _png(tmp / "b.png", 900, 500, (200, 0, 0))
    saida = imagens.anexo([a, b], tmp / "anexo.pdf", titulo="Doc. 06 – Prints",
                          legendas=["Pergunta do autor", "Resposta da ré"])
    with pymupdf.open(saida) as d:
        assert d.page_count == 2
        assert all(p.get_images() for p in d)
        texto = d[0].get_text() + d[1].get_text()
    assert "Doc. 06" in texto and "Pergunta do autor" in texto and "Resposta da ré" in texto


def test_anexo_recusa_imagem_corrompida(tmp: Path):
    ruim = tmp / "ruim.jpg"; ruim.write_bytes(b"isto nao e imagem")
    try:
        imagens.anexo([ruim], tmp / "x.pdf")
        raise AssertionError("aceitou imagem corrompida")
    except imagens.ImagemInvalida:
        pass


def test_figura_embute_imagem_e_legenda(tmp: Path):
    html = imagens.figura(_png(tmp / "f.png", 10, 10), legenda="Print 1")
    assert html.startswith("<figure") and "data:image/png;base64," in html and "Print 1" in html


def test_ocr_sem_tesseract_recusa_em_vez_de_adivinhar(tmp: Path):
    if shutil.which("tesseract"):
        return  # com o binário instalado este caso não se aplica
    try:
        imagens.ocr(_png(tmp / "o.png"))
        raise AssertionError("OCR sem tesseract deveria recusar")
    except imagens.ImagemInvalida as e:
        assert "Tesseract" in str(e)


if __name__ == "__main__":
    falhas = 0
    for nome, fn in list(globals().items()):
        if nome.startswith("test_"):
            tmp = Path(tempfile.mkdtemp())
            try:
                fn(tmp); print(f"  ok   {nome}")
            except Exception as e:  # noqa: BLE001
                falhas += 1; print(f"  FALHOU {nome}: {e}")
            finally:
                shutil.rmtree(tmp, ignore_errors=True)
    sys.exit(1 if falhas else 0)
