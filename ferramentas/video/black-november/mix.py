# Trilha do Reels Black November: batida 118 BPM, subida antes da revelação, sinos nos cartões,
# impactos nos carimbos, whoosh nas trocas e narração tratada por cima (−14 LUFS).
import json, subprocess, sys, numpy as np
SR = 48000
ENTRADA, SAIDA = (sys.argv[1], sys.argv[2]) if len(sys.argv) > 2 else ('projeto.json', 'audio.wav')
P = json.load(open(ENTRADA)); C = P['cenas']
T = sum(c['duracao'] for c in C); N = int(T * SR) + SR
t = np.arange(N) / SR; rng = np.random.default_rng(11)
def ler(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)
def por(buf, at, x, g=1.0):
    s = int(at * SR)
    if s >= N or s + len(x) <= 0: return
    a = max(0, -s); buf[max(0, s):s + len(x)] += (x[a:N - s] if s + len(x) > N else x[a:]) * g
cena = {c['enquadramento']: c for c in C}
# ---- voz ----
voz = np.zeros(N)
for c in C:
    if c.get('voz'): por(voz, c['inicio'] + c['tFala'][0], ler(c['voz']))
voz.astype('<f4').tofile('voz.f32')
import os
# Voz gravada (apresentador) entra quase sem tratamento; a sintética recebe EQ, compressão e sala
cadeia = 'highpass=f=70,acompressor=threshold=-18dB:ratio=2:attack=8:release=150' if os.environ.get('VOZ_GRAVADA') else ('highpass=f=75,equalizer=f=170:t=q:w=1.0:g=3,equalizer=f=3000:t=q:w=1.4:g=2,equalizer=f=6500:t=q:w=2:g=-2.5,'
          'lowpass=f=11000,acompressor=threshold=-20dB:ratio=3:attack=6:release=120:makeup=2,aecho=0.85:0.7:20|33:0.08|0.05')
voz = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'voz.f32', '-af', cadeia, '-f', 'f32le', '-'],
                                   capture_output=True, check=True).stdout, np.float32).astype(np.float64)
voz = np.pad(voz, (0, max(0, N - len(voz))))[:N]; voz /= np.max(np.abs(voz)) + 1e-9; voz *= 0.92
# ---- música ----
bpm = 118; beat = 60 / bpm; bar = 4 * beat
hz = lambda n: 440 * 2 ** ((n - 69) / 12)
prog = [[45, 57, 60, 64], [41, 57, 60, 65], [48, 55, 60, 64], [43, 55, 59, 62]]  # Lá menor, Fá, Dó, Sol
drop = cena['black']['inicio'] + cena['black']['marcas'][0] - 0.22
fim_beat = cena['cta']['inicio'] + cena['cta']['duracao'] - 1.2
pad = np.zeros(N); baixo = np.zeros(N)
for j in range(int(T / bar) + 2):
    ini = j * bar; a0, a1 = int(ini * SR), min(N, int((ini + bar + 0.3) * SR))
    if a0 >= N: break
    tt = t[a0:a1] - ini; env = np.clip(tt / 0.08, 0, 1) * np.clip((bar + 0.3 - tt) / 0.3, 0, 1)
    ac = prog[j % 4]
    for q, n in enumerate(ac[1:]):
        f = hz(n + 12); pad[a0:a1] += (np.sin(2 * np.pi * f * t[a0:a1]) + 0.3 * np.sin(2 * np.pi * 2.003 * f * t[a0:a1])) * env * 0.3
    for k in range(8):  # baixo em colcheias
        s0 = ini + k * beat / 2; m = int(beat / 2 * 0.9 * SR); x = np.arange(m) / SR
        nota = hz(ac[0] - 12 + (12 if k in (3, 7) else 0))
        y = np.tanh(2.2 * np.sin(2 * np.pi * nota * x)) * np.exp(-x * 5)
        if s0 >= drop and s0 < fim_beat: por(baixo, s0, y, 0.5)
