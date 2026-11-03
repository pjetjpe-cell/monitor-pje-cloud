# Gera a narração cena por cena e monta os projetos de cada versão do vídeo.
#   python3 gerar.py <voz.onnx>
# Saída: voz/NN.wav, projeto.json (completo 9:16), projeto-16x9.json, projeto-curto.json
import json, subprocess, sys, os, wave, copy
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from cenas import C
VOZ = sys.argv[1]
# Ritmo natural: sem acelerar, com variação de entonação e pausa de respiração entre frases
PIPER = ['--length-scale', '1.0', '--noise-scale', '0.8', '--noise-w-scale', '0.9', '--sentence-silence', '0.32']
LEAD, TAIL = 0.35, 0.6
CURTO = [0, 3, 9, 10, 11, 13, 14, 15]  # cenas da versão de ~1 minuto
os.makedirs('voz', exist_ok=True)
durs = []
for i, c in enumerate(C):
    f = f'voz/{i:02d}.wav'
    subprocess.run([sys.executable, '-m', 'piper', '-m', VOZ, *PIPER, '-f', f], input=c['locucao'].encode(), check=True, capture_output=True)
    # Corta só o silêncio das pontas que o Piper deixa
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', f, '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.05,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.12,areverse', f + '.t.wav'], check=True)
    os.replace(f + '.t.wav', f)
    with wave.open(f) as w: durs.append(w.getnframes() / w.getframerate())

def projeto(indices, formato, nome):
    cenas, t = [], 0.0
    for n, i in enumerate(indices):
        c = C[i]; dur = durs[i]
        lead = 0.6 if n == 0 else LEAD
        tail = 2.4 if c['enq'] == 'assinatura' else TAIL
        d = round(lead + dur + tail, 2)
        cenas.append(dict(id=f'p2l{i:02d}', papel=c['papel'], enquadramento=c['enq'], duracao=d, titulo=c['titulo'], destaque=c.get('destaque', ''),
                          itens=c.get('itens', ''), fonte=c.get('fonte', ''), fala=c['fala'], locucao=c['locucao'], visual='', midia=None,
                          voz=f'voz/{i:02d}.wav', tFala=[lead, round(lead + dur, 2)], inicio=round(t, 3)))
        t += d
    return dict(nome=nome, tipo='juridico', formato=formato, alvo=round(t),
                objetivo='Mostrar ao cotista do Porto 2 Life que o reajuste de 10,62% do condomínio e a correção das parcelas (IPCA + 1% a.m., SACOC) são encargos distintos e potencialmente cumulativos, e quais cláusulas garantem transparência.',
                publico='Cotistas do Porto 2 Life', referencia='', pasta='', bpm='', orcamento='',
                marca=dict(nome='DI PALLACIO', primaria='#0d2340', secundaria='#b8863e', texto='#f7f4ec', fonteTitulo='Playfair Display', fonteTexto='Work Sans',
                           cta='Fale com a DI PALLACIO', aviso='Conteúdo informativo. Não substitui uma consulta jurídica.'),
                cenas=cenas, etapas=dict(plano=True, render=True), notas='', criado=1793210000000, atualizado=1793210000000)

todas = list(range(len(C)))
for arq, idx, fmt, nome in [('projeto.json', todas, '9:16', 'Porto 2 Life · aumento do condomínio'),
                            ('projeto-16x9.json', todas, '16:9', 'Porto 2 Life · aumento do condomínio (YouTube 16:9)'),
                            ('projeto-curto.json', CURTO, '9:16', 'Porto 2 Life · versão curta')]:
    p = projeto(idx, fmt, nome); json.dump(p, open(arq, 'w'), ensure_ascii=False, indent=1)
    print(f'{arq}: {len(p["cenas"])} cenas, {sum(c["duracao"] for c in p["cenas"]):.1f} s')
