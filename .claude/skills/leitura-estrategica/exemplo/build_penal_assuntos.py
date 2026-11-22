"""EXEMPLO DE REFERÊNCIA (modo "assuntos separados") — Direito Penal: indulto, abolitio criminis, detração,
progressão de regime e crimes ambientais, a partir de "Direito Penal - RESPOSTAS - Completo (Metas 01 a 45)-1.pdf".

Recorte usado (págs. do PDF completo): 127,128,129,136,171,172,173,211,212,218,219,220,221,222,263,264,273,274,275,277,278,279,280
    python3 -I - <<'X'
    import pymupdf; d=pymupdf.open('penal_completo.pdf'); n=pymupdf.open()
    for p in [127,128,129,136,171,172,173,211,212,218,219,220,221,222,263,264,273,274,275,277,278,279,280]: n.insert_pdf(d,from_page=p-1,to_page=p-1)
    n.save('penal_sub.pdf')
    X
    python3 -I scripts/extrair.py penal_sub.pdf penal_sub.json
    python3 -I exemplo/build_penal_assuntos.py            # lê penal_sub.json, escreve penal_oral.html
    python3 -I scripts/verificar.py penal_sub.json penal_oral.html --inverso --viewport
Os índices de bloco (213, 266, M(…)) são DESTE recorte; em outro material, liste os blocos e ache os seus.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts'))
from engine import *
import engine
load('penal_sub.json')
M = merge_range
for _p in engine.P:                      # '*novatio legis in pejus*': resíduo de markdown na fonte, não faz parte do texto
    _p['chars'] = [c for c in _p['chars'] if c['c'] != '*']

def fonte(txt, pdf=''):
    return f'<div class="fonte"><b>Fonte</b> {esc(txt)}' + (f' · <span>{esc(pdf)}</span>' if pdf else '') + '</div>'

def gap(tag, corpo, itens=()):
    lis = ''.join(f'<li>{i}</li>' for i in itens)
    return f'<div class="gap"><span class="gtag">{esc(tag)}</span>{corpo}' + (f'<ul>{lis}</ul>' if lis else '') + '</div>'

def QA(n_pergunta, pergunta_html, passos, sid):
    """Pergunta do examinador + resposta em passos numerados (círculo vazado)."""
    out = pergunta(f'PERGUNTA · {n_pergunta}', pergunta_html) + rtag()
    for k, (rot, corpo, subs) in enumerate(passos, 1):
        out += step(k, rot, corpo, subs=subs, sid=f'{sid}{k}', alt=True)
    return out

# ============================================================ 1. INDULTO
H = M(213, 266)                       # Meta 36 Q1 — sugestão de resposta oral (hediondos)
cons = QA('Meta 36 · Roteiro, pergunta 2', seg(275 and M(275, 275)) .replace('PERGUNTA 2: ', ''), [
    ('Posição', seg(M(276, 280), 'Excelência, não.', 'A Constituição'), None),
    ('Fundamento constitucional', seg(M(276, 280), 'A Constituição Federal de 1988, art. 5º, XLIII,', 'e a Lei nº 8.072/1990'), None),
    ('Reforço legal', seg(M(276, 280), 'e a Lei nº 8.072/1990', 'dispositivo cuja'), None),
    ('Como o STF entende o indulto', seg(M(276, 280), 'dispositivo cuja'), None),
], 'ind')
conseq = step(1, 'Consequências da hediondez — a lista que o examinador espera ouvir',
              seg(H, 'As consequências jurídicas da hediondez são:', 'inafiançabilidade;'),
              subs=[seg(H, 'inafiançabilidade;', 'vedação de graça'),
                    seg(H, 'vedação de graça, indulto e anistia;', 'prazos diferenciados'),
                    seg(H, 'prazos diferenciados', 'prisão temporária'),
                    seg(H, 'prisão temporária', 'e, ainda,'),
                    seg(H, 'e, ainda,', 'Em matéria de regime inicial')], sid='cons', alt=True)
L = M(400, 404)
lei15358 = QA('Meta 42 · Roteiro, pergunta 2', seg(M(399, 399), 'Os crimes criados'), [
    ('Posição', seg(L, 'Excelência, sim.', 'O art. 4º'), None),
    ('O que o art. 4º declara e veda', seg(L, 'O art. 4º', '— regime que'), None),
    ('Reflexo na progressão', seg(L, '— regime que'), None),
], 'l358')
indulto = (band('1', 'INDULTO', 'vedado aos hediondos e equiparados') +
           fonte('Meta 36 · Questão 1 (roteiro, pergunta 2 e fala de abertura) · Meta 42 · Questão 1', 'PDF completo p.218–220 e p.263–264') +
           cons + conseq + lei15358 +
           gap('O QUE O SEU MATERIAL NÃO TRAZ SOBRE INDULTO',
               'Só aparece a <b>vedação</b>. Não há conceito, diferença entre anistia, graça, indulto e comutação, nem quem concede. '
               'No seu Drive: <i>D_Indulto e comutação de pena.pdf</i>, <i>ANISTIA, GRAÇA E INDULTO.pdf</i> e o roteiro do Márcio Friggi, aula 22 (extinção da punibilidade). '
               'Posso montar essa parte a partir deles, separada deste texto.'))

# ============================================================ 2. ABOLITIO CRIMINIS
R = 14    # Meta 23 — resposta (bloco único)
abol_arm = QA('Meta 23 · Roteiro, pergunta 1', seg(13, 'O porte de arma'), [
    ('1ª parte — o crime do porte com numeração raspada', seg(R, 'Excelência, o porte', 'A razão é'), None),
    ('Por que é mais grave', seg(R, 'A razão é', 'Quanto à abolitio'), None),
    ('2ª parte — o que é a abolitio criminis temporária', seg(R, 'Quanto à abolitio', 'Os Tribunais Superiores'), None),
    ('Alcance', seg(R, 'Os Tribunais Superiores', 'A Súmula 513'), None),
    ('Súmula 513/STJ', seg(R, 'A Súmula 513'), None),
], 'ab')
Lc = M(490, 494)
abol_lic = QA('Meta 43 · Roteiro, pergunta 2', seg(M(487, 488), 'A transferência'), [
    ('Posição', seg(Lc, 'Excelência, não.', 'Houve continuidade'), None),
    ('Por quê: continuidade normativo-típica', seg(Lc, 'Houve continuidade', 'Como as penas'), None),
    ('Consequência: lei nova mais grave', seg(Lc, 'Como as penas', 'aplicando-se'), None),
    ('Efeito no tempo', seg(Lc, 'aplicando-se'), None),
], 'lic')
D28 = M(347, 364)     # Meta 36 Q2 — art. 28
duelo_ab = duel('Duelo A · Abolitio criminis temporária × Continuidade normativo-típica', 'Abolitio criminis temporária<small>Estatuto do Desarmamento</small>',
                'Continuidade normativo-típica<small>Lei 8.666 → Código Penal</small>', [
    ('O que houve', seg(R, 'Quanto à abolitio', 'Os Tribunais Superiores'), seg(Lc, 'Houve continuidade', 'Como as penas')),
    ('Alcance / efeito no tempo', cat(seg(R, 'Os Tribunais Superiores', 'A Súmula 513'), seg(R, 'A Súmula 513')),
     cat(seg(Lc, 'Como as penas', 'aplicando-se'), seg(Lc, 'aplicando-se')))])
duelo_28 = duel('Duelo B · Descriminalização × Despenalização — art. 28 da Lei de Drogas', 'Descriminalização<small>a conduta deixa de ser crime</small>',
                'Despenalização<small>continua crime, sem pena de prisão</small>', [
    ('A tese', seg(D28, 'a) tese da descriminalização', 'b) tese da despenalização'), seg(D28, 'b) tese da despenalização', 'c) tese da infração')),
    ('Evolução no STF', seg(D28, 'Esse quadro', None),
     seg(D28, 'Prevaleceu, inicialmente', 'Esse quadro'))])
abolitio = (band('2', 'ABOLITIO CRIMINIS', 'temporária · continuidade normativo-típica · art. 28') +
            fonte('Meta 23 · Questão 1 · Meta 43 · Questão 2 · Meta 36 · Questão 2', 'PDF completo p.128, p.273–275 e p.222–224') +
            abol_arm + abol_lic + duelo_ab + duelo_28 +
            gap('O QUE O SEU MATERIAL NÃO TRAZ SOBRE ABOLITIO CRIMINIS',
                'Não há uma questão própria: o instituto aparece só nestes três contextos (arma, licitações e art. 28). '
                'Não há conceito geral, efeitos (art. 2º do CP, retroatividade, coisa julgada) nem a distinção da <i>novatio legis</i> in melius. '
                'No Drive: pasta <i>Abolitio criminis</i> (slides e transcrição) e o roteiro do Márcio Friggi, aula 22.'))

# ============================================================ 3. DETRAÇÃO
Dm = M(153, 189)      # Meta 35 Q1 — sugestão
Lv = M(531, 589)      # Meta 44 Q1 — sugestão
detracao = (band('3', 'DETRAÇÃO PENAL', 'só aparece de passagem') +
            fonte('Meta 35 · Questão 1 · Meta 44 · Questão 1', 'PDF completo p.212 e p.278') +
            step(1, 'Art. 8º do CP — pena cumprida no estrangeiro', seg(Dm, 'Nessas hipóteses', 'no exterior.', incl_b=True),
                 extra='<div class="xnote">Contexto: extraterritorialidade <b>incondicionada</b> (CP, art. 7º, I).</div>', sid='det1', alt=True) +
            step(2, 'Art. 88 do CP — livramento condicional revogado',
                 subs=[seg(Lv, 'No livramento condicional, se a revogação', 'contudo,'),
                       seg(Lv, 'contudo,', 'saldo devedor.', incl_b=True)], sid='det2', alt=True) +
            gap('O QUE O SEU MATERIAL NÃO TRAZ SOBRE DETRAÇÃO',
                'Não há questão de detração: nem o conceito, nem o desconto da pena (CP, art. 42), nem as hipóteses (prisão provisória, internação). '
                'Os dois trechos acima são tudo o que existe, e só tratam de dois efeitos específicos. '
                'No Drive: <i>DIREITO PENAL - DETRAÇÃO.pdf</i> e a videoaula <i>07 - Detração</i>.'))

# ============================================================ 4. PROGRESSÃO DE REGIME
def passo(rot, a, b, subs=None, **kw):
    return (rot, seg(H, a, b, **kw), subs)
cab358 = seg(H, 'A Lei nº 15.358/2026 elevou', 'setenta por cento para o condenado primário')
cab402 = seg(H, 'Complementarmente,', 'um sexto')
prog = (step(1, 'STF — o fim da vedação absoluta', subs=[
            seg(H, 'O STF declarou', 'e, posteriormente,'), seg(H, 'e, posteriormente,', 'Quanto à progressão')], sid='pr1', alt=True) +
        step(2, 'Pacote Anticrime — o art. 112 da LEP', seg(H, 'Quanto à progressão', 'Esse quadro, contudo,'), sid='pr2', alt=True) +
        step(3, 'Lei 15.358/2026 — hediondos e equiparados', cab358, subs=[
            seg(H, 'setenta por cento para o condenado primário', 'setenta e cinco'),
            seg(H, 'setenta e cinco', 'oitenta por cento'),
            seg(H, 'oitenta por cento', 'e oitenta e cinco'),
            seg(H, 'e oitenta e cinco', 'Complementarmente')], sid='pr3', alt=True) +
        step(4, 'Lei 15.402/2026 — Lei da Dosimetria', cab402, subs=[
            seg(H, 'um sexto', 'vinte e cinco por cento'),
            seg(H, 'vinte e cinco por cento', 'e vinte por cento'),
            seg(H, 'e vinte por cento', 'Registre-se')], sid='pr4', alt=True) +
        step(5, 'Atenção: eficácia parcialmente suspensa', seg(H, 'Registre-se que a eficácia', 'Em todos os casos'), sid='pr5', alt=True) +
        step(6, 'Requisitos', subs=[seg(H, 'Em todos os casos', 'dispensado'), seg(H, 'dispensado', 'Por fim,')], sid='pr6', alt=True) +
        step(7, 'Direito intertemporal', subs=[seg(H, 'Por fim,', 'ao passo que'), seg(H, 'ao passo que')], sid='pr7', alt=True))
rows = [(M(314, 315), '1/6'), (M(316, 318), '25%'), (M(319, 321), '30%'), (M(322, 324), '20%'), (M(325, 326), '70%'),
        (M(327, 331), '75%'), (M(332, 333), '80%'), (M(334, 338), '85%')]
tr = ''
for m, fr in rows:
    tr += (f'<tr><th class="rowh">{seg(m, None, fr)}</th><td><b>{seg(m, fr, "LEP")}</b></td><td>{seg(m, "LEP")}</td></tr>')
quadro = ('<table class="spec"><thead><tr><th><span class="num s">1</span>Situação do apenado</th><th><span class="num s">2</span>Fração</th>'
          '<th><span class="num s">3</span>Fundamento</th></tr></thead><tbody>' + tr + '</tbody></table>')
A = M(282, 311)
critica = step(8, 'Crítica doutrinária (aprofundamento)', seg(A, 'A elevação das frações', 'vigência da norma.', incl_b=True), sid='pr8', alt=True)
J = 341; J2 = 652
juris_prog = ('<div class="jgrid">' + ''.join(
    f'<div class="jcard"><div class="jtag">{tag}</div><p class="stext">{texto}</p><div class="jmeta"><span>{esc(cit)}</span><em>{uso}</em></div></div>' for tag, texto, cit, uso in [
        ('STF · HC 82.959/SP', seg(J, None, '(STF, HC 82.959'), '(STF, HC 82.959/SP, Rel. Min. Marco Aurélio, Plenário, julgado em 23/02/2006)', 'usar em: passo 1'),
        ('STJ · Súmulas 534 e 441', seg(J2, 'A prática de falta grave', '(STJ, Súmulas'), '(STJ, Súmulas 534 e 441)', 'falta grave: interrompe o prazo da progressão, não o do livramento'),
    ]) + '</div>')
progressao = (band('4', 'PROGRESSÃO DE REGIME', 'frações do art. 112 da LEP após 2026') +
              fonte('Meta 36 · Questão 1 (fala de abertura, tabela e jurisprudência) · Meta 44 · Questão 1', 'PDF completo p.219–222 e p.280') +
              pergunta('PERGUNTA DE PROVA ORAL · Meta 36', seg(211, 'Candidato,')) + rtag('Fala de abertura · ordem de argumentação') + prog +
              titulo('Quadro das frações', pequeno=True) + '<p class="lede">Ordem de recitação por linha: <b>1</b> situação → <b>2</b> fração → <b>3</b> fundamento.</p>' + quadro +
              critica + juris_prog)

# ============================================================ 5. AGRAVANTES EM CRIMES AMBIENTAIS
Sa = M(65, 90)
amb = (band('5', 'CRIMES AMBIENTAIS', 'agravantes: ausente · responsabilidade da pessoa jurídica: presente') +
       fonte('Meta 30 · Questão 1', 'PDF completo p.171–173') +
       gap('AGRAVANTES DOS CRIMES AMBIENTAIS: NÃO ESTÃO NO SEU MATERIAL',
           'A única questão ambiental das Metas trata da <b>responsabilidade penal da pessoa jurídica</b>. Não há uma linha sobre agravantes (e, por consequência, nem atenuantes) dos crimes ambientais. '
           'O ponto de partida é a Lei 9.605/1998 (a Seção das circunstâncias que agravam a pena — referência minha, fora do material). '
           'Posso montar este tema a partir da lei e de material de aula do seu Drive, deixando claro o que é do seu material e o que é complemento.') +
       titulo('O que há de ambiental: responsabilidade penal da pessoa jurídica', pequeno=True) +
       pergunta('PERGUNTA DE PROVA ORAL · Meta 30', seg(63, 'Candidato,')) + rtag('Fala de abertura · ordem de argumentação') +
       step(1, 'Fundamento constitucional', seg(Sa, 'Excelência,', 'No plano infraconstitucional'), sid='am1', alt=True) +
       step(2, 'Requisitos cumulativos — art. 3º da Lei 9.605/1998', seg(Sa, 'No plano infraconstitucional', '1. A infração'), subs=[
            ('1', seg(Sa, 'A infração penal ambiental', '2. O crime')), ('2', seg(Sa, 'O crime deve', 'No que tange'))], sid='am2', alt=True) +
       step(3, 'Teoria da dupla imputação — superada', subs=[seg(Sa, 'No que tange', 'Contudo,'), seg(Sa, 'Contudo,', 'A autonomia'), seg(Sa, 'A autonomia', 'Quanto às penas')], sid='am3', alt=True) +
       step(4, 'Penas aplicáveis à pessoa jurídica — art. 21', seg(Sa, 'Quanto às penas', 'I - multa'), subs=[
            ('I', seg(Sa, 'I - ', 'II - penas', skip_a=True)), ('II', seg(Sa, 'II - ', 'III - liquidação', skip_a=True)), ('III', seg(Sa, 'III - ', None, skip_a=True))], sid='am4', alt=True))

amb += (QA('Meta 30 · Roteiro, pergunta 1', seg(M(92, 94), 'Para a persecução'), [
            ('Posição', seg(M(95, 97), 'Excelência, não.', 'O STF e o STJ'), None),
            ('Fundamento', seg(M(95, 97), 'O STF e o STJ'), None)], 'amp1') +
        QA('Meta 30 · Roteiro, pergunta 2', seg(M(98, 99), 'Quais são'), [
            ('Resposta', seg(M(100, 103), 'Excelência, conforme'), None)], 'amp2') +
        '<div class="jgrid">' + ''.join(
            f'<div class="jcard"><div class="jtag">{tag}</div><p class="stext">{seg(i, None, "(ST")}</p><div class="jmeta"><span>{esc(text_of(i)[text_of(i).find("(ST"):])}</span><em>{uso}</em></div></div>'
            for i, tag, uso in [(130, 'STF · RE 548.181/PR', 'usar em: dupla imputação (passo 3)'), (131, 'STJ · REsp 1.977.172/PR', 'extinção da pessoa jurídica: intranscendência da pena')]) + '</div>')

# ============================================================ MONTAGEM
cov = [
    ('Indulto', '●●○ boa', 'Meta 36 Q1/Q2 · Meta 42 Q1', 'só a vedação nos hediondos; sem conceito nem comutação'),
    ('Abolitio criminis', '●○○ parcial', 'Meta 23 Q1 · Meta 43 Q2 · Meta 36 Q2', 'três contextos (arma, licitações, art. 28); sem teoria geral'),
    ('Detração', '●○○ mínima', 'Meta 35 Q1 · Meta 44 Q1', 'duas frases (arts. 8º e 88 do CP); sem questão própria'),
    ('Progressão de regime', '●●● forte', 'Meta 36 Q1 · Meta 44 Q1', 'frações das Leis 15.358 e 15.402/2026, tabela e súmulas'),
    ('Agravantes em crimes ambientais', '○○○ ausente', 'Meta 30 Q1 (só pessoa jurídica)', 'nada sobre agravantes'),
]
covt = ('<table class="cov"><thead><tr><th>Tema</th><th>Cobertura</th><th>Onde (Metas)</th><th>O que há</th></tr></thead><tbody>' +
        ''.join(f'<tr><td class="t">{a}</td><td class="lvl">{b}</td><td>{c}</td><td>{d}</td></tr>' for a, b, c, d in cov) + '</tbody></table>')
corpo = f"""
<header class="mast"><div class="kicker">Assuntos separados · Direito Penal · Oral PCPI · leitura estratégica</div>
<h1>Indulto, abolitio criminis, detração, progressão de regime e crimes ambientais</h1>
<h2>Compilado do seu "Direito Penal — RESPOSTAS — Completo (Metas 01 a 45)", só com o texto das Metas, reorganizado em passos numerados.</h2></header>
<section class="panel wide">
 <div class="pcol"><div class="ptitle">Onde cada tema está no seu material</div>{covt}</div>
 <div class="pcol"><div class="ptitle">Leia isto primeiro</div>
  <p class="pnote" style="margin:0 0 6px"><b>Sem grifos seus:</b> nenhuma destas páginas tem marcação sua no PDF (os grifos estão só nas Metas de receptação, estado de necessidade e prescrição). Por isso aqui não há cores de marca-texto.</p>
  <p class="pnote" style="margin:0 0 6px"><b>Fidelidade:</b> todo o texto é copiado das Metas; os rótulos dos passos são só navegação.</p>
  <p class="pnote" style="margin:0">Quadros pontilhados apontam o que <b>falta</b> no material.</p></div>
</section>
{indulto}
{abolitio}
{detracao}
{progressao}
{amb}
<footer class="src">Material-base: Pompeo Metodologia — Curso de Prova Oral, Polícia Civil do Piauí (PDF "Direito Penal — RESPOSTAS — Completo (Metas 01 a 45)"). Reorganizado para estudo pessoal.</footer>
"""
open('penal_oral.html', 'w').write(shell(corpo, 'Direito Penal Assuntos separados'))
print('ok')
