import pymupdf, json, re, html, subprocess, os
exec(open('montar.py').read().split("json.dump(dict(slices")[0])
fp=json.load(open('first_page.json'))
order=['Q45','Q59','Q97','Q106','Q107','Q116','Q109','Q18 PC-MA','Q19 PC-MA']
rows=[]
for code in order:
    pg,y0,y1=slices[code][0]
    p=d[pg-1]; txt=re.sub(r'[ \t]+',' ',p.get_text('text',clip=pymupdf.Rect(0,y0,595,min(y1,y0+160))))
    g=re.search(r'GABARITO:\s*([^\n]+)',txt)
    t=re.search(r'\n?Q\d+\s*\n?(.{8,110})',txt)
    if 'PC-MA' in code:
        full=' '.join(pymupdf.open(SRC)[q-1].get_text() for q in (info[code]['pg0'],info[code]['pg0']+1))
        m=re.search(r'letra ([A-E])',full); gab='LETRA '+m.group(1) if m else '—'
        tm=re.search(r'QUESTÃO \d+\.\s*(.{20,120}?)[,.]',full); titulo=re.sub(r'\s+',' ',tm.group(1)) if tm else ''
        rows.append((code.replace(' PC-MA',''),'PC-MA 2026','', 'LETRA '+m.group(1) if m else '—',fp[code]+1,info[code]['pg0']))
        continue
    tl=[l.strip() for l in txt.split('\n') if l.strip()]
    titulo=next((l for l in tl if ' — ' in l or re.match(r'^[A-Z].{12,}',l) and not l.startswith(('Q','GABARITO','Banca'))),'')
    rows.append((code,info[code]['band'],titulo,g.group(1).strip() if g else '—',fp[code]+1,info[code]['pg0']))
for r in rows: print(r)
json.dump(rows,open('rows.json','w'),ensure_ascii=False)
