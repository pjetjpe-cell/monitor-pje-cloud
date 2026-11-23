import sys
sys.path.insert(0, '/home/user/monitor-pje-cloud/.claude/skills/leitura-estrategica/scripts')
from engine import *
load('henry_m.json')
M = merge_range
def QA(rot, perg, passos, sid):
    out = pergunta(f'PERGUNTA · {rot}', perg) + rtag()
    for k, (r, c) in enumerate(passos, 1):
        out += step(k, r, c, sid=f'{sid}{k}', alt=True)
    return out

# quadro da p.3: o PDF junta linhas diferentes no mesmo bloco -> recorta por coluna (x) E por linha (y)
TAB = list(range(23, 48))
COLS = [(85, 168), (168, 240), (240, 398), (398, 600)]
ROWS = [(300, 337), (337, 377), (377, 405), (405, 435), (435, 490)]
def cel(r, c): return seg(celula(TAB, *COLS[c], *ROWS[r]))
def tabela():
    h = '<table class="spec"><thead><tr>' + ''.join(
        (f'<th><span class="num s">{k}</span>{cel(0, k)}</th>' if k else f'<th>{cel(0, k)}</th>') for k in range(4)) + '</tr></thead><tbody>'
    for r in range(1, 5):
        h += '<tr><th class="rowh">' + cel(r, 0) + '</th>' + ''.join(f'<td>{cel(r, k)}</td>' for k in range(1, 4)) + '</tr>'
    return h + '</tbody></table>'

Q = 3
hw = mnemonico('20 a 50', imagem_b64('imgs_henry_m/manuscrito_p2_1.png', 420),
               'Sua anotação à mão, logo abaixo do "12 a 30 anos ... podendo ser significativamente majorada": a pena do homicídio qualificado com o aumento de <b>2/3</b> do § 7º.')

a = (band('(a)', 'A lei e a capitulação atual', 'passos 1 a 3') +
     step(1, 'A Lei Henry Borel (Lei 14.344/2022)', seg(5, 'Excelência,')) +
     step(2, 'Capitulação: art. 121, § 2º, IX, do CP', seg(6, 'Atualmente,', 'Trata-se')) +
     step(3, 'Natureza: qualificadora OBJETIVA', seg(6, 'Trata-se')))
b = (band('(b)', 'Hediondez', 'passos 4 e 5') +
     step(4, 'Crime hediondo (Lei 8.072/90, art. 1º, I)', seg(7, 'A principal', 'Em razão')) +
     step(5, 'Consequências do tratamento mais severo', seg(7, 'Em razão', 'inafiançabilidade'), subs=[
         seg(7, 'inafiançabilidade', 'por critérios'), seg(7, 'por critérios', 'e por requisitos'), seg(7, 'e por requisitos')]))
c = (band('(c)', 'Direito intertemporal', 'passos 6 a 8') +
     step(6, 'Lex gravior: irretroatividade (CF, art. 5º, XL)', seg(8, 'Sob a perspectiva', 'Assim,')) +
     step(7, 'Só fatos a partir de 24/05/2022', seg(8, 'Assim,', 'Antes dessa')) +
     step(8, 'Antes: causa de aumento do antigo § 4º', seg(8, 'Antes dessa')))
d = (band('(d)', 'Causas de aumento — art. 121, § 7º', 'passo 9') +
     step(9, 'As três majorantes', seg(10, 'Além da', 'A pena será'), subs=[
         seg(10, 'A pena será', 'O aumento será'), seg(10, 'O aumento será'), seg(11, 'Também')]))
e = (band('(e)', 'Fechamento', 'passos 10 e 11') +
     step(10, 'Síntese: o que responde quem mata um adolescente de 13 anos', seg(12, 'Portanto,'), extra=hw) +
     step(11, 'Atenção: MENOR de 14 (não inclui 14 completos)', seg(13, 'IMPORTANTE!')))

duelo_tempo = duel('Duelo A · Antes × depois da Lei Henry Borel', 'Antes<small>até 23/05/2022</small>', 'Depois<small>a partir de 24/05/2022</small>', [
    ('Enquadramento', seg(8, 'Antes dessa'), seg(6, 'Atualmente,', 'Trata-se')),
    ('Pena abstrata', seg(21, 'No plano penal', 'para 12 anos'), seg(21, 'para 12 anos'))])
duelo_qa = duel('Duelo B · Qualificadora (§ 2º, IX) × causas de aumento (§ 7º)', 'Qualificadora<small>art. 121, § 2º, IX</small>', 'Causas de aumento<small>art. 121, § 7º</small>', [
    ('O que pune', seg(22, 'pois a qualificadora', 'enquanto'), seg(22, 'enquanto')),
    ('Natureza (quadro)', cel(1, 1), cel(2, 1)),
    ('Efeito na pena (quadro)', cel(1, 3), cel(2, 3) + '<br>' + cel(3, 3) + '<br>' + cel(4, 3))],
    nota='Cumulam-se: ' + seg(22, 'As causas de aumento', 'pois a qualificadora'))
