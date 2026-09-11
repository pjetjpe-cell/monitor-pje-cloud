"""Gera um contrato de exemplo parecido com o da GAV: 40 páginas, acima de
4 MB, com o documento de identificação escaneado na página 34.

As páginas levam uma imagem ruidosa de propósito — digitalização comprime mal,
e um PDF que comprime fácil demais não testa nada.
"""
import io
import random
import sys
from pathlib import Path

import pymupdf
from PIL import Image, ImageDraw


def _scan_ruidoso(largura: int, altura: int, semente: int, claro: bool = True) -> bytes:
    """Imagem com granulação, imitando papel digitalizado."""
    rnd = random.Random(semente)
    base = 235 if claro else 200
    img = Image.new("RGB", (largura, altura), (base, base, base - 5))
    px = img.load()
    for _ in range((largura * altura) // 6):
        x, y = rnd.randrange(largura), rnd.randrange(altura)
        t = rnd.randint(-45, 45)
        r, g, b = px[x, y]
        px[x, y] = (max(0, min(255, r + t)), max(0, min(255, g + t)), max(0, min(255, b + t)))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=96)
    return buf.getvalue()


def _pagina_rg(largura: int, altura: int) -> bytes:
    """Uma carteira de identidade escaneada, com os dizeres que a pontuação procura."""
    img = Image.new("RGB", (largura, altura), (240, 238, 232))
    d = ImageDraw.Draw(img)
    cart = (int(largura * 0.08), int(altura * 0.22), int(largura * 0.92), int(altura * 0.62))
    d.rectangle(cart, fill=(224, 230, 222), outline=(90, 90, 90), width=3)
    linhas = [
        "REPUBLICA FEDERATIVA DO BRASIL",
        "CARTEIRA DE IDENTIDADE",
        "VALIDA EM TODO O TERRITORIO NACIONAL",
        "REGISTRO GERAL  00.000.000-0",
        "NOME  MARIA EXEMPLO DA SILVA",
        "FILIACAO  JOSE DA SILVA / ANA EXEMPLO",
        "DATA DE NASCIMENTO  01/01/1980",
        "NATURALIDADE  CIDADE/UF",
        "CPF  000.000.000-00",
        "SECRETARIA DE ESTADO DA SEGURANCA PUBLICA",
        "ORGAO EMISSOR  SSP/UF",
    ]
    y = cart[1] + 18
    for linha in linhas:
        d.text((cart[0] + 20, y), linha, fill=(25, 25, 25))
        y += 26
    rnd = random.Random(99)
    px = img.load()
    for _ in range((largura * altura) // 10):
        x, yy = rnd.randrange(largura), rnd.randrange(altura)
        r, g, b = px[x, yy]
        t = rnd.randint(-25, 25)
        px[x, yy] = (max(0, min(255, r + t)), max(0, min(255, g + t)), max(0, min(255, b + t)))
    buf = io.BytesIO()
    img.save(buf, format="JPEG", quality=95)
    return buf.getvalue()


def gerar(caminho: str, paginas: int = 40, pagina_rg: int = 34) -> str:
    doc = pymupdf.open()
    for n in range(1, paginas + 1):
        page = doc.new_page(width=595, height=842)
        rect = pymupdf.Rect(30, 90, 565, 760)
        if n == pagina_rg:
            page.insert_image(rect, stream=_pagina_rg(900, 1100))
            page.insert_text((40, 60), f"ANEXO - DOCUMENTO DE IDENTIFICACAO - fls. {n}", fontsize=9)
        else:
            page.insert_image(rect, stream=_scan_ruidoso(760, 950, semente=n))
            page.insert_text((40, 60), f"CONTRATO DE COMPRA E VENDA - CLAUSULA {n} - fls. {n}",
                             fontsize=9)
            page.insert_text((40, 785),
                             f"Paragrafo {n}. As partes ajustam as condicoes da cota de "
                             "multipropriedade objeto deste instrumento.", fontsize=7.5)
    Path(caminho).parent.mkdir(parents=True, exist_ok=True)
    doc.save(caminho, deflate=True)
    doc.close()
    return caminho


if __name__ == "__main__":
    destino = sys.argv[1] if len(sys.argv) > 1 else "/tmp/contrato_exemplo.pdf"
    print(gerar(destino))
