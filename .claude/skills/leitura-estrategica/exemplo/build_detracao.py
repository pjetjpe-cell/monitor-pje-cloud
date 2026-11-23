import sys
sys.path.insert(0, '/home/user/monitor-pje-cloud/.claude/skills/leitura-estrategica/scripts')
from engine import *
load('detracao_m.json')
M = merge_range
def fonte(t): return f'<div class="fonte"><b>Fonte</b> {esc(t)}</div>'
def QA(rot, perg, passos, sid):
    out = pergunta(f'PERGUNTA · {rot}', perg) + rtag()
    for k, (r, c, subs) in enumerate(passos, 1):
        out += step(k, r, c, subs=subs, sid=f'{sid}{k}', alt=True)
    return out
def cards(itens):
    return '<div class="jgrid">' + ''.join(
        f'<div class="jcard"><div class="jtag">{tag}</div><p class="stext">{texto}</p><div class="jmeta"><span>{esc(cit)}</span><em>{uso}</em></div></div>'
        for tag, texto, cit, uso in itens) + '</div>'
def tabela(cab, linhas, cols):
    h = '<table class="spec"><thead><tr>' + ''.join(f'<th><span class="num s">{k}</span>{esc(c)}</th>' if k else f'<th>{esc(c)}</th>' for k, c in enumerate(cab)) + '</tr></thead><tbody>'
    for idxs in linhas:
        cel = [seg(celula(idxs, x0, x1)) for x0, x1 in cols]
        h += '<tr><th class="rowh">' + cel[0] + '</th>' + ''.join(f'<td>{c}</td>' for c in cel[1:]) + '</tr>'
    return h + '</tbody></table>'

# =========================================================== PARTE A — META 35 Q1
S = M(6, 42); R = M(44, 57); A = M(60, 74); J = M(93, 95); Q = 4
a1 = (band('(a)', 'Problema e regra geral', 'passos 1 e 2') +
      step(1, 'O problema', seg(S, 'Excelência,', 'O Código Penal, art. 5º')) +
      step(2, 'Regra: territorialidade temperada (art. 5º)', seg(S, 'O Código Penal, art. 5º', 'Para a delimitação')))
a2 = (band('(b)', 'Território e lugar do crime', 'passos 3 e 4') +
      step(3, 'O que é território nacional', seg(S, 'Para a delimitação', 'o espaço geográfico'), subs=[
          seg(S, 'o espaço geográfico', 'o mar territorial'), seg(S, 'o mar territorial', 'o espaço aéreo correspondente e'),
          seg(S, 'o espaço aéreo correspondente', 'e, por extensão'), seg(S, 'e, por extensão', 'Estende-se'),
          seg(S, 'Estende-se', 'Quanto ao lugar')]) +
      step(4, 'Lugar do crime: ubiquidade (art. 6º)', seg(S, 'Quanto ao lugar do crime', 'A extraterritorialidade está')))
a3 = (band('(c)', 'Extraterritorialidade (art. 7º)', 'passos 5 a 10') +
      step(5, 'Duas modalidades', seg(S, 'A extraterritorialidade está', 'A incondicionada')) +
      step(6, 'Incondicionada — hipóteses', seg(S, 'A incondicionada aplica-se aos crimes', 'contra a vida'), subs=[
          seg(S, 'contra a vida', 'contra o patrimônio'), seg(S, 'contra o patrimônio', 'contra a Administração Pública'),
          seg(S, 'contra a Administração Pública', 'e ao genocídio'), seg(S, 'e ao genocídio', 'Nessas hipóteses')]) +
      step(7, 'Incondicionada — efeito: só a detração do art. 8º', seg(S, 'Nessas hipóteses', 'A extraterritorialidade condicionada')) +
      step(8, 'Condicionada — hipóteses', seg(S, 'A extraterritorialidade condicionada', 'Sua incidência')) +
      step(9, 'Condicionada — condições cumulativas', seg(S, 'Sua incidência', 'a) entrada'), subs=[
          ('a', seg(S, 'entrada do agente', 'b) ser')), ('b', seg(S, 'ser o fato punível', 'c) estar')),
          ('c', seg(S, 'estar o crime incluído', 'd) não ter')), ('d', seg(S, 'não ter sido o agente absolvido', 'e) não ter')),
          ('e', seg(S, 'não ter sido perdoado', 'Há, ainda'))]) +
      step(10, 'Hipercondicionada (estrangeiro contra brasileiro)', seg(S, 'Há, ainda')))
