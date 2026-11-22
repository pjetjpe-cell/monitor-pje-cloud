"""EXEMPLO DE REFERÊNCIA (modo "assuntos separados") — Processo Penal: medidas cautelares (arts. 319, 320 e 350)
a partir de "Direito Processual Penal - RESPOSTAS - Completo (Metas 01 a 45).pdf".

Recorte usado (págs. do PDF completo): 81,82,88,89,197,198,199,200,201,234,235,236,237,238,287,288,289
(mesmo procedimento do exemplo do Penal; lê cpp_sub.json, escreve cpp_oral.html)
    python3 -I scripts/verificar.py cpp_sub.json cpp_oral.html --inverso --viewport
Os índices de bloco são DESTE recorte.
"""
import sys, os
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'scripts'))
from engine import *
import engine
load('cpp_sub.json')
M = merge_range

def fonte(txt, pdf=''):
    return f'<div class="fonte"><b>Fonte</b> {esc(txt)}' + (f' · <span>{esc(pdf)}</span>' if pdf else '') + '</div>'

def gap(tag, corpo):
    return f'<div class="gap"><span class="gtag">{esc(tag)}</span>{corpo}</div>'

def QA(rotulo, pergunta_html, passos, sid):
    out = pergunta(f'PERGUNTA · {rotulo}', pergunta_html) + rtag()
    for k, (rot, corpo, subs) in enumerate(passos, 1):
        out += step(k, rot, corpo, subs=subs, sid=f'{sid}{k}', alt=True)
    return out

def cards(itens):
    return '<div class="jgrid">' + ''.join(
        f'<div class="jcard"><div class="jtag">{tag}</div><p class="stext">{texto}</p><div class="jmeta"><span>{esc(cit)}</span><em>{uso}</em></div></div>'
        for tag, texto, cit, uso in itens) + '</div>'

Ap = M(299, 328)        # aprofundamento da Q de prisão domiciliar (princípios das cautelares)
D = M(235, 281)         # domiciliar substitutiva — sugestão
Rv = M(381, 431)        # revisão periódica — sugestão
Fi = M(68, 123)         # fiança — sugestão
Q3 = M(5, 9)            # liberdade provisória com cautelares — sugestão
Rs = M(47, 52)          # redes sociais — sugestão

# ============================================================ 1. PRINCÍPIOS E REGRAS GERAIS DAS CAUTELARES
gerais = (band('1', 'REGRAS GERAIS DAS CAUTELARES', 'art. 282 · de ofício · prazo · ultima ratio') +
          fonte('Meta (prisão domiciliar substitutiva) · Questão 4 · aprofundamento', 'PDF completo p.236–237') +
          step(1, 'Princípios', seg(Ap, 'As medidas cautelares pessoais regem-se', 'e devem observar'), sid='g1', alt=True) +
          step(2, 'Critérios do art. 282', seg(Ap, 'e devem observar', 'Com a Lei nº 13.964/2019'), sid='g2', alt=True) +
          step(3, 'Vedada a decretação de ofício', seg(Ap, 'Com a Lei nº 13.964/2019', 'Não há prazo máximo'), sid='g3', alt=True) +
          step(4, 'Prazo das cautelares diversas', seg(Ap, 'Não há prazo máximo', 'Atualização legislativa'), sid='g4', alt=True) +
          step(5, 'Descumprimento: preferir substituir ou cumular — a prisão é ultima ratio',
               seg(Ap, 'Merece registro que a substituição', 'monitoração eletrônica (CPP, art. 319, IX)', incl_b=True) + ' ' + seg(Ap, 'e que, descumpridas', None), sid='g5', alt=True) +
          step(6, 'Atualização: nova hipótese de preventiva (Lei 15.358/2026)', seg(Ap, 'Atualização legislativa indispensável', 'A mesma lei repercute'), sid='g6', alt=True))

