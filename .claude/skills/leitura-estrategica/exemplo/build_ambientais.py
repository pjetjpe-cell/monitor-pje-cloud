import sys
sys.path.insert(0, '/home/user/monitor-pje-cloud/.claude/skills/leitura-estrategica/scripts')
from engine import *
load('ambientais_m.json')
M = merge_range
def fonte(t): return f'<div class="fonte"><b>Fonte</b> {esc(t)}</div>'
def QA(rot, perg, passos, sid):
    out = pergunta(f'PERGUNTA · {rot}', perg) + rtag()
    for k, (r, c) in enumerate(passos, 1):
        out += step(k, r, c, sid=f'{sid}{k}', alt=True)
    return out
def cards(itens):
    return '<div class="jgrid">' + ''.join(
        f'<div class="jcard"><div class="jtag">{tag}</div><p class="stext">{texto}</p><div class="jmeta"><span>{esc(cit)}</span><em>{uso}</em></div></div>'
        for tag, texto, cit, uso in itens) + '</div>'
COLS = [(0, 195), (195, 265), (265, 392), (392, 600)]
def tabela(cab_idxs, linhas):
    h = '<table class="spec"><thead><tr>' + ''.join(
        (f'<th><span class="num s">{k}</span>{seg(celula(cab_idxs, *c))}</th>' if k else f'<th>{seg(celula(cab_idxs, *c))}</th>')
        for k, c in enumerate(COLS)) + '</tr></thead><tbody>'
    for idxs in linhas:
        cel = [seg(celula(idxs, *c)) for c in COLS]
        h += '<tr><th class="rowh">' + cel[0] + '</th>' + ''.join(f'<td>{c}</td>' for c in cel[1:]) + '</tr>'
    return h + '</tbody></table>'
def nota(idx, x0, x1): return f'<div class="nota-m">{seg(celula([idx], x0, x1))}</div>'

Q = 4
S = M(6, 31)          # sugestão (pula o nº de página 28)
CAB = [50, 51, 52, 53]
LIN = {'decisao': [54, 55, 56, 57, 58], 'interesse': [59, 60, 61, 62], 'dupla': [63, 66], 'extincao': [67, 68, 69, 70]}
NOTAS = 65            # suas duas notas no alto da p.2: "DESOBEDECE NORMAS" | "CRIAÇÃO ÀS AVESSAS"

a = (band('(a)', 'Fundamento: Constituição e lei', 'passos 1 e 2') +
     step(1, 'Base constitucional — CF, art. 225, § 3º', seg(S, 'Excelência,', 'No plano infraconstitucional')) +
     step(2, 'Base legal — Lei 9.605/98, art. 3º: requisitos CUMULATIVOS', seg(S, 'No plano infraconstitucional', '1. A infração'), subs=[
         seg(S, '1. A infração', '2. O crime'), seg(S, '2. O crime', 'No que tange')]))
b = (band('(b)', 'Teoria da Dupla Imputação', 'passos 3 a 5') +
     step(3, 'O que a teoria dizia (passado)', seg(S, 'No que tange', 'Contudo,')) +
     step(4, 'Superada pelo STF e pelo STJ', seg(S, 'Contudo,', 'A autonomia')) +
     step(5, 'Por quê: evitar a impunidade', seg(S, 'A autonomia', 'Quanto às penas')))
c = (band('(c)', 'Penas da pessoa jurídica', 'passo 6') +
     step(6, 'Penas — art. 21 (e art. 24)', seg(S, 'Quanto às penas', 'I - multa'), subs=[
         seg(S, 'I - multa', 'II - penas'),
         seg(S, 'II - penas', 'III - liquidação') + nota(NOTAS, 0, 380),
         seg(S, 'III - liquidação') + nota(NOTAS, 380, 600)]))

duelo_dupla = duel('Duelo A · Dupla imputação: antes × hoje', 'Antes<small>teoria da dupla imputação</small>', 'Hoje<small>STF RE 548.181 · STJ RMS 39.172</small>', [
    ('A tese', seg(S, 'No que tange', 'Contudo,'), seg(S, 'Contudo,', 'A autonomia')),
    ('No quadro do material', seg(celula(LIN['dupla'], 265, 392)), seg(celula(LIN['dupla'], 392, 600)))])
duelo_req = duel('Duelo B · Os 2 requisitos cumulativos do art. 3º', 'Requisito 1<small>decisão</small>', 'Requisito 2<small>interesse ou benefício</small>', [
    ('O que a lei exige', seg(S, '1. A infração', '2. O crime'), seg(S, '2. O crime', 'No que tange')),
    ('Critério dogmático', seg(celula(LIN['decisao'], 265, 392)), seg(celula(LIN['interesse'], 265, 392))),
    ('Orientação jurisprudencial', seg(celula(LIN['decisao'], 392, 600)), seg(celula(LIN['interesse'], 392, 600)))])
quadro = tabela(CAB, [LIN['decisao'], LIN['interesse'], LIN['dupla'], LIN['extincao']])