duelo_ext = duel('Duelo A · Extraterritorialidade incondicionada × condicionada', 'Incondicionada<small>art. 7º, I</small>', 'Condicionada<small>art. 7º, II</small>', [
    ('Quando se aplica', seg(S, 'A incondicionada aplica-se aos crimes', 'Nessas hipóteses'), seg(S, 'A extraterritorialidade condicionada', 'Sua incidência')),
    ('O que se exige / efeito', seg(S, 'Nessas hipóteses', 'A extraterritorialidade condicionada'), seg(S, 'Sua incidência', 'Há, ainda'))])
duelo_teorias = duel('Duelo B · CP, art. 6º × CPP, art. 70', 'CP, art. 6º<small>lei penal aplicável</small>', 'CPP, art. 70<small>competência</small>', [
    ('Teoria e efeito', seg(R, 'o CP, art. 6º', 'Já o CPP'), seg(R, 'Já o CPP', 'PERGUNTA 2'))])
duelo_imun = duel('Duelo C · Imunidade diplomática × consular', 'Diplomática', 'Consular', [
    ('Alcance', seg(A, 'a imunidade diplomática', 'da consular'), seg(A, 'da consular', 'Merece registro'))])
quadro35 = tabela(['Princípio', 'Critério', 'Hipótese legal'], [[76, 77], [78, 79], [80, 81, 82, 83], [84, 85], [86, 87, 88, 89], [90, 91]],
                  [(0, 195), (195, 365), (365, 600)])
rot35 = (QA('Roteiro 1', seg(R, 'Qual a diferença', 'RESPOSTA:'), [
            ('Art. 6º do CP — ubiquidade', seg(R, 'Excelência, o CP', 'Já o CPP'), None),
            ('Art. 70 do CPP — resultado', seg(R, 'Já o CPP', 'PERGUNTA 2'), None)], 'r35a') +
         QA('Roteiro 2', seg(R, 'Aplica-se a lei brasileira', 'RESPOSTA: Excelência, em regra'), [
            ('Posição', seg(R, 'Excelência, em regra não por territorialidade', 'pois a extensão'), None),
            ('Por quê', seg(R, 'pois a extensão', 'Estando em águas'), None),
            ('A saída: extraterritorialidade condicionada', seg(R, 'Estando em águas'), None)], 'r35b'))
apro35 = caixa('LEIA DE A → D', [seg(A, 'Além da territorialidade', 'A intraterritorialidade'),
                                 seg(A, 'A intraterritorialidade', 'Distinga-se'),
                                 seg(A, 'Distinga-se', 'Merece registro'), seg(A, 'Merece registro')])
jur35 = cards([('STF · RE 628.624/MG (Tema 393)', seg(J, 'Compete à Justiça Federal', '(STF, RE 628.624'), '(STF, RE 628.624/MG, Tema 393, Rel. p/ acórdão Min. Edson Fachin, Plenário, julgado em 29/10/2015)', 'usar em: aprofundamento D'),
               ('CP, arts. 7º, § 1º, e 8º', seg(J, 'Na hipótese de extraterritorialidade', '(CP, arts.'), '(CP, arts. 7º, § 1º, e 8º)', 'usar em: passo 7 (detração)')])
