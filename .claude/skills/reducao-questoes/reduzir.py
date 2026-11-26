"""Redução das questões erradas — padrão "enunciado + correção turbo + lei seca".

Uso:
    python3 -I reduzir.py caderno.pdf correcoes.json saida.pdf

correcoes.json:
{
  "titulo": "CORREÇÃO TURBO • DIREITO ADMINISTRATIVO (PC-MA)",
  "questoes": [
    {"pagina": 3,                      # página (1-based) onde começa a questão no caderno
     "paginas_lei_seca": [3, 4, 5],    # onde procurar o quadro LEI SECA
     "correcao": "é ~~comum~~ **sucessivo** às licitantes ...",   # ~~apaga~~  **acrescenta**
     "fonte": "Fonte: comentário da questão ..."}                  # aceita <b>
  ]
}
"""
import json, re, sys
import pymupdf

SRC, CFG, OUT = sys.argv[1], sys.argv[2], sys.argv[3]
src = pymupdf.open(SRC)
cfg = json.load(open(CFG, encoding='utf-8'))

DEL = '<span style="color:#C00000;text-decoration:line-through">%s</span>'
INS = '<b style="color:#1F4E99">%s</b>'
CSS = '''* {font-family: sans-serif;}
.box {background:#FFF8E1; border-left:4px solid #E0A800; padding:6px 10px;}
.t {color:#7A5A00; font-weight:bold; font-size:9pt; margin-bottom:4px;}
.s {color:#2B2B2B; font-size:10pt; line-height:1.45;}
.n {color:#6B6B6B; font-size:7.6pt; margin-top:5px; line-height:1.3;}'''
STMT_FILL = (0.9725, 0.9647, 0.9412)          # fundo cinza do enunciado no caderno ENAMZEIRO
CREAM = (0.9922, 0.9804, 0.949)               # fundo creme do cartão
HEADS = ('COMENTÁRIO ORIGINAL', 'ATUALIZAÇÃO / REVISÃO', 'PEGADINHA DA BANCA',
         'IMAGEM MENTAL', 'POR QUE O GABARITO')
W, H = 595, 842
TOP, BOTTOM = 42, H - 14
S = 0.8                                       # escala do conteúdo original
X0, X1 = 45.5, 551                            # largura útil do cartão
TW = (X1 - X0) * S
LEFT = (W - TW) / 2


def markup(t):
    t = re.sub(r'~~(.+?)~~', lambda m: DEL % m.group(1), t)
    return re.sub(r'\*\*(.+?)\*\*', lambda m: INS % m.group(1), t)


def tx(x):
    return LEFT + (x - X0) * S


def stmt_bottom(p):
    for dr in p.get_drawings():
        f = dr.get('fill')
        if f and all(abs(a - b) < 0.004 for a, b in zip(f, STMT_FILL)) \
                and dr['rect'].width > 300 and dr['rect'].y0 > 120:
            return dr['rect'].y1
    raise RuntimeError('enunciado não encontrado na página %d' % (p.number + 1))


def frame_bottom(p):
    ys = [dr['rect'].y1 for dr in p.get_drawings()
          if dr.get('color') and dr['rect'].width > 500 and dr['rect'].height > 100]
    return max(ys) if ys else p.rect.height - 10


def lei_seca(pages):
    for pno in pages:
        p = src[pno]
        r = p.search_for('LEI SECA / PRECEDENTE')
        if not r:
            continue
        nxt = [x.y0 for h in HEADS for x in p.search_for(h) if x.y0 > r[0].y1]
        lim = (min(nxt) - 4) if nxt else frame_bottom(p)
        ys = [bl[3] for bl in p.get_text('blocks') if bl[1] > r[0].y1 and bl[3] < lim]
        return pno, r[0].y0 - 10, min(lim, (max(ys) if ys else r[0].y1) + 16)
    return None


out = pymupdf.open()


def new_page():
    pg = out.new_page(width=W, height=H)
    pg.draw_rect(pymupdf.Rect(0, 0, W, 34), color=None, fill=(0.0588, 0.1804, 0.3647))
    pg.insert_htmlbox(pymupdf.Rect(20, 9, W - 20, 30), '<b>%s</b>' % cfg['titulo'],
                      css='* {font-family:sans-serif; color:white; font-size:10pt;}')
    return pg


def place(pg, y, pno, c0, c1):
    h = (c1 - c0) * S
    pg.show_pdf_page(pymupdf.Rect(LEFT, y, LEFT + TW, y + h), src, pno,
                     clip=pymupdf.Rect(X0, c0, X1, c1))
    return h


def stretch(pg, y, h, pno, row):
    pg.show_pdf_page(pymupdf.Rect(LEFT, y, LEFT + TW, y + h), src, pno,
                     clip=pymupdf.Rect(X0, row - 1, X1, row), keep_proportion=False)


pg = new_page()
y = TOP
for q in cfg['questoes']:
    first = q['pagina'] - 1
    a0, a1 = 44, stmt_bottom(src[first]) + 6
    html = ('<div class="box"><div class="t">⚡ CORREÇÃO TURBO</div><div class="s">%s</div>'
            '<div class="n">%s</div></div>') % (markup(q['correcao']), q.get('fonte', ''))
    tmp = pymupdf.open().new_page(width=W, height=H)
    spare, _ = tmp.insert_htmlbox(pymupdf.Rect(tx(64.5), 0, tx(531.7), 400), html, css=CSS)
    bh, gap = 400 - spare + 6, 7
    ls = lei_seca([n - 1 for n in q.get('paginas_lei_seca', [q['pagina']])])
    lh = (ls[2] - ls[1]) * S if ls else 0
    need = (a1 - a0) * S + bh + 2 * gap + lh + 12
    if y + need > BOTTOM and y > TOP:
        pg = new_page()
        y = TOP
    y0 = y
    pg.draw_rect(pymupdf.Rect(LEFT, y, LEFT + TW, y + need - 12), color=None, fill=CREAM)
    y += place(pg, y, first, a0, a1)
    stretch(pg, y, bh + 2 * gap, first, a1 - 0.5)
    pg.insert_htmlbox(pymupdf.Rect(tx(64.5), y + gap, tx(531.7), y + gap + bh + 20), html, css=CSS)
    y += bh + 2 * gap
    if ls:
        y += place(pg, y, *ls)
    stretch(pg, y, 6, first, a1 - 0.5)
    y += 6
    pg.draw_rect(pymupdf.Rect(LEFT - 1, y0, LEFT + TW + 1, y), color=(0.80, 0.83, 0.87), width=0.8)
    y += 14
    print('pág. %d ok — lei seca %s' % (q['pagina'], 'encontrada' if ls else 'NÃO encontrada'))

out.save(OUT, garbage=3, deflate=True)
print('páginas:', len(out))