# bateria a partir da revelação
bat = np.zeros(N)
m = int(0.4 * SR); x = np.arange(m) / SR; kick = np.sin(2 * np.pi * (48 + 110 * np.exp(-x * 35)) * x) * np.exp(-x * 7)
m = int(0.22 * SR); x = np.arange(m) / SR; ruido = rng.normal(0, 1, m); clap = np.convolve(ruido, [1, -0.9], 'same') * np.exp(-x * 22)
m = int(0.05 * SR); x = np.arange(m) / SR; hat = np.convolve(rng.normal(0, 1, m), [1, -1], 'same') * np.exp(-x * 110)
b = drop; k = 0
while b < fim_beat:
    if k % 4 in (0, 2) or (k % 8 == 7): por(bat, b, kick, 1.0)
    if k % 4 in (1, 3): por(bat, b, clap, 0.35)
    por(bat, b + beat / 2, hat, 0.12); por(bat, b, hat, 0.06)
    b += beat; k += 1
intro = np.clip((t - 0.0) / 0.6, 0, 1) * np.where(t < drop, 0.55, 1.0)
musica = pad / (np.max(np.abs(pad)) + 1e-9) * 0.2 * intro + baixo / (np.max(np.abs(baixo)) + 1e-9) * 0.22 + bat / (np.max(np.abs(bat)) + 1e-9) * 0.30
# ---- efeitos ----
fx = np.zeros(N)
def whoosh(at, dur=0.4):
    m = int(dur * SR); xx = rng.normal(0, 1, m); y = np.zeros(m); acc = 0.0
    for i in range(m): al = 0.02 + 0.5 * (i / m) ** 2; acc += al * (xx[i] - acc); y[i] = acc
    por(fx, at - dur * 0.6, y * np.sin(np.pi * np.arange(m) / m) ** 2, 0.5)
def subida(fim, dur=1.6):
    m = int(dur * SR); x = np.arange(m) / SR; f = 200 * (12 ** (x / dur))
    y = 0.4 * rng.normal(0, 1, m) * (x / dur) ** 2 + 0.3 * np.sin(2 * np.pi * np.cumsum(f) / SR) * (x / dur) ** 3
    por(fx, fim - dur, y, 0.6)
def impacto(at, g=1.0):
    m = int(1.4 * SR); x = np.arange(m) / SR; y = np.sin(2 * np.pi * (36 + 50 * np.exp(-x * 10)) * x) * np.exp(-x * 2.6)
    y += 0.25 * rng.normal(0, 1, m) * np.exp(-x * 18); por(fx, at, y, g)
def sino(at, nota=88, g=0.5):
    m = int(1.3 * SR); x = np.arange(m) / SR; f = hz(nota)
    y = (np.sin(2 * np.pi * f * x) + 0.45 * np.sin(2 * np.pi * 2.76 * f * x) * np.exp(-x * 3) + 0.25 * np.sin(2 * np.pi * 5.4 * f * x) * np.exp(-x * 6)) * np.exp(-x * 3.2)
    por(fx, at, y, g)
for c in C[1:]: whoosh(c['inicio'])
subida(drop); impacto(drop, 1.1)
e = cena['escada']; [sino(e['inicio'] + mk - 0.3 + 0.05, n) for mk, n in zip(e['marcas'], (88, 86, 84))]
s = cena['sobe']; impacto(s['inicio'] + s['marcas'][0] - 0.1, 0.7); sino(s['inicio'] + s['marcas'][0] - 0.1, 91, 0.4)
z = cena['zero']; impacto(z['inicio'] + z['marcas'][0] - 0.08, 0.9); sino(z['inicio'] + z['marcas'][2] - 0.2, 93, 0.35)
if 'regra' in cena: r = cena['regra']; sino(r['inicio'] + r['marcas'][1] + 0.25, 96, 0.3)
ct = cena['cta']; impacto(ct['inicio'] + ct['marcas'][0] - 0.25, 0.6); sino(ct['inicio'] + ct['marcas'][0] - 0.2, 88, 0.4)
# ---- mix ----
envv = np.convolve(np.abs(voz), np.ones(int(0.2 * SR)) / int(0.2 * SR), 'same'); duck = 1 - 0.5 * np.clip(envv / 0.05, 0, 1)
fade = np.clip(t / 0.4, 0, 1) * np.clip((T - t) / 1.5, 0, 1)
mix = voz + musica * duck * fade + fx / (np.max(np.abs(fx)) + 1e-9) * 0.30
mix = mix[:int(T * SR)]; mix /= np.max(np.abs(mix)) + 1e-9; mix *= 0.95
mix.astype('<f4').tofile('mix.f32')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'mix.f32', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '2', SAIDA], check=True)
print('audio', round(T, 2), 's')
