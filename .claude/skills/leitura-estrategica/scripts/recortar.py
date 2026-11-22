#!/usr/bin/env python3
"""Recorta páginas de um PDF SEM reformatar nada: as páginas saem exatamente como no original
(texto, logo, rodapé, grifos e anotações do aluno preservados).

Uso:
    python3 -I recortar.py ORIGINAL.pdf SAIDA.pdf 218-222 262-265 208

Cada argumento é uma página (208) ou faixa (218-222), contando da 1 como o visualizador de PDF.
As páginas saem na ordem dada, sem repetir. É a Etapa 1 do modo "assuntos separados".
"""
import sys
import pymupdf

if len(sys.argv) < 4:
    sys.exit(__doc__)
src, out, *spec = sys.argv[1:]
d = pymupdf.open(src)
pags = []
for s in spec:
    a, _, b = s.partition('-')
    a = int(a); b = int(b) if b else a
    assert 1 <= a <= b <= len(d), f'faixa fora do PDF ({len(d)} págs.): {s}'
    pags += [p for p in range(a, b + 1) if p not in pags]
n = pymupdf.open()
for p in pags:
    n.insert_pdf(d, from_page=p - 1, to_page=p - 1)   # copia a página inteira, com anotações
n.save(out, garbage=3, deflate=True)
print(f'{out}: {len(n)} páginas  <- originais {spec}')
