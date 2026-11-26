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
    t = t.replace('\n', '<br>')
    t = re.sub(r'~~(.+?)~~', lambda m: DEL % m.group(1), t)
    return re.sub(r'\*\*(.+?)\*\*', lambda m: INS % m.group(1), t)


def tx(x):
    return LEFT + (x - X0) * S


def frame_bottom(p):
    ys = [dr['rect'].y1 for dr in p.get_drawings()
          if dr.get('color') and dr['rect'].width > 500 and dr['rect'].height > 100]
    return max(ys) if ys else p.rect.height - 10


def find(pages, label, after=None):
    """primeira ocorrência de label (página, y) nas páginas, depois de 'after'"""
    for pno in pages:
        for r in src[pno].search_for(label):
            if after is None or (pno, r.y0) > after:
                return pno, r.y0
    return None


def flow(pages, start, end):
    """fatias (página, y0, y1) do ponto start até o ponto end, atravessando páginas"""
    out = []
    for pno in pages:
        if pno < start[0] or (end and pno > end[0]):
            continue
        y0 = start[1] if pno == start[0] else 44
        y1 = end[1] if (end and pno == end[0]) else frame_bottom(src[pno]) - 4
        if y1 - y0 > 6:
            out.append((pno, y0, y1))
    return out


def tidy(sl):
    """apara o branco no fim de cada fatia e descarta fatias sem texto"""
    out = []
    for pno, y0, y1 in sl:
        ys = [b[3] for b in src[pno].get_text('blocks') if b[3] > y0 + 2 and b[1] < y1]
        if ys:
            out.append((pno, y0, min(y1, max(ys) + 14)))
    return out


def trim_tail(sl):
    """corta o branco depois do último texto da última fatia"""
    pno, y0, y1 = sl[-1]
    ys = [bl[3] for bl in src[pno].get_text('blocks') if bl[1] >= y0 and bl[3] <= y1]
    if ys:
        sl[-1] = (pno, y0, min(y1, max(ys) + 16))
    return sl


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
seg_top = None


def ensure(h):
    """garante espaço h na página; abre página nova e fecha a moldura se preciso"""
    global pg, y, seg_top
    if y + h > BOTTOM and y > TOP:
        if seg_top is not None:
            pg.draw_rect(pymupdf.Rect(LEFT - 1, seg_top, LEFT + TW + 1, y), color=(0.80, 0.83, 0.87), width=0.8)
        pg = new_page()
        y = TOP
        if seg_top is not None:
            seg_top = y


def cut_points(pno, c0, c1):
    """pontos de corte seguros: meio do espaço entre blocos de texto consecutivos"""
    bl = sorted((b[1], b[3]) for b in src[pno].get_text('blocks') if b[3] > c0 and b[1] < c1)
    pts, reach = [], c0
    for i, (t, b) in enumerate(bl):
        if i and t > reach + 2:
            pts.append((reach + t) / 2)
        reach = max(reach, b)
    return pts


def put(pno, c0, c1):
    """coloca a fatia, dividindo-a entre blocos de texto se não couber na página"""
    global y
    while True:
        h = (c1 - c0) * S
        if y + h <= BOTTOM:
            pg.draw_rect(pymupdf.Rect(LEFT, y, LEFT + TW, y + h), color=None, fill=CREAM)
            y += place(pg, y, pno, c0, c1)
            return
        lim = c0 + (BOTTOM - y) / S
        cuts = [c for c in cut_points(pno, c0, c1) if c0 + 30 < c <= lim]
        if cuts:
            c = max(cuts)
            pg.draw_rect(pymupdf.Rect(LEFT, y, LEFT + TW, y + (c - c0) * S), color=None, fill=CREAM)
            y += place(pg, y, pno, c0, c)
            c0 = c
        ensure(10 ** 6)   # página nova


for q in cfg['questoes']:
    first = q['pagina'] - 1
    last = q.get('ultima', q['pagina']) - 1
    pages = list(range(first, last + 1))
    pq = find(pages, 'POR QUE O GABARITO')
    enun = tidy(flow(pages, (first, 44), (pq[0], pq[1] - 8) if pq else None))
    ls0 = find(pages, 'LEI SECA / PRECEDENTE')
    lei = []
    if ls0:
        nxt = [h for h in (find(pages, t, ls0) for t in HEADS if t != 'POR QUE O GABARITO') if h]
        end = min(nxt) if nxt else None
        lei = tidy(flow(pages, (ls0[0], ls0[1] - 10), (end[0], end[1] - 4) if end else None))
    html = ('<div class="box"><div class="t">⚡ CORREÇÃO TURBO</div><div class="s">%s</div>'
            '<div class="n">%s</div></div>') % (markup(q['correcao']), q.get('fonte', ''))
    tmp = pymupdf.open().new_page(width=W, height=H)
    spare, _ = tmp.insert_htmlbox(pymupdf.Rect(tx(64.5), 0, tx(531.7), 700), html, css=CSS)
    bh, gap = 700 - spare + 6, 7
    ensure(min((enun[0][2] - enun[0][1]) * S, 160))
    seg_top = y
    for pno, c0, c1 in enun:
        put(pno, c0, c1)
    ensure(bh + 2 * gap)
    pg.draw_rect(pymupdf.Rect(LEFT, y, LEFT + TW, y + bh + 2 * gap), color=None, fill=CREAM)
    pg.insert_htmlbox(pymupdf.Rect(tx(64.5), y + gap, tx(531.7), y + gap + bh + 20), html, css=CSS)
    y += bh + 2 * gap
    for pno, c0, c1 in lei:
        put(pno, c0, c1)
    pg.draw_rect(pymupdf.Rect(LEFT, y, LEFT + TW, y + 6), color=None, fill=CREAM)
    y += 6
    pg.draw_rect(pymupdf.Rect(LEFT - 1, seg_top, LEFT + TW + 1, y), color=(0.80, 0.83, 0.87), width=0.8)
    seg_top = None
    y += 14
    print('pág. %d ok — enunciado em %d parte(s), lei seca %s' % (q['pagina'], len(enun), ('em %d parte(s)' % len(lei)) if lei else 'NÃO encontrada'))

out.save(OUT, garbage=3, deflate=True)
print('páginas:', len(out))
