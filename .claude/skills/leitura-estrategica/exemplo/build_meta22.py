#!/usr/bin/env python3
"""EXEMPLO DE REFERÊNCIA — Meta 22 de Direito Penal (Prescrição) — Curso Pompeo, PC-PI.

É o que um build_*.py deve ser: SÓ composição (quais âncoras vão em quais passos). O texto e as marcações
vêm do PDF via engine.seg(); nada é redigitado. Os índices de parágrafo (3, 5, 7...) são deste PDF e
mudam em outro material: rode extrair.py e leia `python3 -c` listando os parágrafos para achar os seus.

    python3 -I extrair.py meta22.pdf paras.json --imgs imgs --manter-parcial intercorrente superveniente
    python3 -I exemplo/build_meta22.py paras.json imgs/stamp_p1_1.png saida.html
    python3 -I verificar.py paras.json saida.html --ignorar 11 12 20 26 39 70 --viewport
    node render_pdf.js $PWD/saida.html $PWD/saida.pdf "Meta 22 · Direito Penal · leitura estratégica"
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts'))
from engine import *

paras_json, sagui_png, saida = sys.argv[1:4]
load(paras_json)
IGN = (11, 12, 20, 26, 39, 70)          # nº de página e a anotação 'SU - IN - SAGUI' (vai pelo mnemonico())

# ============================================================ (a) NATUREZA E FUNDAMENTO
s1 = step(1, 'Conceito', seg(5, 'Excelência,', 'Apresenta tríplice'))
s2 = step(2, 'Fundamento (tríplice)', seg(5, 'Apresenta tríplice fundamento dogmático:', 'a teoria do esquecimento'),
          subs=[seg(5, 'a teoria do esquecimento', 'a teoria da expiação'),
                seg(5, 'a teoria da expiação', 'e a segurança jurídica'),
                seg(5, 'e a segurança jurídica', 'Trata-se de matéria')])
s3 = step(3, 'Regime jurídico',
          subs=[seg(5, 'Trata-se de matéria', 'com natureza de direito'),
                seg(5, 'com natureza de direito', 'e pelo princípio'),
                seg(5, 'e pelo princípio')])
# ============================================================ (b) PPP × PPE
s4 = step(4, 'Anúncio: duas categorias', seg(6))
s5 = step(5, 'PPP — quando opera e o que desfaz', seg(7, 'A prescrição da pretensão punitiva (PPP),', 'que opera antes'),
          subs=[seg(7, 'que opera antes', 'e desconstitui'),
                seg(7, 'e desconstitui', '(o réu retorna'),
                seg(7, '(o réu retorna', 'Apresenta três subespécies')])
mnemo = mnemonico('SU - IN - SAGUI', imagem_b64(sagui_png, 200),
                  'sua anotação: <b>SU</b>perveniente = <b>IN</b>tercorrente '
                  '(as sílabas <mark class="r">int</mark> e <mark class="r">sup</mark> estão grifadas no texto)')
s6 = step(6, 'PPP — três subespécies', seg(7, 'Apresenta três subespécies:'),
          subs=[('6.1', seg(8, 'PPP em abstrato')),
                ('6.2', seg(9, 'PPP retroativa')),
                ('6.3', cat(seg(10, 'PPP intercorrente'), seg(13)))],      # parágrafo que continua na página seguinte
          extra=mnemo)
s7 = step(7, 'PPE — pressuposto, alcance e o que sobra', seg(14, 'Por sua vez, a prescrição da pretensão executória (PPE)', 'pressupõe'),
          subs=[seg(14, 'pressupõe', 'e atinge'), seg(14, 'e atinge', 'preservando'), seg(14, 'preservando')])
s8 = step(8, 'Termo inicial da PPE — da regra literal à actio nata',
          subs=[seg(15, 'Quanto ao termo inicial', 'Todavia,'), seg(15, 'Todavia,', 'Assim, diante'), seg(15, 'Assim, diante')])
s9 = step(9, 'Tema 788/STF e a modulação',
          subs=[('9.1', seg(16, 'Por essa razão', 'Em atenção')),
                ('9.2', seg(16, 'Em atenção', '(i) a')),
                ('(i)', seg(16, '(i) a', 'e (ii)', skip_a=True)),
                ('(ii)', seg(16, 'e (ii)', 'Para os casos', skip_a=True)),
                ('9.3', seg(16, 'Para os casos'))])
# ============================================================ (c) MARCOS
s10 = step(10, 'Causas interruptivas (art. 117) — taxativas', seg(17, 'Por fim,', '(I) recebimento'),
           subs=[('I', seg(17, 'recebimento da denúncia', '(II)')),
                 ('II', seg(17, '(II) ', '(III)', skip_a=True)), ('III', seg(17, '(III) ', '(IV)', skip_a=True)),
                 ('IV', seg(17, '(IV) ', '(V)', skip_a=True)), ('V', seg(17, '(V) ', 'e (VI)', skip_a=True)),
                 ('VI', seg(17, '(VI) ', 'A interrupção', skip_a=True))])
s11 = step(11, 'Efeito da interrupção e comunicabilidade',
           subs=[seg(17, 'A interrupção', 'As causas dos incisos'), seg(17, 'As causas dos incisos', 'Já as causas suspensivas')])
s12 = step(12, 'Causas suspensivas', seg(17, 'Já as causas suspensivas', 'paralisam'),
           subs=[seg(17, 'paralisam', 'que é retomado'), seg(17, 'que é retomado')])

# ============================================================ DIFERENÇAS (só trechos do material, lado a lado)
duelo_a = duel('Duelo A · PPP × PPE', 'PPP<small>Pretensão punitiva</small>', 'PPE<small>Pretensão executória</small>', [
    ('Quando opera / pressuposto', seg(7, 'que opera antes', 'e desconstitui'), seg(14, 'pressupõe', 'e atinge')),
    ('Alcance', seg(7, 'e desconstitui', '(o réu retorna'), seg(14, 'e atinge', 'preservando')),
    ('O que fica depois', seg(7, '(o réu retorna', 'Apresenta três subespécies'), seg(14, 'preservando')),
    ('Reincidência e o prazo', seg(23, 'a reincidência não produz qualquer efeito', 'A razão'), seg(23, 'o art. 110, caput', 'Registre-se'))])
duelo_b = duel('Duelo B · Termo inicial da PPE — antes × depois de 12/11/2020',
               'Até 12/11/2020<small>marco literal</small>', 'Após 12/11/2020<small>Tema 788/STF</small>', [
    ('Quando o prazo começa a correr', seg(15, 'a dicção literal', 'Todavia,'), seg(16, 'fixou a tese', 'Em atenção')),
    ('Quando vale', seg(16, 'Para os casos'),
     cat(seg(16, 'Em atenção', '(i) a'), seg(16, '(i) a', 'e (ii)'), seg(16, 'e (ii)', 'Para os casos')))])
duelo_c = duel('Duelo C · Interrupção × Suspensão', 'Interrupção<small>causas interruptivas</small>', 'Suspensão<small>causas suspensivas</small>', [
    ('Previsão', seg(17, 'as causas interruptivas', '(I) recebimento'), seg(17, 'causas suspensivas', 'paralisam')),
    ('Efeito sobre o prazo', seg(17, 'A interrupção', 'As causas dos incisos'),
     cat(seg(17, 'paralisam', 'que é retomado'), seg(17, 'que é retomado'))),
    ('Comunicabilidade', seg(17, 'As causas dos incisos', 'Já as causas suspensivas'),
     '<span class="dash">— não tratado neste material</span>')])

# quadro original (células espalhadas em vários blocos do PDF): monte linha a linha
linhas = [
    (seg(33), cat(seg(34), seg(35)), cat(seg(36), seg(37)), seg(38)),
    (seg(41, 'PPP retroativa', 'Pena concreta'), seg(41, 'Pena concreta'), cat(seg(42), seg(43), seg(44), seg(45)), seg(46)),
    (seg(47), seg(48), seg(49) + ' ' + seg(50) + seg(51), seg(52)),          # 'projetando-' + 'se': sem espaço
    (seg(53), cat(seg(54), seg(55)), cat(seg(56), seg(57)), cat(seg(58), seg(59))),
]
tabela = ('<table class="spec"><thead><tr><th>Espécie</th><th><span class="num s">1</span>Base de cálculo</th>'
          '<th><span class="num s">2</span>Termo inicial</th><th><span class="num s">3</span>Efeitos do reconhecimento</th></tr></thead><tbody>'
          + ''.join('<tr><th class="rowh">' + r[0] + '</th>' + ''.join(f'<td>{c}</td>' for c in r[1:]) + '</tr>' for r in linhas)
          + '</tbody></table>')

# ============================================================ PERGUNTAS DO EXAMINADOR (círculo vazado = alt)
p1 = (pergunta('PERGUNTA 1', seg(19, 'É admissível')) + rtag() +
      step(1, 'Posição', seg(21, 'Excelência, não.', 'A prescrição virtual'), sid='p1a', alt=True) +     # sem 'RESPOSTA:'
      step(2, 'Conceito', seg(21, 'A prescrição virtual', 'Embora invocada'), sid='p1b', alt=True) +
      step(3, 'A tese que a defende', seg(21, 'Embora invocada', 'o instituto não possui'), sid='p1c', alt=True) +
      step(4, 'Por que não: três vícios', subs=[seg(21, 'o instituto não possui', 'viola os princípios'),
                                                 seg(21, 'viola os princípios', 'além de subtrair'),
                                                 seg(21, 'além de subtrair', 'O Superior Tribunal')], sid='p1d', alt=True) +
      step(5, 'Jurisprudência — STJ', seg(21, 'O Superior Tribunal', 'No mesmo sentido'), sid='p1e', alt=True) +
      step(6, 'Jurisprudência — STF', seg(21, 'No mesmo sentido', 'Na prática policial'), sid='p1f', alt=True) +
      step(7, 'Consequência na prática policial', seg(21, 'Na prática policial'), sid='p1g', alt=True))
p2 = (pergunta('PERGUNTA 2', seg(22, 'A reincidência influi')) + rtag() +
      step(1, 'Posição', seg(23, 'Excelência, é preciso distinguir.', 'Na prescrição da pretensão punitiva'), sid='p2a', alt=True) +
      step(2, 'PPP — nenhum efeito (Súmula 220/STJ)', seg(23, 'Na prescrição da pretensão punitiva', 'A razão'), sid='p2b', alt=True) +
      step(3, 'Razão lógica e cronológica', seg(23, 'A razão', 'Já na prescrição'), sid='p2c', alt=True) +
      step(4, 'PPE — prazo aumentado de 1/3', seg(23, 'Já na prescrição', 'Registre-se'), sid='p2d', alt=True) +
      step(5, 'Reincidência também interrompe a PPE', seg(23, 'Registre-se', 'interrupção que'), sid='p2e', alt=True) +
      step(6, 'Quando interrompe', seg(23, 'interrupção que'), sid='p2f', alt=True,
           extra='<div class="xnote"><span class="xglyph">✗</span> as palavras riscadas à mão por você marcam a data que <b>não</b> vale '
                 '(trânsito em julgado da nova condenação).</div>'))

# ============================================================ APROFUNDAMENTO, OBSERVAÇÕES, JURISPRUDÊNCIA
# sublinhados do original que o extrator detecta sozinho (linhas pretas sob o texto) — nada a fazer aqui.
apro = caixa('LEIA DE A → E', [
    seg(25, 'Quanto ao termo inicial', 'Ocorre que'), seg(25, 'Ocorre que', 'Julgando o Tema 788'),
    seg(25, 'Julgando o Tema 788', 'O Supremo, contudo'), seg(25, 'O Supremo, contudo', 'Para a autoridade policial'),
    cat(seg(25, 'Para a autoridade policial'), seg(27))])
obs_i = ('<div class="obs"><div class="obsh"><span class="num s">i</span><span class="slabel">Observação final · redução pela metade (art. 115 do CP)</span></div>'
         '<div class="subs">'
         f'<div class="sub"><span class="sn">i.1</span><span class="stext">{seg(29, "os prazos prescricionais", "sendo que o STJ")}</span></div>'
         f'<div class="sub"><span class="sn">i.2</span><span class="stext">{seg(29, "sendo que o STJ")}</span></div></div>'
         + caixa('QUADRO DE APOIO · idade de 70 anos', [seg(30, 'Para que incida', 'Existe, no entanto'),
                                                        seg(30, 'Existe, no entanto', 'Cuidado!'), seg(30, 'Cuidado!')],
                 marcadores=['①', '②', '③']) + '</div>')
obs_ii = ('<div class="obs"><div class="obsh"><span class="num s">ii</span><span class="slabel">Observação final · imprescritíveis</span></div><div class="subs">'
          f'<div class="lead"><span class="stext">{seg(31, "são imprescritíveis", "o racismo")}</span></div>'
          f'<div class="sub"><span class="sn">ii.1</span><span class="stext">{seg(31, "o racismo", "e a ação")}</span></div>'
          f'<div class="sub"><span class="sn">ii.2</span><span class="stext">{seg(31, "e a ação", "bem como")}</span></div>'
          f'<div class="sub"><span class="sn">ii.3</span><span class="stext">{seg(31, "bem como")}</span></div></div></div>')
juris = '<div class="jgrid">' + ''.join(
    f'<div class="jcard"><div class="jtag">{tag}</div><p class="stext">{seg(i, None, "(ST")}</p>'
    f'<div class="jmeta"><span>{esc(text_of(i)[text_of(i).find("(ST"):])}</span><em>{uso}</em></div></div>'
    for i, tag, uso in [(61, 'STJ · Súmula 438', 'usar em: Pergunta 1 · passo 5'), (62, 'STJ · Súmula 220', 'usar em: Pergunta 2 · passo 2'),
                        (63, 'STJ · Súmula 191', 'usar em: passo 10 · inciso II (pronúncia)'),
                        (64, 'STF · ADC 43, 44 e 54', 'usar em: passo 8.2 · Duelo B')]) + '</div>'

# ============================================================ QUESTÃO 02 (o PDF termina no meio da frase — avise)
q2 = ''.join(f'<div class="sub"><span class="sn">{k}</span><span class="stext">{esc(t)}</span></div>' for k, t in enumerate(
    ['as modalidades típicas previstas', 'a natureza do sujeito ativo em cada figura', 'a chamada tortura-omissão',
     'as causas de aumento e os resultados qualificadores', 'os efeitos automáticos da condenação', 'o regime de execução da pena'], 1))

# ============================================================ MONTAGEM
corpo = f"""
<header class="mast"><div class="kicker">Leitura estratégica · Curso de Prova Oral · Polícia Civil do Piauí</div>
<h1>{seg(0)}</h1><h2>{seg(1)}</h2></header>
<section class="panel">
 <div class="pcol"><div class="ptitle">Suas marcações, mantidas</div>{legenda(IGN)}
  <p class="pnote">Cada grifo continua exatamente no mesmo trecho e na mesma cor. Os traços feitos à mão viraram marca-texto da cor do traço;
  o <s class="x">X</s> sobre a palavra indica o que você riscou.</p></div>
 <div class="pcol"><div class="ptitle">Como ler em 3 passadas</div><ol class="how">
  <li><b>Trilha (1 min)</b> — percorra os 12 passos abaixo em ordem.</li>
  <li><b>Só os grifos</b> — leia apenas o que está marcado; os grifos são suas âncoras de fala.</li>
  <li><b>Texto completo</b> — fale cada passo inteiro, na ordem numerada.</li></ol></div>
