# Legenda .srt a partir dos tempos de fala de cada cena: python3 srt.py projeto.json saida.srt
import json, sys
P = json.load(open(sys.argv[1]))
def f(s):
    ms = int(round(s * 1000)); return f'{ms // 3600000:02d}:{ms // 60000 % 60:02d}:{ms // 1000 % 60:02d},{ms % 1000:03d}'
out, n = [], 1
for c in P['cenas']:
    ws = c['fala'].split(); a, b = c['inicio'] + c['tFala'][0], c['inicio'] + c['tFala'][1]
    pes = [len(w) + 2 for w in ws]; soma = sum(pes); acc = a
    for i in range(0, len(ws), 7):
        d = (b - a) * sum(pes[i:i + 7]) / soma
        out.append(f'{n}\n{f(acc)} --> {f(acc + d)}\n{" ".join(ws[i:i + 7])}\n'); n += 1; acc += d
open(sys.argv[2], 'w').write('\n'.join(out)); print(sys.argv[2], n - 1, 'blocos')
