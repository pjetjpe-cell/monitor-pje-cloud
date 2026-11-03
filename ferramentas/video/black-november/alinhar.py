# Ajusta as marcas de cada cena pelo tempo real da palavra na narração (faster-whisper, word timestamps).
import json, subprocess, sys, unicodedata, numpy as np
from faster_whisper import WhisperModel
sys.path.insert(0, '.')
from cenas import C
norm = lambda s: unicodedata.normalize('NFD', s.lower()).encode('ascii', 'ignore').decode().strip().strip('.,?:!;')
P = json.load(open('projeto.json')); m = WhisperModel('small', device='cpu', compute_type='int8')
for c, orig in zip(P['cenas'], C):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', c['voz'], '-ar', '16000', '-ac', '1', '-f', 'f32le', '-'], capture_output=True).stdout
    segs, _ = m.transcribe(np.frombuffer(raw, np.float32), language='pt', word_timestamps=True)
    ws = [(norm(w.word), w.start) for s in segs for w in s.words]
    novas = []
    for marca, est in zip(orig['marcas'], c['marcas']):
        alvo = norm(marca.split()[0])[:4]; acho = next((ts for w, ts in ws if w.startswith(alvo)), None)
        novas.append(round(c['tFala'][0] + acho, 2) if acho is not None else est)
        print(f"{c['enquadramento']:8s} {marca:12s} estimado {est:5.2f}  real {novas[-1]:5.2f}")
    c['marcas'] = novas
json.dump(P, open('projeto.json', 'w'), ensure_ascii=False, indent=1)
