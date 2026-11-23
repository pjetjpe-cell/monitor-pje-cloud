import pymupdf, json, re, subprocess, html
exec(open('montar.py').read().split("json.dump(dict(slices")[0])   # reaproveita d (com bake), slices, info
S=slices
W,H=595,842; MT,MB=22,22
out=pymupdf.open()
def split_points(pno,y0,y1):
    p=d[pno-1]; lines=[]
    for b in p.get_text('dict')['blocks']:
        for l in b.get('lines',[]): lines.append((l['bbox'][1],l['bbox'][3]))
    return lines
def best_split(pno,y0,limit):
    lines=split_points(pno,y0,limit)
    cand=[limit]+[b+1 for _,b in lines if y0+30<b+1<=limit]
    ok=[c for c in cand if not any(t+1<c<b-1 for t,b in lines)]
    return max(ok) if ok else limit
first_page={}
toc=[]
order=['Q45','Q59','Q97','Q106','Q107','Q116','Q109','Q18 PC-MA','Q19 PC-MA']
CAP=H-MT-MB
for code in order:
    page=None; cur=MT
    total=sum(y1-y0 for _,y0,y1 in S[code]); sc=1.0
    if CAP<total<=CAP*1.12: sc=(CAP-2)/total      # cabe numa página com leve redução
    for (pno,y0,y1) in S[code]:
        y=y0
        while y<y1-1:
            if page is None or cur>H-MB-40:
                page=out.new_page(width=W,height=H); cur=MT
                if code not in first_page: first_page[code]=len(out)
            space=H-MB-cur
            h=y1-y
            h=h*sc
            if h<=space+0.5: cut=y1
            else: cut=best_split(pno,y,y+space/sc)
            if cut-y<5: page=None; continue
            hh=(cut-y)*sc; ww=W*sc
            page.show_pdf_page(pymupdf.Rect((W-ww)/2,cur,(W+ww)/2,cur+hh),d,pno-1,clip=pymupdf.Rect(0,y,W,cut))
            cur+=hh; y=cut
            if y<y1-1: page=None
    toc.append([1,code.replace(' PC-MA',' · PC-MA 2026'),first_page[code]])
out.save('corpo.pdf'); print('corpo:',len(out),'págs','início:',first_page)
json.dump(first_page,open('first_page.json','w'))
