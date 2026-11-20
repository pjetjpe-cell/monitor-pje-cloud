#!/usr/bin/env python3
"""Extrai de um PDF grifado, caractere a caractere, o texto + as marcações do aluno.

Uso:
    python3 -I extrair.py ENTRADA.pdf SAIDA.json [--imgs DIR] [--manter-parcial intercorrente superveniente ...]

Gera:
    SAIDA.json          lista de parágrafos (blocos do PDF), cada um com `chars`:
                        {c, b, i, hl, strike, u, x, y, sz}
                          hl     'y' amarelo | 'r' vermelho | 'g' verde | 'p' rosa | 'b' azul
                          strike True se riscado com X preto à mão
                          u      True se sublinhado (linha preta desenhada sob o texto)
    SAIDA.extras.json   anotações que não são texto: FreeText (anotações escritas à mão/digitadas)
                        e Stamp (imagens coladas), com página e posição
    DIR/stamp_*.png     imagens dos carimbos (se --imgs)

Regras de fidelidade (aprendidas na prática):
  * Grifo (Highlight) e traço de tinta COLORIDO (Ink) valem como marca-texto da mesma cor.
  * Tinta PRETA = riscado (X). É atribuída às palavras da linha sob o X.
  * Marca-texto é ajustado POR PALAVRA: a borda do traço costuma pegar 1-2 letras da palavra
    vizinha (descartadas) e começar no meio da palavra (palavra inteira é marcada).
  * Marca PARCIAL intencional (ex.: só "int" de "intercorrente", um mnemônico) é preservada
    em nível de letra com --manter-parcial. O script lista as candidatas para você decidir.
"""
import sys, json, collections, argparse, os
import pymupdf

PAL = {'y': (1, 1, .6), 'r': (1, .31, .37), 'g': (.33, 1, .74), 'p': (1, .8, .9), 'b': (.5, .92, 1), 'k': (0, 0, 0)}


def cname(c):
    if not c:
        return None
    return min(PAL, key=lambda k: sum((PAL[k][i] - c[i]) ** 2 for i in range(3)))


