import json, subprocess, sys, os, wave
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cenas import C
VOZ = sys.argv[1]
LEAD, TAIL = 0.28, 0.42
os.makedirs('voz', exist_ok=True)
cenas, t = [], 0.0
for i, c in enumerate(C):
    f = f'voz/{i:02d}.wav'
    subprocess.run([sys.executable, '-m', 'piper', '-m', VOZ, '--length-scale', '0.87', '--sentence-silence', '0.12', '-f', f], input=c['locucao'].encode(), check=True, capture_output=True)
    # Corta o silêncio que o Piper deixa no começo e no fim
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.04,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.08,areverse', f + '.t.wav'], check=True)
    os.replace(f + '.t.wav', f)
    with wave.open(f) as w: dur = w.getnframes() / w.getframerate()
    lead = 0.6 if i == 0 else LEAD
    tail = 2.2 if c['enq'] == 'assinatura' else TAIL
    d = round(lead + dur + tail, 2)
    cenas.append(dict(id=f'p2l{i:02d}', papel=c['papel'], enquadramento=c['enq'], duracao=d, titulo=c['titulo'], destaque=c.get('destaque', ''),
                      itens=c.get('itens', ''), fonte=c.get('fonte', ''), fala=c['fala'], locucao=c['locucao'], visual='', midia=None,
                      tFala=[lead, round(lead + dur, 2)], inicio=round(t, 3)))
    t += d
    print(f'{i+1:2d} {c["enq"]:10s} {d:5.2f}s  fala {dur:5.2f}s')
print('total', round(t, 2))
proj = dict(nome='Porto 2 Life · aumento do condomínio', tipo='juridico', formato='9:16', alvo=round(t),
            objetivo='Mostrar ao cotista do Porto 2 Life que o reajuste de 10,62% do condomínio e a correção das parcelas (IPCA + 1% a.m., SACOC) são encargos distintos e potencialmente cumulativos, e quais cláusulas garantem transparência.',
            publico='Cotistas do Porto 2 Life', referencia='', pasta='', bpm='', orcamento='',
            marca=dict(nome='DI PALLACIO', primaria='#0d2340', secundaria='#b8863e', texto='#f7f4ec', fonteTitulo='Playfair Display', fonteTexto='Work Sans',
                       cta='Fale com a DI PALLACIO', aviso='Conteúdo informativo. Não substitui uma consulta jurídica.'),
            cenas=cenas, etapas=dict(plano=True, render=True), notas='', criado=1793210000000, atualizado=1793210000000)
json.dump(proj, open('projeto.json', 'w'), ensure_ascii=False, indent=1)