# ============================================================ 2. ART. 319 / 320 — MEDIDAS DIVERSAS DA PRISÃO
redes = QA('Redes sociais como medida cautelar', seg(45, 'Candidato,'), [
    ('Tese', seg(Rs, 'Excelência,', 'Esse é o entendimento'), None),
    ('Precedente', seg(Rs, 'Esse é o entendimento', 'No caso concreto'), None),
    ('O caso concreto', seg(Rs, 'No caso concreto', 'O STJ não concordou'), None),
    ('Por que o STJ manteve a medida', seg(Rs, 'O STJ não concordou', 'Além disso'), None),
    ('Descumprimento anterior', seg(Rs, 'Além disso', 'Não se constata'), None),
    ('Sem excesso — e a exigência de fundamentação', seg(Rs, 'Não se constata'), None),
], 'rs')
rs_rot = (pergunta('PERGUNTA · Roteiro 1', seg(54, 'A proibição de uso')) + rtag() +
          step(1, 'Posição', seg(55, 'Excelência, não.', 'A medida cautelar deve'), sid='rr1', alt=True) +
          step(2, 'Requisitos da medida', seg(55, 'A medida cautelar deve'), sid='rr2', alt=True) +
          pergunta('PERGUNTA · Roteiro 2', seg(56, 'O descumprimento')) + rtag() +
          step(1, 'Posição', seg(57, 'Excelência, sim.', 'O CPP, art. 312'), sid='rr3', alt=True) +
          step(2, 'Base legal', seg(57, 'O CPP, art. 312', 'Se o investigado'), sid='rr4', alt=True) +
          step(3, 'Aplicação ao caso', seg(57, 'Se o investigado'), sid='rr5', alt=True))
art319 = (band('2', 'ART. 319 E ART. 320 — MEDIDAS DIVERSAS DA PRISÃO', 'o que o material traz: exemplos') +
          fonte('Meta (redes sociais) · Questão 4', 'PDF completo p.88–89') +
          gap('A LISTA DO ART. 319 E O ART. 320 NÃO ESTÃO NO SEU MATERIAL',
              'Não há questão que enumere os incisos do art. 319, nem questão sobre o art. 320. O que aparece, solto: <b>proibição de uso de redes sociais</b> (abaixo), '
              '<b>monitoração eletrônica</b> (art. 319, IX, cumulada com a domiciliar), <b>proibição de contato</b>, <b>retenção de passaporte</b>, '
              '<b>comparecimento periódico em juízo</b> e, no passo 4 das regras gerais, <b>proibição de ausentar-se do País</b> com apreensão de passaporte (matéria do art. 320). '
              'No seu Drive: <i>PROCESSUAL PENAL I - A19 - Medidas Cautelares Pessoais (Parte 2) - Roteiro.pdf</i> e o roteiro do Renato Brasileiro, aula 19. '
              'Posso montar a lista do 319 e o 320 a partir deles, separada deste texto.') +
          redes + rs_rot)

# ============================================================ 3. PRISÃO DOMICILIAR SUBSTITUTIVA (318, 318-A, 318-B)
dom = (band('3', 'PRISÃO DOMICILIAR SUBSTITUTIVA', 'arts. 318, 318-A e 318-B') +
       fonte('Meta (cautelares pessoais) · Questão 4', 'PDF completo p.234–238') +
       pergunta('PERGUNTA DE PROVA ORAL', seg(M(230, 233), 'Candidato,')) + rtag('Fala de abertura · ordem de argumentação') +
       step(1, 'Natureza da prisão domiciliar', seg(D, 'Excelência,', 'O art. 318 estabelece'), sid='d1', alt=True) +
       step(2, 'Art. 318 — hipóteses gerais', seg(D, 'O art. 318 estabelece', 'quando o agente for maior'), subs=[
             seg(D, 'quando o agente for maior', 'quando estiver extremamente'), seg(D, 'quando estiver extremamente', 'quando for imprescindível'),
             seg(D, 'quando for imprescindível', 'quando se tratar de gestante'), seg(D, 'quando se tratar de gestante', 'ou quando for mulher'),
             seg(D, 'ou quando for mulher', 'ou ainda homem'), seg(D, 'ou ainda homem', 'O parágrafo único')], sid='d2', alt=True) +
       step(3, 'Prova idônea', seg(D, 'O parágrafo único do dispositivo', 'O art. 318-A'), sid='d3', alt=True) +
       step(4, 'Art. 318-A — a regra se inverte', seg(D, 'O art. 318-A, por sua vez,', 'quando o crime tiver sido'), subs=[
             seg(D, 'quando o crime tiver sido', 'quando praticado contra'), seg(D, 'quando praticado contra', 'ou em outras hipóteses'),
             seg(D, 'ou em outras hipóteses', 'Trata-se, portanto')], sid='d4', alt=True) +
       step(5, 'Exigência, não faculdade', seg(D, 'Trata-se, portanto', 'Já o art. 318-B'), sid='d5', alt=True) +
       step(6, 'Art. 318-B — com monitoração eletrônica', seg(D, 'Já o art. 318-B', 'Quanto à segunda indagação'), sid='d6', alt=True) +
       step(7, 'Revisão do art. 316 e as cautelares diversas', seg(D, 'Quanto à segunda indagação', 'Esse foi o entendimento'), sid='d7', alt=True) +
       step(8, 'O que decidiu a Corte Especial do STJ', seg(D, 'Esse foi o entendimento', 'Vale registrar'), sid='d8', alt=True) +
       step(9, 'Mesmo na preventiva, o prazo não é peremptório', seg(D, 'Vale registrar', 'Registra-se, por fim'), sid='d9', alt=True) +
       step(10, 'Quem faz a revisão', seg(D, 'Registra-se, por fim'), sid='d10', alt=True) +
       duel('Duelo A · Art. 318 × Art. 318-A', 'Art. 318<small>faculdade do juiz</small>', 'Art. 318-A<small>regra: substituir</small>', [
            ('Natureza da substituição', seg(D, 'O art. 318 estabelece', 'O parágrafo único'), seg(D, 'Trata-se, portanto', 'Já o art. 318-B')),
            ('Condições', seg(D, 'O parágrafo único do dispositivo', 'O art. 318-A'), seg(D, 'O art. 318-A, por sua vez,', 'Trata-se, portanto'))]) +
       QA('Roteiro 1', seg(M(283, 284), 'A reiteração'), [
            ('Posição', seg(M(285, 290), 'Excelência, não, por si só.', 'O STJ firmou'), None),
            ('Jurisprudência', seg(M(285, 290), 'O STJ firmou', 'As exceções legais'), None),
            ('As exceções legais', seg(M(285, 290), 'As exceções legais'), None)], 'dq1') +
       QA('Roteiro 2', seg(M(291, 292), 'A revisão a cada'), [
            ('Posição', seg(M(293, 297), 'Excelência, não.', 'Segundo o STJ'), None),
            ('Fundamento', seg(M(293, 297), 'Segundo o STJ'), None)], 'dq2'))