def cluster(rects, pad=3):
    """Agrupa retângulos que se tocam (cada X é 2 traços cruzados)."""
    groups = []
    for r in rects:
        r = pymupdf.Rect(r)
        er = pymupdf.Rect(r.x0 - pad, r.y0 - pad, r.x1 + pad, r.y1 + pad)
        hit = [g for g in groups if not (g & er).is_empty]
        for g in hit:
            groups.remove(g)
            er |= g
        groups.append(er)
    return groups


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('pdf'); ap.add_argument('out')
    ap.add_argument('--imgs'); ap.add_argument('--manter-parcial', nargs='*', default=[])
    a = ap.parse_args()
    doc = pymupdf.open(a.pdf)
    paras, extras = [], dict(freetext=[], stamps=[])
    parciais = []

    for pi, page in enumerate(doc):
        quads, inks, blacks = [], [], []
        for an in page.annots():
            t = an.type[1]
            if t == 'Highlight':
                cls = cname(an.colors['stroke']); v = an.vertices
                for i in range(0, len(v), 4):
                    xs = [p[0] for p in v[i:i + 4]]; ys = [p[1] for p in v[i:i + 4]]
                    quads.append((cls, pymupdf.Rect(min(xs), min(ys), max(xs), max(ys))))
            elif t == 'Ink':
                cls = cname(an.colors['stroke'])
                strokes = an.vertices if an.vertices and isinstance(an.vertices[0][0], (list, tuple)) else [an.vertices]
                if cls == 'k':
                    for s in strokes:
                        xs = [p[0] for p in s]; ys = [p[1] for p in s]
                        blacks.append(pymupdf.Rect(min(xs), min(ys), max(xs), max(ys)))
                else:
                    inks.append((cls, [p for s in strokes for p in s]))
            elif t == 'FreeText':
                extras['freetext'].append(dict(page=pi + 1, text=an.info.get('content') or page.get_textbox(an.rect),
                                               rect=[round(v) for v in an.rect]))
            elif t == 'Stamp':
                rec = dict(page=pi + 1, rect=[round(v) for v in an.rect], file=None)
                if a.imgs:
                    try:
                        os.makedirs(a.imgs, exist_ok=True)
                        ap_xref = int(doc.xref_get_key(an.xref, 'AP/N')[1].split()[0])
                        res = doc.xref_get_key(ap_xref, 'Resources/XObject')[1]
                        import re
                        ix = int(re.search(r'(\d+) 0 R', res).group(1))
                        pix = pymupdf.Pixmap(doc, ix)
                        if pix.n - pix.alpha > 3:
                            pix = pymupdf.Pixmap(pymupdf.csRGB, pix)
                        fn = os.path.join(a.imgs, f'stamp_p{pi + 1}_{len(extras["stamps"]) + 1}.png')
                        pix.save(fn); rec['file'] = fn
                    except Exception as e:
                        rec['erro'] = str(e)
                extras['stamps'].append(rec)

        # sublinhados desenhados (linha preta horizontal colada ao texto)
        ulines = []
        for d in page.get_drawings():
            col = d.get('color')
            if not col or max(col) > 0.3 or d.get('fill'):
                continue
            for it in d['items']:
                if it[0] == 'l' and abs(it[1].y - it[2].y) < .6 and abs(it[1].x - it[2].x) > 8:
                    ulines.append((min(it[1].x, it[2].x), max(it[1].x, it[2].x), it[1].y))

        raw = page.get_text('rawdict')
        lines_meta = []  # (line_id, ycenter) p/ localizar a linha sob cada X
        for b in raw['blocks']:
            if b['type'] != 0:
                continue
            chars = []
            for l in b['lines']:
                lid = len(lines_meta)
                lines_meta.append(dict(id=lid, yc=(l['bbox'][1] + l['bbox'][3]) / 2))
                for s in l['spans']:
                    fl = s['flags']; fn = s['font'].lower()
                    bold = bool(fl & 16) or 'bold' in fn
                    ital = bool(fl & 2) or 'italic' in fn or 'oblique' in fn
                    for ch in s['chars']:
                        bb = pymupdf.Rect(ch['bbox']); c = ch['c']
                        hl = ink = None; u = False
                        if c.strip():
                            cover = {}
                            for cls, r in quads:
                                inter = bb & r
                                if not inter.is_empty and inter.get_area() > .35 * bb.get_area():
                                    cover[cls] = inter.get_area()
                            if cover:
                                hl = max(cover, key=cover.get)
                            ex = pymupdf.Rect(bb.x0 - 1, bb.y0, bb.x1 + 1, bb.y1 + 3)
                            for cls, pts in inks:
                                if any(ex.contains(pymupdf.Point(p)) for p in pts):
                                    ink = cls
                            for x0, x1, y in ulines:
                                if x0 - 1 <= (bb.x0 + bb.x1) / 2 <= x1 + 1 and bb.y1 - 3.5 <= y <= bb.y1 + 2:
                                    u = True
                        chars.append(dict(c=c, b=bold, i=ital, hl=hl, ink=ink, u=u, ln=lid, x=round(bb.x0, 1),
                                          x1=round(bb.x1, 1), y=round(bb.y0, 1), sz=round(s['size'], 1)))
                chars.append(dict(c=' ', b=False, i=False, hl=None, ink=None, u=False, ln=lid, x=0, x1=0, y=0, sz=0))
            text = ''.join(c['c'] for c in chars).strip()
            if text:
                paras.append(dict(page=pi + 1, bbox=[round(v) for v in b['bbox']], text=text, chars=chars))

        # riscado (X preto): a linha mais próxima do centro do X; palavras com sobreposição horizontal
        page_paras = [p for p in paras if p['page'] == pi + 1]
        for g in cluster(blacks):
            if g.width < 8 or g.height < 8:   # tracinho solto, não é um X
                continue
            cy = (g.y0 + g.y1) / 2
            best = None
            for p in page_paras:
                for c in p['chars']:
                    if c['c'].strip() and c['y']:
                        d = abs(c['y'] + c['sz'] / 2 - cy)
                        if best is None or d < best[0]:
                            best = (d, c['ln'], p)
            if not best or best[0] > 18:
                continue
            _, lid, p = best
            ch = p['chars']; i = 0
            while i < len(ch):
                if ch[i]['c'].isspace() or ch[i]['ln'] != lid:
                    i += 1; continue
                j = i
                while j < len(ch) and not ch[j]['c'].isspace():
                    j += 1
                w = ch[i:j]
                x0, x1 = w[0]['x'], w[-1]['x1']
                if min(x1, g.x1) - max(x0, g.x0) > 5:
                    for c in w:
                        c['strike'] = True
                i = j

    # ---- pós-processamento: tinta colorida vira marca-texto; ajuste por palavra
    for p in paras:
        ch = p['chars']
        for c in ch:
            if c['ink'] and not c['hl']:
                c['hl'] = c['ink']
        i, n = 0, len(ch)
        while i < n:
            if ch[i]['c'].isspace():
                i += 1; continue
            j = i
            while j < n and not ch[j]['c'].isspace():
                j += 1
            w = ch[i:j]; wtxt = ''.join(c['c'] for c in w).strip('.,;:()“”"')
            cnt = collections.Counter(c['hl'] for c in w if c['hl'])
            if cnt:
                cls, k = cnt.most_common(1)[0]
                if wtxt.lower() in [m.lower() for m in a.manter_parcial]:
                    pass
                elif k >= .5 * len(w) or k >= 3:
                    if k < .5 * len(w):
                        parciais.append((p['page'], ''.join(c['c'] for c in w), ''.join(c['c'] for c in w if c['hl']), cls))
                    for c in w:
                        c['hl'] = cls
                else:
                    for c in w:
                        c['hl'] = None
            i = j
        for c in ch:
            c.pop('ink', None)

    json.dump(paras, open(a.out, 'w'), ensure_ascii=False)
    json.dump(extras, open(a.out.replace('.json', '.extras.json'), 'w'), ensure_ascii=False, indent=1)

    cont = collections.Counter(c['hl'] for p in paras for c in p['chars'] if c['hl'] and c['c'].strip())
    print(f'{len(paras)} parágrafos em {len(doc)} páginas | letras grifadas por cor: {dict(cont)}')
    print('riscadas:', sum(1 for p in paras for c in p['chars'] if c.get('strike') and c['c'].strip()), 'letras | sublinhadas:',
          sum(1 for p in paras for c in p['chars'] if c.get('u') and c['c'].strip()), 'letras')
    print(f"anotações: {len(extras['freetext'])} texto(s) livre(s), {len(extras['stamps'])} carimbo(s)")
    for f in extras['freetext']:
        print('  texto livre p.%d: %r' % (f['page'], f['text']))
    if parciais:
        print('\nMarcações que cobriam só parte da palavra e foram estendidas à palavra inteira (confira se alguma era')
        print('um mnemônico intencional; se for, rode de novo com --manter-parcial <palavra>):')
        for pg, w, covered, cls in parciais:
            print(f'  p.{pg}: {w!r} marcada só em {covered!r} ({cls})')


if __name__ == '__main__':
    main()