parteA = (f'<div class="parte" style="break-before:auto">{seg(M(1, 2))}<small>Meta 35 · Questão 1 · PDF completo p.211–214</small></div>' +
          pergunta('PERGUNTA DE PROVA ORAL', seg(Q, 'Candidato,'), grande=True) +
          '<div class="qmap">' + ''.join(f'<div class="qm"><span class="num s">{l}</span><span class="stext">{t}</span></div>' for l, t in [
              ('a', seg(Q, 'a aplicação da lei penal no espaço', ', indicando')), ('b', seg(Q, 'o princípio adotado', 'e diferenciando')),
              ('c', seg(Q, 'a extraterritorialidade incondicionada'))]) + '</div>' +
          titulo('Trilha da resposta · 10 passos', pequeno=True) +
          trilha([('(a)', 'Problema e regra', [(1, 'Problema'), (2, 'Territorialidade')]),
                  ('(b)', 'Território e lugar', [(3, 'Território'), (4, 'Ubiquidade')]),
                  ('(c)', 'Extraterritorialidade', [(5, '2 modalidades'), (6, 'Incondicionada'), (7, 'Detração art. 8º'), (8, 'Condicionada'), (9, 'Condições a–e'), (10, 'Hipercondicionada')])]) +
          titulo('Sugestão de resposta oral — fale nesta ordem') + a1 + a2 + a3 +
          titulo('Diferenças entre os institutos') + duelo_ext + duelo_teorias + duelo_imun +
          titulo('Quadro dos princípios', pequeno=True) + '<p class="lede">Ordem de recitação: <b>1</b> critério → <b>2</b> hipótese legal.</p>' + quadro35 +
          titulo('Roteiro de possíveis perguntas') + rot35 + titulo('Aprofundamento') + apro35 + titulo('Jurisprudência') + jur35)

# =========================================================== PARTE B — META 44 Q1
S2 = M(128, 186); R2 = M(188, 201); A2 = M(203, 220); J2 = 249; Q2 = M(125, 126)
b1 = (band('(a)', 'Natureza e momento de cada instituto', 'passos 1 a 4') +
      step(1, 'O ponto comum', seg(S2, 'Excelência,', 'A suspensão condicional'), sid='b1') +
      step(2, 'Sursis — antes do cumprimento', seg(S2, 'A suspensão condicional da pena (sursis)', 'O livramento condicional pressupõe'), sid='b2') +
      step(3, 'Livramento — durante a execução', seg(S2, 'O livramento condicional pressupõe', 'Um suspende'), sid='b3') +
      step(4, 'Síntese de uma frase', seg(S2, 'Um suspende', 'Os requisitos do sursis'), sid='b4'))
b2 = (band('(b)', 'Requisitos', 'passos 5 a 7') +
      step(5, 'Sursis — requisitos (art. 77)', seg(S2, 'Os requisitos do sursis', 'pena privativa de liberdade não superior'), subs=[
          seg(S2, 'pena privativa de liberdade não superior', 'não ser o condenado reincidente'), seg(S2, 'não ser o condenado reincidente', 'culpabilidade,'),
          seg(S2, 'culpabilidade,', 'e não ser indicada'), seg(S2, 'e não ser indicada', 'O período de prova varia'),
          seg(S2, 'O período de prova varia', 'Quanto às suas espécies')], sid='b5') +
      step(6, 'Sursis — espécies', seg(S2, 'Quanto às suas espécies:', 'o sursis simples'), subs=[
          seg(S2, 'o sursis simples', 'o sursis especial'), seg(S2, 'o sursis especial', 'já o sursis etário'),
          seg(S2, 'já o sursis etário', 'Os requisitos do livramento')], sid='b6') +
      step(7, 'Livramento — requisitos (art. 83)', seg(S2, 'Os requisitos do livramento', 'pena privativa de liberdade igual'), subs=[
          seg(S2, 'pena privativa de liberdade igual', 'cumprimento de mais de um terço'), seg(S2, 'cumprimento de mais de um terço', 'mais da metade'),
          seg(S2, 'mais da metade', 'e mais de dois terços'), seg(S2, 'e mais de dois terços', 'Exige-se também'),
          seg(S2, 'Exige-se também', 'Para o condenado por crime doloso'), seg(S2, 'Para o condenado por crime doloso', 'As causas de revogação')], sid='b7'))