J365 = M(363, 365)
dom += cards([
    ('STJ · AgRg no HC 910.688/MG', seg(J365, 'A reiteração delitiva', '(STJ, AgRg no HC'), '(STJ, AgRg no HC 910.688/MG, Rel. Min. Ribeiro Dantas, Quinta Turma, julgado em 24/06/2024)', 'usar em: Roteiro 1'),
    ('STJ · Corte Especial · AgRg na Pet 16.308/DF', seg(J365, 'A revisão periódica prevista', '(STJ, Corte Especial'), '(STJ, Corte Especial, AgRg na Pet 16.308/DF, Rel. Min. Og Fernandes, julgado em 12/08/2025)', 'usar em: passos 7–8'),
    ('STF · HC 143.641/SP', seg(J365, 'É cabível o habeas corpus coletivo', '(STF, HC 143.641'), '(STF, HC 143.641/SP, Rel. Min. Ricardo Lewandowski, Segunda Turma, julgado em 20/02/2018)', 'usar em: art. 318-A'),
])

# ============================================================ 4. REVISÃO PERIÓDICA — ART. 316, P.U.
revisao = (band('4', 'REVISÃO PERIÓDICA DA PREVENTIVA', 'art. 316, parágrafo único · 90 dias') +
           fonte('Meta (reavaliação periódica) · Questão 4', 'PDF completo p.287–289') +
           pergunta('PERGUNTA DE PROVA ORAL', seg(M(374, 379), 'Candidato,')) + rtag('Fala de abertura · ordem de argumentação') +
           step(1, 'O dever e a origem', seg(Rv, 'Excelência,', 'A finalidade da norma'), sid='v1', alt=True) +
           step(2, 'Finalidade', seg(Rv, 'A finalidade da norma', 'A principal controvérsia'), sid='v2', alt=True) +
           step(3, 'Descumprimento do prazo: não há soltura automática (ADIs 6.581 e 6.582)', seg(Rv, 'A principal controvérsia', 'Assim, ultrapassado'), sid='v3', alt=True) +
           step(4, 'O que se exige do órgão competente', seg(Rv, 'Assim, ultrapassado', 'No que se refere à competência'), sid='v4', alt=True) +
           step(5, 'Quem deve revisar', seg(Rv, 'No que se refere à competência', 'Outro ponto relevante'), sid='v5', alt=True) +
           step(6, 'Até quando incide', seg(Rv, 'Outro ponto relevante', 'O STF definiu que'), subs=[
                 seg(Rv, 'O STF definiu que', 'Após a prolação'), seg(Rv, 'Após a prolação', 'O fundamento adotado'), seg(Rv, 'O fundamento adotado', 'Por fim, quanto à aplicação')], sid='v6', alt=True) +
           step(7, 'Medidas cautelares diversas do art. 319', seg(Rv, 'Por fim, quanto à aplicação', 'Portanto,'), sid='v7', alt=True) +
           step(8, 'Síntese final — o que o STF consolidou', seg(Rv, 'Portanto,', 'constitui um dever funcional'), subs=[
                 seg(Rv, 'constitui um dever funcional', 'deve ocorrer'), seg(Rv, 'deve ocorrer', 'aplica-se até'),
                 seg(Rv, 'aplica-se até', 'e seu descumprimento'), seg(Rv, 'e seu descumprimento')], sid='v8', alt=True) +
           duel('Duelo B · Prisão preventiva × Medidas cautelares diversas (art. 319)', 'Prisão preventiva', 'Medidas cautelares diversas<small>art. 319</small>', [
                ('Revisão a cada 90 dias', seg(D, 'segundo o qual', 'cumpre esclarecer'), seg(D, 'esse dever não se estende', 'Esse foi o entendimento')),
                ('Quem aciona', seg(Rv, 'impondo ao magistrado', 'se permanecem'), seg(D, 'depende de provocação', 'Vale registrar')),
                ('Se o prazo passa / duração', seg(D, 'o prazo de noventa dias não é peremptório', 'Registra-se, por fim'), seg(Ap, 'Não há prazo máximo', 'Atualização legislativa'))]) +
           QA('Roteiro 1', seg(M(433, 435), 'Se o juiz'), [
                ('Posição', seg(M(436, 439), 'Excelência, a análise', 'Conforme o enunciado'), None),
                ('Súmula 64/STJ', seg(M(436, 439), 'Conforme o enunciado'), None)], 'vq1') +
           QA('Roteiro 2', seg(M(440, 441), 'O Ministério Público'), [
                ('Posição', seg(M(442, 446), 'Excelência, sim.', 'No curso do inquérito'), None),
                ('Contraditório diferido', seg(M(442, 446), 'No curso do inquérito'), None)], 'vq2'))

