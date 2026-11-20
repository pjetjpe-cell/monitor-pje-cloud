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

print('OK' if not miss and not over else 'PROBLEMAS')