b3 = (band('(c)', 'Revogação e término', 'passos 8 a 10') +
      step(8, 'Sursis — revogação', seg(S2, 'As causas de revogação', 'No sursis, a revogação'), subs=[
          seg(S2, 'No sursis, a revogação', 'Por sua vez, é facultativa'), seg(S2, 'Por sua vez, é facultativa', 'No livramento condicional, a revogação')], sid='b8') +
      step(9, 'Livramento — revogação', subs=[
          seg(S2, 'No livramento condicional, a revogação', 'A revogação é facultativa'), seg(S2, 'A revogação é facultativa', 'Quanto aos efeitos')], sid='b9') +
      step(10, 'Efeitos da revogação e fim do prazo', seg(S2, 'Quanto aos efeitos', 'No livramento condicional, se a revogação'), subs=[
          seg(S2, 'No livramento condicional, se a revogação', 'contudo,'), seg(S2, 'contudo,', 'Expirado o prazo'),
          seg(S2, 'Expirado o prazo', 'De forma diversa'), seg(S2, 'De forma diversa')], sid='b10'))
# quadro original como duelo numerado, com as suas notas na linha "Pena"
NOTA = 251
linhas = [('Momento', [222]), ('Pena', [223, 224]), ('Fração cumprida', [225]), ('Reincidência em crime doloso', [226, 227, 228, 229, 230, 231]),
          ('Hediondos', [232, 233]), ('Período de prova', [234]), ('Revogação obrigatória', [235, 236, 237, 238, 239, 240]),
          ('Revogação facultativa', [241, 242, 243, 244, 245]), ('Término do prazo', [246, 247])]
rows = []
for rot, idxs in linhas:
    l = seg(celula(idxs, 185, 365)); r = seg(celula(idxs, 365, 600))
    if rot == 'Pena':
        l += f'<div class="nota-m">{seg(celula([NOTA], 185, 380))}</div>'; r += f'<div class="nota-m">{seg(celula([NOTA], 380, 600))}</div>'
    rows.append((seg(celula(idxs, 0, 185)), l, r))
duelo_sl = duel('Duelo D · Sursis × Livramento condicional (quadro do material)', seg(celula([221], 185, 365)), seg(celula([221], 365, 600)), rows)
duelo_proc = duel('Duelo E · Sursis da pena × Sursis do processo', 'Sursis da pena<small>CP, art. 77</small>', 'Sursis do processo<small>Lei 9.099/1995, art. 89</small>', [
    ('O que é e quando cabe', seg(S2, 'A suspensão condicional da pena (sursis)', 'O livramento condicional pressupõe'), seg(A2, 'a suspensão condicional do processo', 'A distinção entre os dois'))])
rot44 = (QA('Roteiro 1', seg(R2, 'O condenado reincidente', 'RESPOSTA:'), [
            ('Posição', seg(R2, 'Excelência, em regra não', 'Há, porém'), None),
            ('A exceção: condenação anterior só a multa', seg(R2, 'Há, porém', 'Recorde-se'), None),
            ('Subsidiariedade do sursis', seg(R2, 'Recorde-se', 'PERGUNTA 2'), None)], 'r44a') +
         QA('Roteiro 2', seg(R2, 'Expirado o período', 'RESPOSTA: Excelência, a extinção'), [
            ('Posição', seg(R2, 'Excelência, a extinção', 'a ausência de suspensão'), None),
            ('Fundamento e consequência', seg(R2, 'a ausência de suspensão'), None)], 'r44b'))