# ============================================================ 5. LIBERDADE PROVISÓRIA COM CAUTELARES E PRISÃO SUPERVENIENTE
lp = (band('5', 'LIBERDADE PROVISÓRIA COM CAUTELARES E PRISÃO SUPERVENIENTE', 'art. 282, § 5º · art. 312, § 2º') +
      fonte('Meta 14 · Questão 3', 'PDF completo p.81–82') +
      pergunta('PERGUNTA DE PROVA ORAL', seg(3, 'Candidato,')) + rtag('Fala de abertura · ordem de argumentação') +
      step(1, 'A liberdade é a regra', seg(Q3, 'Excelência,', 'A decisão que impõe'), sid='l1', alt=True) +
      step(2, 'Decisão rebus sic stantibus', seg(Q3, 'A decisão que impõe', 'Conforme o art. 282'), sid='l2', alt=True) +
      step(3, 'Art. 282, § 5º do CPP', seg(Q3, 'Conforme o art. 282', 'Não há, portanto'), sid='l3', alt=True) +
      step(4, 'Sem preclusão', seg(Q3, 'Não há, portanto', 'No entanto,'), sid='l4', alt=True) +
      step(5, 'Exigência do STJ: art. 312, § 2º', seg(Q3, 'No entanto,', 'No HC 911.584-SP'), sid='l5', alt=True) +
      step(6, 'Caso do HC 911.584-SP', seg(Q3, 'No HC 911.584-SP'), sid='l6', alt=True) +
      QA('Roteiro 1', seg(12, 'A decisão que concede'), [
           ('Posição', seg(13, 'Excelência, não.', 'A decisão que define'), None),
           ('Fundamento', seg(13, 'A decisão que define', 'A mesma lógica'), None),
           ('Vale também para a preventiva', seg(13, 'A mesma lógica'), None)], 'lq1') +
      QA('Roteiro 2', seg(14, 'O que caracteriza'), [
           ('Conceito de fato novo', seg(15, 'Excelência, fato novo', 'Exige-se que'), None),
           ('Requisito: concreto e demonstrado', seg(15, 'Exige-se que'), None)], 'lq2'))

