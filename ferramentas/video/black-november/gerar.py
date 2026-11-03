# Narração por cena (Piper) + tempos de cada cena e das marcas → projeto.json
import json, subprocess, sys, os, wave
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cenas import C
VOZ = sys.argv[1]
PIPER = ['--length-scale', '0.95', '--noise-scale', '0.8', '--noise-w-scale', '0.9', '--sentence-silence', '0.22']
os.makedirs('voz', exist_ok=True)
cenas, t = [], 0.0
for i, c in enumerate(C):
    f = f'voz/{i:02d}.wav'
    subprocess.run([sys.executable, '-m', 'piper', '-m', VOZ, *PIPER, '-f', f], input=c['locucao'].encode(), check=True, capture_output=True)
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.03,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse', f + '.t.wav'], check=True)
    os.replace(f + '.t.wav', f)
    with wave.open(f) as w: dur = w.getnframes() / w.getframerate()
    lead = {'gancho': 0.35, 'black': 0.55}.get(c['enq'], 0.22)
    tail = {'cta': 2.2, 'antes': 0.5}.get(c['enq'], 0.35)
    d = round(lead + dur + tail, 2)
    # Momento de cada marca: posição proporcional do trecho dentro da locução
    loc = c['locucao']; marcas = [round(lead + dur * loc.lower().index(m.lower()) / len(loc), 2) for m in c['marcas']]
    cenas.append(dict(id=f'bn{i:02d}', enquadramento=c['enq'], papel='cta' if c['enq'] == 'cta' else 'conteudo', duracao=d, fala=c['fala'], locucao=loc,
                      marcas=marcas, voz=f, tFala=[lead, round(lead + dur, 2)], inicio=round(t, 3), titulo='', destaque='', itens='', fonte='', visual='', midia=None))
    t += d
    print(f'{i+1} {c["enq"]:8s} {d:5.2f}s marcas {marcas}')
print('total', round(t, 2))
json.dump(dict(nome='Black November · Reels', tipo='motion', formato='9:16', alvo=round(t),
               marca=dict(nome='DI PALLACIO', primaria='#0a0806', secundaria='#d4ae5a', texto='#ffffff', fonteTitulo='Anton', fonteTexto='Poppins', cta='EU QUERO', aviso=''),
               cenas=cenas), open('projeto.json', 'w'), ensure_ascii=False, indent=1)