</section>
{titulo('A pergunta do examinador')}{pergunta('', seg(3), grande=True)}
<div class="qmap">
 <div class="qm"><span class="num s">a</span><span class="stext">{seg(3, 'sua natureza jurídica', '(b)')}</span></div>
 <div class="qm"><span class="num s">b</span><span class="stext">{seg(3, 'a distinção entre', 'e (c)')}</span></div>
 <div class="qm"><span class="num s">c</span><span class="stext">{seg(3, 'os marcos interruptivos')}</span></div></div>
{titulo('Trilha da resposta · 12 passos')}
{trilha([('(a)', 'Natureza e fundamento', [(1, 'Conceito'), (2, 'Fundamento'), (3, 'Regime')]),
         ('(b)', 'PPP × PPE e espécies', [(4, '2 categorias'), (5, 'PPP'), (6, '3 subespécies'), (7, 'PPE'), (8, 'Termo inicial'), (9, 'Tema 788')]),
         ('(c)', 'Marcos', [(10, 'Interruptivas'), (11, 'Efeitos'), (12, 'Suspensivas')])])}
{titulo('Sugestão de resposta oral — fale nesta ordem')}
{band('(a)', 'Natureza jurídica e fundamento', 'passos 1 a 3')}{s1}{s2}{s3}
{band('(b)', 'PPP × PPE e suas espécies', 'passos 4 a 9')}{s4}{s5}{s6}{s7}{s8}{s9}
{band('(c)', 'Marcos interruptivos e suspensivos', 'passos 10 a 12')}{s10}{s11}{s12}
{titulo('Diferenças entre os institutos')}
<p class="lede">Leia cada duelo linha a linha: a numeração à esquerda é a ordem para argumentar o contraste.</p>
{duelo_a}{duelo_b}{duelo_c}
{titulo('Quadro das 4 espécies de prescrição')}
<p class="lede">Ordem de recitação por linha: <b>1</b> base de cálculo → <b>2</b> termo inicial → <b>3</b> efeitos.</p>{tabela}
{titulo('Roteiro de possíveis perguntas', quebra=True)}{p1}{p2}
{titulo('Aprofundamento')}{apro}
<p class="lede" style="margin-top:14px;break-after:avoid">{seg(28)}</p>{obs_i}{obs_ii}
{titulo('Jurisprudência')}{juris}
<div class="stitle pb nextq">{seg(65)}</div>
{pergunta('PERGUNTA DE PROVA ORAL', seg(67))}
<div class="q2list"><div class="lede">Partes que a pergunta exige, na ordem em que aparecem:</div>{q2}</div>
<div class="stitle sm">Sugestão de resposta oral <span class="trunc">· o arquivo enviado termina aqui, no meio da frase</span></div>
{step(1, 'Abertura (resposta ao examinador)', subs=[seg(69, 'Excelência,', 'o qual categoriza'),
      seg(69, 'o qual categoriza', 'respondendo por ele'), seg(69, 'respondendo por ele')], sid='q2a', alt=True)}
<footer class="src">Material-base: Pompeo Metodologia — Curso de Prova Oral, Polícia Civil do Piauí. Reorganizado para estudo pessoal, com o texto e as marcações originais preservados.</footer>
"""
open(saida, 'w').write(shell(corpo, 'Meta 22 Direito Penal'))
print('ok', dict(contar_grifos(IGN)))