# ============================================================ 6. FIANÇA E ART. 350
def ger(s): return s
fianca = (band('6', 'FIANÇA E ART. 350', 'arts. 321 a 350 · inafiançabilidade · quebramento e perda') +
          fonte('Meta (fiança) · Questão 4', 'PDF completo p.197–201') +
          gap('O ART. 350 NO SEU MATERIAL',
              'O art. 350 aparece <b>uma única vez</b>, no passo 6, ligado à condição econômica do agente (dispensa, redução e aumento do valor). '
              'O texto do art. 350 em si e o descumprimento das obrigações impostas na liberdade provisória sem fiança não são explicados. Posso complementar a partir do roteiro do Renato Brasileiro, mantendo separado o que é do seu material.') +
          pergunta('PERGUNTA DE PROVA ORAL', seg(66, 'Candidato,')) + rtag('Fala de abertura · ordem de argumentação') +
          step(1, 'Natureza jurídica', seg(Fi, 'Excelência,', 'Consiste na prestação'), sid='f1', alt=True) +
          step(2, 'Modalidades de garantia', seg(Fi, 'Consiste na prestação', 'A caução tem como escopo'), sid='f2', alt=True) +
          step(3, 'Finalidades', seg(Fi, 'A caução tem como escopo', 'Quanto à competência'), sid='f3', alt=True) +
          step(4, 'Quem arbitra — art. 322', seg(Fi, 'Quanto à competência', 'Os limites quantitativos'), sid='f4', alt=True) +
          step(5, 'Valores — art. 325', seg(Fi, 'Os limites quantitativos', 'Atendendo às condições'), sid='f5', alt=True) +
          step(6, 'Condição econômica — arts. 325, § 1º, e 350', seg(Fi, 'Atendendo às condições', 'A legislação veda'), sid='f6', alt=True) +
          step(7, 'Inafiançabilidade constitucional — art. 323', seg(Fi, 'A legislação veda a fiança', 'O segundo grupo'), sid='f7', alt=True) +
          step(8, 'Inafiançabilidade do art. 324', seg(Fi, 'O segundo grupo', 'a) Inciso I:'), subs=[
                ('I', seg(Fi, 'a) Inciso I:', 'b) Inciso II:', skip_a=True)), ('II', seg(Fi, 'b) Inciso II:', 'c) Inciso IV:', skip_a=True)),
                ('IV', seg(Fi, 'c) Inciso IV:', 'Por derradeiro', skip_a=True))], sid='f8', alt=True) +
          step(9, 'Quebramento da fiança — art. 341', seg(Fi, 'Por derradeiro', 'O quebramento acarreta'), sid='f9', alt=True) +
          step(10, 'Consequência do quebramento — art. 343', seg(Fi, 'O quebramento acarreta', 'A perda total'), sid='f10', alt=True) +
          step(11, 'Perda total — arts. 344 a 346', seg(Fi, 'A perda total', None), sid='f11', alt=True) +
          duel('Duelo C · Arbitramento: autoridade policial × autoridade judiciária', 'Autoridade policial<small>art. 322, caput</small>', 'Autoridade judiciária<small>art. 322, parágrafo único</small>', [
                ('Quando', seg(Fi, 'o artigo 322 do CPP outorga', 'Nos casos em que'), seg(Fi, 'Nos casos em que a pena', 'Os limites quantitativos')),
                ('Valor da fiança — art. 325', seg(Fi, 'de um a cem salários mínimos', 'e de dez a duzentos'), seg(Fi, 'e de dez a duzentos', 'Atendendo às condições'))]) +
          duel('Duelo D · Quebramento × Perda da fiança', 'Quebramento<small>arts. 341 e 343</small>', 'Perda total<small>arts. 344 a 346</small>', [
                ('Quando ocorre', seg(Fi, 'O quebramento da fiança (artigo 341', 'O quebramento acarreta'), seg(Fi, 'A perda total', 'Nessa hipótese')),
                ('Consequência', seg(Fi, 'O quebramento acarreta', 'A perda total'), seg(Fi, 'Nessa hipótese', None))]) +
          QA('Roteiro 1', seg(125, 'A autoridade policial'), [
               ('Posição', seg(M(126, 133), 'Excelência, não.', 'O delegado'), None),
               ('Limite do delegado: pena máxima até 4 anos', seg(M(126, 133), 'O delegado', 'Todas as modalidades'), None),
               ('Furto qualificado', seg(M(126, 133), 'Todas as modalidades', 'Portanto,'), None),
               ('Quem decide', seg(M(126, 133), 'Portanto,'), None)], 'fq1') +
          QA('Roteiro 2', seg(M(134, 135), 'Quais são'), [
               ('Regra', seg(M(136, 142), 'Excelência, o artigo 324', 'no inciso I'), None),
               ('Inciso I', seg(M(136, 142), 'no inciso I', 'no inciso II'), None),
               ('Inciso II', seg(M(136, 142), 'no inciso II', 'e, no inciso IV'), None),
               ('Inciso IV', seg(M(136, 142), 'e, no inciso IV'), None)], 'fq2') +
          QA('Roteiro 3', seg(M(143, 144), 'A inafiançabilidade'), [
               ('Posição', seg(M(145, 150), 'Excelência, não.', 'A inafiançabilidade significa'), None),
               ('O que significa inafiançável', seg(M(145, 150), 'A inafiançabilidade significa', 'Todavia,'), None),
               ('Liberdade provisória sem fiança — STF (HC 104.339/SP)', seg(M(145, 150), 'Todavia,'), None)], 'fq3') +
          cards([('STF · HC 104.339/SP', seg(224, 'É inconstitucional', '(STF, HC 104.339'), '(STF, HC 104.339/SP, Rel. Min. Gilmar Mendes, Plenário, julgado em 10/05/2012)', 'usar em: Roteiro 3'),
                 ('CF/88 · art. 5º, LXVI · CPP, arts. 310, § 1º, e 323', seg(224, 'A inafiançabilidade prevista', '(CF/88'), '(CF/88, art. 5º, LXVI; CPP, arts. 310, § 1º, e 323)', 'inafiançável ≠ sem liberdade provisória')]))

