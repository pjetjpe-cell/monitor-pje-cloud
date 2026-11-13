"""Fase de um processo a partir dos movimentos do DataJud (regras explícitas em fase_de)."""
import json, re, datetime as dt
HOJE = dt.date.today()   # sobrescreva em teste: fases.HOJE = date(...)

def comp(m, desc):
    for c in m.get('complementosTabelados', []) or []:
        if c.get('descricao') == desc: return c.get('nome')

def rotulo(m):
    base = m['nome']
    for d in ('tipo_de_conclusao', 'tipo_de_peticao', 'tipo_de_documento', 'resultado', 'motivo_da_remessa', 'tipo_de_distribuicao_redistribuicao'):
        v = comp(m, d)
        if v and v not in ('Petição (outras)', 'Outros documentos'): return f"{base} ({v})"
    return base

def data(m): return dt.date.fromisoformat(m['dataHora'][:10])

def fase_de(g1, g2):
    """devolve (fase, detalhe, pendencia, prioridade, base)"""
    mv = sorted(g1.get('movimentos', []), key=lambda m: m['dataHora'])
    nomes = [(m['nome'], comp(m, 'tipo_de_peticao') or comp(m, 'tipo_de_documento') or comp(m, 'tipo_de_conclusao') or comp(m, 'resultado'), data(m)) for m in mv]
    def ultimo(pred):
        r = [x for x in nomes if pred(x)]; return r[-1] if r else None
    sent = ultimo(lambda x: x[0] in ('Procedência em Parte', 'Procedência', 'Improcedência', 'Mérito', 'Homologação de Transação', 'Extinção da execução ou do cumprimento da sentença'))
    transito = ultimo(lambda x: x[0] == 'Trânsito em julgado')
    apel = ultimo(lambda x: x[1] == 'Apelação')
    contra = ultimo(lambda x: x[1] == 'Contra-razões')
    emb = ultimo(lambda x: x[1] in ('Embargos de declaração', 'Embargos'))
    cont = ultimo(lambda x: x[1] == 'Contestação')
    repl = ultimo(lambda x: x[1] == 'Replica')
    mandado_exp = ultimo(lambda x: x[0] == 'Expedição de documento' and x[1] == 'Mandado')
    mandado_ok = ultimo(lambda x: x[0] == 'Mandado' and x[1] == 'entregue ao destinatário')
    desist = ultimo(lambda x: x[0] == 'Desistência')
    liminar = ultimo(lambda x: x[0] in ('Liminar', 'Antecipação de Tutela', 'Antecipação de tutela'))
    emenda = ultimo(lambda x: x[0] == 'Emenda à Inicial')
    distr = ultimo(lambda x: x[0] == 'Distribuição')
    ult = nomes[-1] if nomes else None
    concl = ult if (ult and ult[0] == 'Conclusão') else None
    classe = g1['classe']['nome']
    if desist and (not ult or ult[2] <= desist[2] or True) and (ult and ult[2] <= dt.date.fromisoformat(str(desist[2]))): pass

    if g2:  # há recurso no TJPE
        m2 = sorted(g2.get('movimentos', []), key=lambda m: m['dataHora']); u2 = m2[-1] if m2 else None
        baixa = any(m['nome'] == 'Baixa Definitiva' for m in m2)
        if baixa:
            return ('RECURSO JULGADO — BAIXA AO 1º GRAU', f"Apelação no {g2['orgaoJulgador']['nome']}; baixa definitiva em {data(u2) if u2 else ''}", 'Verificar acórdão e cumprimento/trânsito', 'ALTA', 'G2: Baixa Definitiva')
        return ('EM GRAU DE RECURSO (TJPE)', f"{g2['orgaoJulgador']['nome']}; últ. mov. {rotulo(u2) if u2 else ''} em {data(u2) if u2 else ''}", 'Acompanhar julgamento', 'MÉDIA', 'G2 ativo')
    if classe.startswith('Cumprimento'):
        return ('CUMPRIMENTO DE SENTENÇA' + (f" — CONCLUSO {comp(mv[-1],'tipo_de_conclusao').upper()}" if concl else ''), f"Classe: {classe}; últ. mov.: {rotulo(mv[-1]) if mv else ''} em {ult[2] if ult else ''}",
                'Conferir depósito/impugnação' if not concl else f"Concluso {comp(mv[-1],'tipo_de_conclusao')}", 'ALTA', 'classe de cumprimento')
    arq = ultimo(lambda x: x[0] == 'Definitivo')
    if desist and ((arq and arq[2] >= desist[2]) or (transito and transito[2] >= desist[2])):
        fim = arq if (arq and arq[2] >= desist[2]) else transito
        return ('EXTINTO POR DESISTÊNCIA — ARQUIVADO' if fim is arq else 'EXTINTO POR DESISTÊNCIA — TRANSITADO', f"Desistência em {desist[2]}; {'arquivamento definitivo' if fim is arq else 'trânsito em julgado'} em {fim[2]}", 'Nenhuma (encerrado). Conferir se há custas/honorários pendentes', 'BAIXA', 'Desistência + arquivamento/trânsito')
    if sent:
        if transito and transito[2] >= sent[2]:
            return ('SENTENÇA TRANSITADA EM JULGADO', f"Sentença {sent[0]} em {sent[2]}; trânsito em {transito[2]}", 'Iniciar cumprimento de sentença', 'ALTA', 'Trânsito em julgado')
        if apel and apel[2] >= sent[2]:
            if contra and contra[2] >= apel[2]:
                return ('APELAÇÃO COM CONTRARRAZÕES — AGUARDA REMESSA/JULGAMENTO', f"Sentença {sent[2]}; apelação {apel[2]}; contrarrazões {contra[2]}", 'Acompanhar remessa ao TJPE', 'MÉDIA', 'Apelação+Contra-razões')
            return ('APELAÇÃO INTERPOSTA — PRAZO DE CONTRARRAZÕES', f"Sentença {sent[2]}; apelação em {apel[2]}", 'Conferir intimação para contrarrazões (15 dias úteis)', 'ALTA', 'Apelação após sentença')
        if emb and emb[2] >= sent[2]:
            return ('EMBARGOS DE DECLARAÇÃO APÓS SENTENÇA', f"Sentença {sent[2]}; embargos {emb[2]}", 'Aguardar/impugnar embargos', 'ALTA', 'Embargos após sentença')
        dias = (HOJE - sent[2]).days
        return ('SENTENCIADO — PRAZO RECURSAL', f"{sent[0]} em {sent[2]} (há {dias} dias)", 'Verificar prazo de apelação/embargos de 15 dias úteis e trânsito', 'ALTA', 'Sentença sem recurso/trânsito')
    if desist and ult and ult[2] <= desist[2] + dt.timedelta(days=30):
        return ('DESISTÊNCIA PROTOCOLADA', f"Desistência em {desist[2]}; últ. mov. {rotulo(mv[-1])}", 'Aguardar homologação', 'BAIXA', 'Desistência')
    if cont:
        if not repl or repl[2] < cont[2]:
            return ('FALTA RÉPLICA', f"Contestação em {cont[2]} (há {(HOJE-cont[2]).days} dias); sem réplica após", 'Protocolar réplica (15 dias úteis da intimação — conferir prazo)', 'ALTA', 'Contestação sem Replica posterior')
        if concl:
            return (f"RÉPLICA JUNTADA — CONCLUSO {comp(mv[-1],'tipo_de_conclusao').upper().replace('PARA ','PARA ')}", f"Réplica {repl[2]}; concluso em {concl[2]}", 'Aguardar', 'MÉDIA', 'Replica + Conclusão')
        return ('RÉPLICA JUNTADA — AGUARDA SANEAMENTO/JULGAMENTO', f"Contestação {cont[2]}; réplica {repl[2]}", 'Verificar se há despacho de provas / pedir julgamento antecipado', 'MÉDIA', 'Contestação+Replica')
    # sem contestação
    if mandado_ok and (not mandado_exp or mandado_ok[2] >= mandado_exp[2]):
        return ('CITADA — PRAZO DE CONTESTAÇÃO CORRENDO', f"Mandado cumprido ('entregue ao destinatário') em {mandado_ok[2]} (há {(HOJE-mandado_ok[2]).days} dias); sem contestação", 'Aguardar contestação; se decorrido o prazo, pedir revelia', 'MÉDIA', 'Mandado entregue, sem contestação')
    if mandado_exp:
        return ('MANDADO/CITAÇÃO EXPEDIDO — AGUARDA CUMPRIMENTO', f"Mandado expedido em {mandado_exp[2]} (há {(HOJE-mandado_exp[2]).days} dias)", 'Cobrar cumprimento do mandado se >30 dias', 'MÉDIA' if (HOJE-mandado_exp[2]).days < 30 else 'ALTA', 'Mandado expedido sem retorno')
    if concl:
        tipo = comp(mv[-1], 'tipo_de_conclusao') or ''
        return (f"CONCLUSO {tipo.upper().replace('PARA ','').strip() and ('PARA ' + tipo.upper().replace('PARA ','')) or ''}".strip(), f"Concluso em {concl[2]} (há {(HOJE-concl[2]).days} dias)" + (f"; decisão de urgência em {liminar[2]}" if liminar else ''), 'Aguardar decisão; reiterar se parado >30 dias', 'MÉDIA' if (HOJE-concl[2]).days < 30 else 'ALTA', 'Última mov. = Conclusão')
    if emenda and (not ult or ult[2] <= emenda[2] + dt.timedelta(days=15)):
        return ('EMENDA À INICIAL PROTOCOLADA', f"Emenda em {emenda[2]}", 'Aguardar despacho/citação', 'MÉDIA', 'Emenda à inicial')
    if liminar:
        return ('TUTELA DECIDIDA — AGUARDA CITAÇÃO', f"Decisão de urgência em {liminar[2]}", 'Conferir expedição do mandado', 'MÉDIA', 'Liminar/antecipação sem mandado')
    if ult and ult[0] == 'Mero expediente':
        return ('DESPACHO PROFERIDO (MERO EXPEDIENTE) — VERIFICAR TEOR E PRAZO', f"Despacho em {ult[2]} (há {(HOJE-ult[2]).days} dias)", 'Ler o despacho e cumprir o que determinar', 'ALTA', 'Última mov. = Mero expediente')
    if ult and ult[0] in ('Publicação', 'Disponibilização no Diário da Justiça Eletrônico'):
        return ('INTIMAÇÃO PUBLICADA — CONFERIR PRAZO', f"Publicação no DJe em {ult[2]} (há {(HOJE-ult[2]).days} dias)", 'Ler a intimação e contar o prazo', 'ALTA', 'Última mov. = Publicação')
    if ult and ult[0] == 'Petição':
        return ('PETIÇÃO JUNTADA — AGUARDA ANÁLISE DO JUÍZO', f"Petição ({ult[1] or 'outras'}) em {ult[2]} (há {(HOJE-ult[2]).days} dias)", 'Aguardar; reiterar se >30 dias', 'MÉDIA' if (HOJE-ult[2]).days < 30 else 'ALTA', 'Última mov. = Petição')
    if ult and ult[0] in ('Expedição de documento', 'Documento', 'Recebimento', 'Remessa', 'Decurso de Prazo'):
        return (f"AGUARDANDO — ÚLTIMO ATO: {ult[0].upper()}", f"{rotulo(mv[-1])} em {ult[2]} (há {(HOJE-ult[2]).days} dias)", 'Conferir no PJe', 'BAIXA', 'Última mov. de expediente')
    return ('AGUARDANDO ANDAMENTO', f"Distribuído em {distr[2] if distr else ''}; últ. mov. {rotulo(mv[-1]) if mv else '—'} em {ult[2] if ult else '—'}", 'Conferir no PJe', 'BAIXA', 'sem marco identificável')
