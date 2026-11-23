import pymupdf, json, re, sys
SRC='/root/.claude/uploads/692c500e-2d8a-5627-b8b2-17bab5984add/c8b802ec-09_Direito_Ambiental__PC-MA_2026.pdf'
d=pymupdf.open(SRC)
# --- circulos: tinta perto da pílula do código (x<120), guardados ANTES de embutir os traços
marks=json.load(open('marks.json'))
marks=sorted(marks,key=lambda m:(m['pg'],m['y']))
circ={}
for m in marks:
    if m['code'].startswith('Q'):
        p=d[m['pg']-1]; tops=[a.rect.y0 for a in (p.annots() or []) if a.type[1]=='Ink' and a.rect.x0<120 and a.rect.x1<140 and abs(a.rect.y0+ (a.rect.height/2)-m['y'])<40]
        circ[(m['pg'],m['code'])]=min(tops) if tops else None
CIRCULADAS=['Q45','Q59','Q97','Q106','Q107','Q116','Q109']
# --- embutir anotações (traços vermelhos) no conteúdo das páginas
d.bake(annots=True)
def content_bottom(pg):
    p=d[pg-1]; b=[bl[3] for bl in p.get_text('blocks')]
    dr=[x['rect'].y1 for x in p.get_drawings() if x['rect'].height<p.rect.height*0.98]
    return min(p.rect.height, max(b+[0]) + 16)
def prev_bottom(pg,limit):
    p=d[pg-1]; b=[bl[3] for bl in p.get_text('blocks') if bl[3]<=limit]
    return max(b) if b else None
# --- slices por questão
def start_y(m):
    c=circ.get((m['pg'],m['code']))
    y=m['y']-22
    if c is not None: y=min(y,c-4)
    return max(0,y)
order=[m for m in marks]
slices={}
info={}
band=None
for k,m in enumerate(order):
    if m['code'].startswith('BAND:'): band=m['code'][5:]; continue
    if m['code'] not in CIRCULADAS: continue
    nxt=order[k+1] if k+1<len(order) else None
    sl=[]; y0=start_y(m); pg=m['pg']
    if nxt is None or nxt['pg']>pg:
        sl.append((pg,y0,content_bottom(pg) if (nxt is None or nxt['pg']>pg+0) else None))
        last_pg = nxt['pg'] if nxt else pg+1   # Q109: termina em p.39
        for q in range(pg+1,(nxt['pg'] if nxt else 40)):
            sl.append((q,0,content_bottom(q)))
        if nxt:
            ny=start_y(nxt) if not nxt['code'].startswith('BAND:') else nxt['y']-4
            pb=prev_bottom(nxt['pg'],nxt['y']-8)
            cut=min(ny-2, (pb+14) if pb else ny-2)
            if cut>8: sl.append((nxt['pg'],0,cut))
    else:
        ny=start_y(nxt) if not nxt['code'].startswith('BAND:') else nxt['y']-4
        pb=prev_bottom(pg,nxt['y']-8)
        sl.append((pg,y0,min(ny-2,(pb+14) if pb else ny-2)))
    slices[m['code']]=sl; info[m['code']]=dict(pg0=m['pg'],band=band)
# --- PC-MA 2026: QUESTÃO 18 (p44-45) e QUESTÃO 19 (p46-47), páginas inteiras
for code,pgs in (('Q18 PC-MA',(44,45)),('Q19 PC-MA',(46,47))):
    slices[code]=[(p,0,d[p-1].rect.height) for p in pgs]; info[code]=dict(pg0=pgs[0],band='PC-MA 2026 — Delegado')
json.dump(dict(slices=slices,info=info),open('slices.json','w'),default=list)
for k,v in slices.items(): print(k,[(p,round(a),round(b)) for p,a,b in v])
