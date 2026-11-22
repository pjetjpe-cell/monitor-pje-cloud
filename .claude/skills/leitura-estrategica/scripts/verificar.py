#!/usr/bin/env python3
"""Confere a fidelidade do HTML gerado contra o PDF original. NÃO pule esta etapa.

Uso:
    python3 -I verificar.py paras.json saida.html [--ignorar 12 11 ...] [--viewport]

Checa:
  1. MARCAÇÕES: todo trecho grifado do original aparece no HTML, na mesma cor (nada perdido, nada trocado).
     Soma dos trechos confere com a legenda.
  2. TEXTO: toda sequência de 3 palavras de cada parágrafo existe no HTML. Lacunas esperadas: só nas
     fronteiras onde você cortou o texto em passos/subitens e nos prefixos que virou etiqueta
     ('RESPOSTA:', '(I)', '1.'). Qualquer outra lacuna é texto perdido: corrija o build.
  3. --viewport: abre em largura de celular (390px) e acusa rolagem horizontal.
Saída termina com 'OK' ou 'PROBLEMAS'.
"""
import sys, json, re, html, collections, argparse, subprocess, os

ap = argparse.ArgumentParser()
ap.add_argument('paras'); ap.add_argument('html')
ap.add_argument('--ignorar', nargs='*', type=int, default=[], help='índices de parágrafos a ignorar (rodapés, nº de página, anotações)')
ap.add_argument('--viewport', action='store_true')
ap.add_argument('--inverso', action='store_true', help='compilado por assunto: tudo que não é rótulo seu existe no PDF? (substitui a checagem de texto 2)')
a = ap.parse_args()

P = json.load(open(a.paras))
H = open(a.html).read()
body = H.split('</style>')[1].split('<script>')[0]
body = re.sub(r'<img[^>]*>', '', body)

# ---- 1. marcações
marks = collections.defaultdict(list)
for m in re.finditer(r'<mark class="(\w)">(.*?)</mark>', body, re.S):
    t = html.unescape(re.sub(r'<[^>]+>', '', m.group(2)))
    marks[m.group(1)].append(re.sub(r'\s+', ' ', t).strip())


def runs(idx):
    seq, prev = [], True
    for c in P[idx]['chars']:
        if c['c'].isspace():
            if prev:
                continue
            seq.append((' ', None)); prev = True
        else:
            seq.append((c['c'], c.get('hl'))); prev = False
    i, n, res = 0, len(seq), []
    while i < n:
        if seq[i][1]:
            col = seq[i][1]; j = i
            while j < n and (seq[j][1] == col or (seq[j][0] == ' ' and j + 1 < n and seq[j + 1][1] == col and j > i)):
                j += 1
            res.append((col, ''.join(c for c, _ in seq[i:j]).strip())); i = j
        else:
            i += 1
    return res


tot, miss = 0, []
for idx in range(len(P)):
    if idx in a.ignorar:
        continue
    for col, t in runs(idx):
        tot += 1
        if not any(t in m for m in marks[col]):
            miss.append((idx, col, t))
print(f'[marcações] {tot} trechos grifados no original; ausentes/cor trocada no HTML: {len(miss)}')
for m in miss:
    print('   ', m)

# ---- 2. texto
if a.inverso:
    from html.parser import HTMLParser
    MEUS = {'slabel', 'band', 'rtag', 'gap', 'qtag', 'dh', 'dlab', 'dtitle', 'lede', 'xnote', 'fonte', 'jtag', 'kicker', 'ptitle', 'pnote',
            'panel', 'chip', 'sn', 'num', 'bl', 'bt', 'bs', 'otag', 'stitle', 'hand', 'mnote', 'trail', 'legend', 'src', 'noprint', 'cov', 'dnote'}
    class Coleta(HTMLParser):
        """Junta o texto em segmentos: um novo segmento a cada tag de bloco (passo, subitem, célula...).
        Marcas inline (mark, b, i, u, s) não quebram o segmento."""
        INLINE = {'mark', 'b', 'i', 'u', 's', 'strong', 'small'}
        def __init__(self):
            super().__init__(); self.pilha = []; self.skip = 0; self.segs = ['']
        def handle_starttag(self, tag, attrs):
            if tag not in self.INLINE: self.segs.append('')
            if tag in ('br', 'img', 'meta', 'link'): return
            cls = set((dict(attrs).get('class') or '').split())
            skip = bool(cls & MEUS) or tag in ('h1', 'h2', 'style', 'script', 'title', 'button', 'th', 'footer', 'em')
            self.pilha.append(skip); self.skip += skip
        def handle_endtag(self, tag):
            if tag not in self.INLINE: self.segs.append('')
            if tag in ('br', 'img', 'meta', 'link') or not self.pilha: return
            self.skip -= self.pilha.pop()
        def handle_data(self, d):
            if not self.skip: self.segs[-1] += d
    c = Coleta(); c.feed(H)
    src = ' '.join(re.findall(r'\S+', ' '.join(p['text'] for p in P if not p['text'].strip().isdigit()))).replace('*', '')  # '*itálico*' de markdown
    src = re.sub(r'(?<=[A-Za-zÀ-ÿ])- (?=[a-zà-ÿ])', '-', src)  # hífen de quebra de linha
    orf = []
    for sg in c.segs:
        hw = re.findall(r'\S+', sg)
        orf += [' '.join(hw[i:i + 3]) for i in range(len(hw) - 2) if ' '.join(hw[i:i + 3]) not in src]
    print(f'[texto-inverso] sequências do HTML (fora dos seus rótulos) que NÃO existem no PDF: {len(orf)}')
    for o in orf[:25]: print('   ', o)
    inv_ok = not orf
else:
    inv_ok = True

if not a.inverso:
    b2 = re.sub(r'</?(mark|b|i|u|s)(\s[^>]*)?>', '', body)
    hs = ' '.join(re.findall(r'\S+', html.unescape(re.sub(r'<[^>]+>', ' ', b2))))
    gaps = collections.defaultdict(list)
    for idx, p in enumerate(P):
        if idx in a.ignorar:
            continue
        w = re.findall(r'\S+', p['text'])
        for i in range(0, max(1, len(w) - 2)):
            win = ' '.join(w[i:i + 3])
            if win not in hs:
                gaps[idx].append(win)
    print(f'[texto] parágrafos com sequências ausentes: {len(gaps)} (confira se cada uma é só fronteira de corte/prefixo)')
    for idx, ws in gaps.items():
        print(f'   p{idx}: {len(ws)} -> {ws[:4]}')

# ---- 3. celular
over = 0
if a.viewport:
    js = os.path.join(os.path.dirname(os.path.abspath(__file__)), '_vp.js')
    open(js, 'w').write("""const { chromium } = require('playwright');
(async()=>{const b=await chromium.launch();const m=await b.newPage({viewport:{width:390,height:800}});
await m.goto('file://'+process.argv[2]);
console.log(await m.evaluate(()=>document.documentElement.scrollWidth-window.innerWidth));await b.close();})();""")
    try:
        over = int(subprocess.check_output(['node', js, os.path.abspath(a.html)]).decode().strip())
    finally:
        os.remove(js)
    print(f'[celular 390px] rolagem horizontal: {over}px')

print('OK' if not miss and not over and inv_ok else 'PROBLEMAS')