apro44 = caixa('LEIA DE A → D', [seg(A2, 'O sursis aplica-se', 'Há, ainda'), seg(A2, 'Há, ainda', 'Não se confunde'),
                                 seg(A2, 'Não se confunde', 'Para os condenados'), seg(A2, 'Para os condenados')])
jur44 = cards([('STJ · Súmula 617', seg(J2, 'A ausência de suspensão', '(STJ, Súmula 617)'), '(STJ, Súmula 617)', 'usar em: passo 10 e Roteiro 2'),
               ('STJ · Súmulas 534 e 441', seg(J2, 'A prática de falta grave', '(STJ, Súmulas'), '(STJ, Súmulas 534 e 441)', 'falta grave: progressão sim, livramento não')])
parteB = (f'<div class="parte">{seg(M(122, 123))}<small>Meta 44 · Questão 1 · PDF completo p.277–280</small></div>' +
          pergunta('PERGUNTA DE PROVA ORAL', seg(Q2, 'Candidato,'), grande=True) +
          '<div class="qmap">' + ''.join(f'<div class="qm"><span class="num s">{l}</span><span class="stext">{t}</span></div>' for l, t in [
              ('a', seg(Q2, 'a suspensão condicional da pena do livramento', ', indicando')), ('b', seg(Q2, 'os requisitos de cada', 'e as hipóteses')),
              ('c', seg(Q2, 'as hipóteses de revogação'))]) + '</div>' +
          titulo('Trilha da resposta · 10 passos', pequeno=True) +
          trilha([('(a)', 'Natureza e momento', [(1, 'Ponto comum'), (2, 'Sursis'), (3, 'Livramento'), (4, 'Síntese')]),
                  ('(b)', 'Requisitos', [(5, 'Art. 77'), (6, 'Espécies'), (7, 'Art. 83')]),
                  ('(c)', 'Revogação e término', [(8, 'Sursis'), (9, 'Livramento'), (10, 'Efeitos')])]).replace('href="#s', 'href="#b') +
          titulo('Sugestão de resposta oral — fale nesta ordem') + b1 + b2 + b3 +
          titulo('Diferenças entre os institutos') + duelo_sl + duelo_proc +
          titulo('Roteiro de possíveis perguntas') + rot44 + titulo('Aprofundamento') + apro44 + titulo('Jurisprudência') + jur44)

corpo = f"""
<header class="mast"><div class="kicker">Leitura estratégica · Direito Penal · Oral PCPI · recorte "DETRAÇÃO"</div>
<h1>Detração: lei penal no espaço (art. 8º) e sursis × livramento (art. 88)</h1>
<h2>As duas questões das Metas em que a detração aparece, com as suas marcações e notas preservadas.</h2></header>
<section class="panel"><div class="pcol"><div class="ptitle">Suas marcações, mantidas</div>{legenda()}
<p class="pnote">Cada grifo continua no mesmo trecho e na mesma cor; suas notas escritas aparecem como "✍ sua nota".</p></div>
<div class="pcol"><div class="ptitle">Como ler em 3 passadas</div><ol class="how"><li><b>Trilha</b> de cada questão (1 min).</li><li><b>Só os grifos</b>: são suas âncoras de fala.</li><li><b>Texto completo</b>, na ordem numerada.</li></ol>
<p class="pnote">A detração está no passo 7 da 1ª questão (art. 8º) e no passo 10 da 2ª (art. 88).</p></div></section>
{parteA}
{parteB}
<footer class="src">Material-base: Pompeo Metodologia — Curso de Prova Oral, Polícia Civil do Piauí. A pág. 214 traz também o início da Questão 2 da Meta 35 (crimes contra as finanças públicas), sem marcações, que não entrou aqui.</footer>
"""
open('detracao.html', 'w').write(shell(corpo, 'Detração leitura estratégica'))
print('ok')