R1 = M(33, 38); R2 = M(39, 44)
rot = (QA('Roteiro 1', seg(R1, 'Para a persecução', 'RESPOSTA:'), [
           ('Posição', seg(R1, 'Excelência, não.', 'O STF')),
           ('Fundamento', seg(R1, 'O STF'))], 'r1') +
       QA('Roteiro 2', seg(R2, 'Quais são', 'RESPOSTA:'), [
           ('Base legal', seg(R2, 'Excelência, conforme', 'as penas de multa')),
           ('O rol', seg(R2, 'as penas de multa', 'além da liquidação')),
           ('A pena extrema', seg(R2, 'além da liquidação'))], 'r2'))
A = M(46, 49)
apro = caixa('LEIA DE A → B', [seg(A, 'A superação', 'consagra'), seg(A, 'consagra')])
jur = cards([('STF · RE 548.181/PR', seg(72, 'É possível', '(STF'), '(STF, RE 548.181/PR, Rel. Min. Rosa Weber, Primeira Turma, julgado em 06/08/2013)', 'usar em: passo 4 e Roteiro 1'),
             ('STJ · REsp 1.977.172/PR', seg(73, 'O princípio', '(STJ'), '(STJ, REsp 1.977.172/PR, Rel. Min. Ribeiro Dantas, Terceira Seção, julgado em 24/08/2022)', 'usar em: quadro, linha 4 (extinção por incorporação)')])

hw = mnemonico('98 · 88', imagem_b64('imgs_ambientais_m/manuscrito_p1_2.png', 520),
               'Sua anotação à mão sobre a pergunta, com traços ligando a <b>Lei 9.605/1998</b> e a <b>CF/1988</b> (art. 225, § 3º): as duas bases que abrem a resposta (passos 1 e 2).')

parte = (f'<div class="parte" style="break-before:auto">{seg(M(1, 2))}<small>Meta 30 · Questão 1 · PDF completo p.171–173</small></div>' +
         pergunta('PERGUNTA DE PROVA ORAL', seg(Q, 'Candidato,'), grande=True) + hw +
         '<div class="qmap">' + ''.join(f'<div class="qm"><span class="num s">{l}</span><span class="stext">{t}</span></div>' for l, t in [
             ('a', seg(Q, 'disserte sobre', 'Aborde')), ('b', seg(Q, 'Aborde os requisitos', 'e a jurisprudência')),
             ('c', seg(Q, 'a jurisprudência atual'))]) + '</div>' +
         titulo('Trilha da resposta · 6 passos', pequeno=True) +
         trilha([('(a)', 'Fundamento', [(1, 'CF 225 § 3º'), (2, 'Art. 3º: 2 requisitos')]),
                 ('(b)', 'Dupla imputação', [(3, 'Antes'), (4, 'Superada'), (5, 'Por quê')]),
                 ('(c)', 'Penas', [(6, 'Art. 21 e 24')])]) +
         titulo('Sugestão de resposta oral — fale nesta ordem') + a + b + c +
         titulo('Diferenças entre os institutos') + duelo_dupla + duelo_req +
         titulo('Quadro do material', pequeno=True) + '<p class="lede">Ordem de recitação: <b>1</b> previsão legal → <b>2</b> critério dogmático → <b>3</b> orientação jurisprudencial.</p>' + quadro +
         titulo('Roteiro de possíveis perguntas') + rot + titulo('Aprofundamento') + apro + titulo('Jurisprudência') + jur)

corpo = f"""
<header class="mast"><div class="kicker">Leitura estratégica · Direito Penal · Oral PCPI · recorte "CRIMES AMBIENTAIS"</div>
<h1>Responsabilidade penal da pessoa jurídica por crimes ambientais</h1>
<h2>Meta 30, Questão 1, com as suas marcações, a anotação "98 · 88" e as notas "desobedece normas" e "criação às avessas" preservadas.</h2></header>
<section class="panel"><div class="pcol"><div class="ptitle">Suas marcações, mantidas</div>{legenda(ignorar=list(range(74, 89)))}
<p class="pnote">Cada grifo continua no mesmo trecho e na mesma cor; as suas notas escritas aparecem como "✍ sua nota" junto da pena a que se referem.</p></div>
<div class="pcol"><div class="ptitle">Como ler em 3 passadas</div><ol class="how"><li><b>Trilha</b> (1 min).</li><li><b>Só os grifos</b>: são suas âncoras de fala.</li><li><b>Texto completo</b>, na ordem numerada.</li></ol>
<p class="pnote">Agravantes da Lei 9.605 não são tratadas nas Metas: só a pessoa jurídica.</p></div></section>
{parte}
<footer class="src">Material-base: Pompeo Metodologia — Curso de Prova Oral, Polícia Civil do Piauí. A pág. 173 traz também o início da Questão 2 da Meta 30 (estupro de vulnerável), que não entrou aqui.</footer>
"""
open('ambientais.html', 'w').write(shell(corpo, 'Crimes ambientais leitura estratégica'))
print('ok')