duelo_rot = duel('Duelo C · Erro sobre a idade × privilégio (as duas perguntas do examinador)', 'Erro sobre a idade<small>Pergunta 1</small>', 'Privilégio (§ 1º)<small>Pergunta 2</small>', [
    ('Resultado', seg(16, 'afasta-se a qualificadora', 'O dolo'), seg(18, 'Excelência, sim.', 'Como a')),
    ('Por quê', seg(16, 'O dolo'), seg(18, 'Como a', 'Nesta hipótese'))])

rot = (QA('Roteiro 1', seg(15, 'Se o autor'), [
           ('Posição: erro de tipo afasta a qualificadora', seg(16, 'Excelência,', 'O dolo')),
           ('Fundamento: o dolo deve abranger a idade', seg(16, 'O dolo'))], 'r1') +
       QA('Roteiro 2', seg(17, 'O crime'), [
           ('Posição: sim, qualificado-privilegiado', seg(18, 'Excelência, sim.', 'Como a')),
           ('Por quê: qualificadora objetiva + privilégio subjetivo', seg(18, 'Como a', 'Nesta hipótese')),
           ('Consequência: afasta a hediondez', seg(18, 'Nesta hipótese'))], 'r2'))
apro = caixa('LEIA DE A → C', [seg(21, 'A Lei Henry', 'No plano penal'), seg(21, 'No plano penal'), seg(22, 'As causas')])

parte = (f'<div class="parte" style="break-before:auto">{seg(1)}<small>Meta 18 · Questão 1 · PDF completo p.98–100</small></div>' +
         pergunta('PERGUNTA DE PROVA ORAL', seg(Q, 'Candidato,'), grande=True) +
         '<p class="lede">Os 5 pontos que a pergunta cobra (você sublinhou cada um em vermelho):</p>' +
         '<div class="qmap">' + ''.join(f'<div class="qm"><span class="num s">{l}</span><span class="stext">{t}</span></div>' for l, t in [
             ('a', seg(Q, 'a capitulação', ', a natureza')), ('b', seg(Q, 'a natureza', ', a classificação')),
             ('c', seg(Q, 'a classificação', ', as regras')), ('d', seg(Q, 'as regras', 'e as causas')),
             ('e', seg(Q, 'as causas de aumento'))]) + '</div>' +
         titulo('Trilha da resposta · 11 passos', pequeno=True) +
         trilha([('(a)', 'Lei e capitulação', [(1, 'Lei 14.344'), (2, '§ 2º, IX'), (3, 'Objetiva')]),
                 ('(b)', 'Hediondez', [(4, 'Hediondo'), (5, 'Consequências')]),
                 ('(c)', 'Intertemporal', [(6, 'Lex gravior'), (7, '24/05/2022'), (8, 'Antigo § 4º')]),
                 ('(d)', 'Aumento', [(9, '§ 7º: 1/3–1/2 · 2/3 · 2/3')]),
                 ('(e)', 'Fechamento', [(10, 'Síntese · 20 a 50'), (11, 'MENOR de 14')])]) +
         titulo('Sugestão de resposta oral — fale nesta ordem') + a + b + c + d + e +
         titulo('Diferenças entre os institutos') + duelo_tempo + duelo_qa + duelo_rot +
         titulo('Quadro do material', pequeno=True) + '<p class="lede">Ordem de recitação: <b>1</b> natureza → <b>2</b> circunstância → <b>3</b> fração / pena.</p>' + tabela() +
         titulo('Roteiro de possíveis perguntas') + rot + titulo('Aprofundamento') + apro)

IGN = [9, 19] + list(range(48, 88))
corpo = f"""
<header class="mast"><div class="kicker">Leitura estratégica · Direito Penal · Oral PCPI · recorte "LEI HENRY BOREL"</div>
<h1>Homicídio contra menor de 14 anos e a Lei Henry Borel</h1>
<h2>Meta 18, Questão 1, com as suas marcações, os sublinhados em vermelho da pergunta e a anotação "20 a 50" preservados.</h2></header>
<section class="panel"><div class="pcol"><div class="ptitle">Suas marcações, mantidas</div>{legenda(ignorar=IGN)}
<p class="pnote">Cada grifo continua no mesmo trecho e na mesma cor. Os sublinhados de caneta vermelha aparecem sublinhados em vermelho.</p></div>
<div class="pcol"><div class="ptitle">Como ler em 3 passadas</div><ol class="how"><li><b>Trilha</b> (1 min).</li><li><b>Só os grifos</b>: são suas âncoras de fala.</li><li><b>Texto completo</b>, na ordem numerada.</li></ol>
<p class="pnote">Cada letra (a)–(e) da trilha responde a um dos 5 pontos que você sublinhou na pergunta.</p></div></section>
{parte}
<footer class="src">Material-base: Pompeo Metodologia — Curso de Prova Oral, Polícia Civil do Piauí. A pág. 100 traz também o início da Questão 2 da Meta 18 (excesso nas excludentes), e a pág. 183 (Meta 31 Q2, maus-tratos × tortura) só cita a Lei Henry Borel de passagem; nenhuma das duas tem marcações suas, então não entraram aqui.</footer>
"""
open('henry.html', 'w').write(shell(corpo, 'Henry Borel leitura estratégica'))
print('ok')