# ============================================================ MONTAGEM
cov = [
    ('Art. 319 — lista das medidas', '○○○ ausente', 'não há questão própria', 'só exemplos soltos: redes sociais, monitoração (IX), contato, passaporte, comparecimento'),
    ('Art. 320 — ausentar-se do País', '●○○ mínima', 'regras gerais (passo 4)', 'aparece só como exemplo de cautelar mantida por mais de 5 anos'),
    ('Art. 350 e fiança', '●●● forte', 'Meta · Q4 fiança', 'fiança completa; o art. 350 só na condição econômica (passo 6)'),
    ('Regras gerais, domiciliar, revisão do 316', '●●● forte', 'Metas · Q4 (duas)', 'art. 282, 318/318-A/318-B, 316 p.u., ADIs 6.581 e 6.582'),
    ('Liberdade provisória com cautelares', '●●● forte', 'Meta 14 · Q3', 'rebus sic stantibus e prisão superveniente'),
]
covt = ('<table class="cov"><thead><tr><th>Tema</th><th>Cobertura</th><th>Onde</th><th>O que há</th></tr></thead><tbody>' +
        ''.join(f'<tr><td class="t">{a}</td><td class="lvl">{b}</td><td>{c}</td><td>{d}</td></tr>' for a, b, c, d in cov) + '</tbody></table>')
corpo = f"""
<header class="mast"><div class="kicker">Assuntos separados · Processo Penal · Oral PCPI · leitura estratégica</div>
<h1>Medidas cautelares: arts. 319, 320 e 350 do CPP</h1>
<h2>Compilado do seu "Direito Processual Penal — RESPOSTAS — Completo (Metas 01 a 45)", só com o texto das Metas, reorganizado em passos numerados.</h2></header>
<section class="panel wide">
 <div class="pcol"><div class="ptitle">Onde cada ponto está no seu material</div>{covt}</div>
 <div class="pcol"><div class="ptitle">Leia isto primeiro</div>
  <p class="pnote" style="margin:0 0 6px"><b>Sem grifos seus:</b> este PDF das Metas de Processo Penal não tem marcação sua. Por isso aqui não há cores de marca-texto.</p>
  <p class="pnote" style="margin:0 0 6px"><b>Fidelidade:</b> todo o texto é copiado das Metas; os rótulos dos passos são só navegação.</p>
  <p class="pnote" style="margin:0">Quadros pontilhados apontam o que <b>falta</b> no material.</p></div>
</section>
{gerais}
{art319}
{dom}
{revisao}
{lp}
{fianca}
<footer class="src">Material-base: Pompeo Metodologia — Curso de Prova Oral, Polícia Civil do Piauí (PDF "Direito Processual Penal — RESPOSTAS — Completo (Metas 01 a 45)"). Reorganizado para estudo pessoal.</footer>
"""
open('cpp_oral.html', 'w').write(shell(corpo, 'Processo Penal Medidas cautelares'))
print('ok')
