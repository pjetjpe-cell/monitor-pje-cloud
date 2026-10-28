import json, subprocess, numpy as np
SR = 48000
P = json.load(open('projeto.json'))
T = sum(c['duracao'] for c in P['cenas']); N = int(T * SR) + SR
rng = np.random.default_rng(7)

def ler(f):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', f, '-ar', str(SR), '-ac', '1', '-f', 'f32le', '-'], capture_output=True, check=True).stdout
    return np.frombuffer(raw, np.float32).astype(np.float64)

# Voz
voz = np.zeros(N)
for i, c in enumerate(P['cenas']):
    a = ler(f'voz/{i:02d}.wav'); s = int((c['inicio'] + c['tFala'][0]) * SR); voz[s:s + len(a)] += a[:N - s]
voz /= np.max(np.abs(voz)) + 1e-9; voz *= 0.9

t = np.arange(N) / SR
hz = lambda n: 440 * 2 ** ((n - 69) / 12)
# Base harmônica: Ré menor, Si bemol, Fá, Dó — 8 s cada, com transição suave
acordes = [[50, 57, 62, 65, 69], [46, 53, 58, 62, 65], [41, 53, 57, 60, 65], [48, 55, 60, 64, 67]]
pad = np.zeros(N); L = 8.0
for j in range(int(T / L) + 2):
    ini = j * L - 1.5; fim = ini + L + 3.0
    a0, a1 = max(0, int(ini * SR)), min(N, int(fim * SR))
    if a0 >= a1: continue
    tt = t[a0:a1] - ini; env = np.clip(tt / 1.5, 0, 1) * np.clip((fim - ini - tt) / 1.5, 0, 1); env = env ** 1.5
    for q, n in enumerate(acordes[j % 4]):
        f = hz(n); det = 1 + 0.0015 * (q - 2)
        onda = np.sin(2 * np.pi * f * det * t[a0:a1]) + 0.25 * np.sin(2 * np.pi * 2 * f * t[a0:a1] + q) + 0.08 * np.sin(2 * np.pi * 3 * f * t[a0:a1])
        pad[a0:a1] += onda * env * (0.6 if q == 0 else 0.35)
pad *= 1 + 0.15 * np.sin(2 * np.pi * 0.11 * t)
# Pulso: batida grave suave a 84 BPM depois do gancho
bpm = 84; beat = 60 / bpm; pulso = np.zeros(N)
t_ini = P['cenas'][2]['inicio']; t_fim = P['cenas'][-1]['inicio']
kick_t = np.arange(int(0.35 * SR)) / SR
kick = np.sin(2 * np.pi * (45 + 60 * np.exp(-kick_t * 30)) * kick_t) * np.exp(-kick_t * 9)
tick = rng.normal(0, 1, int(0.05 * SR)) * np.exp(-np.arange(int(0.05 * SR)) / SR * 90)
tick = np.convolve(tick, [1, -1], 'same')
b = t_ini; n = 0
while b < t_fim:
    s = int(b * SR)
    if n % 2 == 0: pulso[s:s + len(kick)] += kick[:N - s] * 0.9
    s2 = int((b + beat / 2) * SR); pulso[s2:s2 + len(tick)] += tick[:N - s2] * 0.12
    b += beat; n += 1
# Efeitos: whoosh em cada troca de cena, impacto nos números
fx = np.zeros(N)
def whoosh(at, dur=0.42):
    m = int(dur * SR); x = rng.normal(0, 1, m); y = np.zeros(m); acc = 0.0
    for i in range(m):  # passa-baixas que abre ao longo do tempo
        al = 0.02 + 0.5 * (i / m) ** 2; acc += al * (x[i] - acc); y[i] = acc
    env = np.sin(np.pi * np.arange(m) / m) ** 2; s = int(max(0, at - dur * 0.6) * SR); fx[s:s + m] += (y * env * 0.5)[:N - s]
def impacto(at):
    m = int(1.2 * SR); tt = np.arange(m) / SR; y = np.sin(2 * np.pi * (38 + 40 * np.exp(-tt * 12)) * tt) * np.exp(-tt * 3.2)
    s = int(at * SR); fx[s:s + m] += (y * 0.8)[:N - s]
for c in P['cenas'][1:]: whoosh(c['inicio'])
impacto(P['cenas'][0]['inicio'] + 1.4)
for c in P['cenas']:
    if c['enquadramento'] == 'duplo': impacto(c['inicio'] + 3.3)
    if c['enquadramento'] == 'assinatura': impacto(c['inicio'] + 0.2)
# Ducking: música abaixa quando há voz
envv = np.convolve(np.abs(voz), np.ones(int(0.25 * SR)) / int(0.25 * SR), 'same'); duck = 1 - 0.55 * np.clip(envv / 0.06, 0, 1)
musica = (pad / np.max(np.abs(pad)) * 0.16 + pulso / (np.max(np.abs(pulso)) + 1e-9) * 0.10) * duck
fade = np.clip(t / 1.0, 0, 1) * np.clip((T - t) / 2.5, 0, 1)
mix = voz + musica * fade + fx / (np.max(np.abs(fx)) + 1e-9) * 0.22
mix = mix[:int(T * SR)]; mix /= np.max(np.abs(mix)) + 1e-9; mix *= 0.95
(mix.astype('<f4')).tofile('mix.f32')
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', 'mix.f32', '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11', '-ar', str(SR), '-ac', '2', 'audio.wav'], check=True)
print('audio', round(T, 2), 's')
