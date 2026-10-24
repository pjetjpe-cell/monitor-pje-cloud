import type { Pagamento, ParametrosCorrecao, PontoIndice, TipoIndice } from './types'

function competenciaDoMes(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`
}

function seriePorIndice(serie: PontoIndice[], indice: TipoIndice): PontoIndice[] {
  return serie
    .filter(p => p.indice === indice)
    .sort((a, b) => a.competencia.getTime() - b.competencia.getTime())
}

/**
 * Busca o ponto do índice vigente para o mês de `data`: o último ponto cadastrado
 * igual ou anterior ao mês solicitado (a série é atualizada mensalmente e pode
 * não ter o mês corrente ainda). Antes do início da série usa o primeiro ponto —
 * por isso chamadores públicos devem checar `verificarCobertura` antes.
 */
export function buscarPontoIndice(serie: PontoIndice[], indice: TipoIndice, data: Date): PontoIndice {
  const pontos = seriePorIndice(serie, indice)

  if (pontos.length === 0) {
    throw new Error(`Nenhum número-índice cadastrado para ${indice}`)
  }

  const alvo = competenciaDoMes(data)
  let selecionado = pontos[0]
  for (const ponto of pontos) {
    if (competenciaDoMes(ponto.competencia) <= alvo) {
      selecionado = ponto
    } else {
      break
    }
  }
  return selecionado
}

export function buscarNumeroIndice(serie: PontoIndice[], indice: TipoIndice, data: Date): number {
  return buscarPontoIndice(serie, indice, data).numeroIndice
}

export function fatorCorrecao(
  serie: PontoIndice[],
  indice: TipoIndice,
  dataInicio: Date,
  dataFim: Date
): number {
  const indiceInicio = buscarNumeroIndice(serie, indice, dataInicio)
  const indiceFim = buscarNumeroIndice(serie, indice, dataFim)
  return indiceFim / indiceInicio
}

export interface CoberturaIndice {
  ok: boolean
  motivo?: string
  primeiraCompetencia?: Date
  ultimaCompetencia?: Date
}

/**
 * Garante que a série cobre o período solicitado: começa até o mês de `dataMinima`
 * e não está defasada em mais de `mesesToleranciaFim` meses em relação a `dataFim`.
 */
export function verificarCobertura(
  serie: PontoIndice[],
  indice: TipoIndice,
  dataMinima: Date,
  dataFim: Date,
  mesesToleranciaFim = 3
): CoberturaIndice {
  const pontos = seriePorIndice(serie, indice)
  if (pontos.length === 0) {
    return { ok: false, motivo: `Não há série de ${indice} cadastrada.` }
  }

  const primeira = pontos[0].competencia
  const ultima = pontos[pontos.length - 1].competencia

  if (competenciaDoMes(primeira) > competenciaDoMes(dataMinima)) {
    return {
      ok: false,
      motivo: `A série de ${indice} começa em ${competenciaDoMes(primeira)}, depois da data informada.`,
      primeiraCompetencia: primeira,
      ultimaCompetencia: ultima,
    }
  }

  const mesesDefasagem =
    (dataFim.getUTCFullYear() - ultima.getUTCFullYear()) * 12 + (dataFim.getUTCMonth() - ultima.getUTCMonth())
  if (mesesDefasagem > mesesToleranciaFim) {
    return {
      ok: false,
      motivo: `A série de ${indice} está desatualizada (último mês disponível: ${competenciaDoMes(ultima)}).`,
      primeiraCompetencia: primeira,
      ultimaCompetencia: ultima,
    }
  }

  return { ok: true, primeiraCompetencia: primeira, ultimaCompetencia: ultima }
}

export interface EtapaCorrecao {
  indice: TipoIndice
  de: Date
  ate: Date
  competenciaInicial: Date
  competenciaFinal: Date
  indiceInicial: number
  indiceFinal: number
  fator: number
}

export interface DetalheCorrecao {
  data: Date
  valorOriginal: number
  etapas: EtapaCorrecao[]
  fatorTotal: number
  valorCorrigido: number
}

function montarEtapa(serie: PontoIndice[], indice: TipoIndice, de: Date, ate: Date): EtapaCorrecao {
  const inicial = buscarPontoIndice(serie, indice, de)
  const final = buscarPontoIndice(serie, indice, ate)
  return {
    indice,
    de,
    ate,
    competenciaInicial: inicial.competencia,
    competenciaFinal: final.competencia,
    indiceInicial: inicial.numeroIndice,
    indiceFinal: final.numeroIndice,
    fator: final.numeroIndice / inicial.numeroIndice,
  }
}

/**
 * Versão detalhada de `corrigirPagamento`: devolve cada etapa (índice, competências
 * e números-índice usados) para compor a memória de cálculo do relatório.
 */
export function detalharCorrecao(pagamento: Pagamento, params: ParametrosCorrecao): DetalheCorrecao {
  const { dataHabiteSe, indicePreHabiteSe, indicePosHabiteSe, serieIndices, dataReferencia } = params

  const etapas: EtapaCorrecao[] = []
  if (dataHabiteSe && pagamento.data < dataHabiteSe) {
    etapas.push(montarEtapa(serieIndices, indicePreHabiteSe, pagamento.data, dataHabiteSe))
    etapas.push(montarEtapa(serieIndices, indicePosHabiteSe, dataHabiteSe, dataReferencia))
  } else {
    etapas.push(montarEtapa(serieIndices, indicePosHabiteSe, pagamento.data, dataReferencia))
  }

  const fatorTotal = etapas.reduce((acc, e) => acc * e.fator, 1)
  return {
    data: pagamento.data,
    valorOriginal: pagamento.valor,
    etapas,
    fatorTotal,
    valorCorrigido: pagamento.valor * fatorTotal,
  }
}

/**
 * Corrige um único pagamento até a data de referência do cálculo.
 * Regra (seção 6.2 do briefing): pagamentos anteriores ao habite-se corrigem
 * primeiro pelo índice pré-habite-se até o habite-se, depois pelo índice
 * pós-habite-se do habite-se até a data de referência; pagamentos posteriores
 * ao habite-se (ou sem habite-se informado) corrigem direto pelo índice pós-habite-se.
 */
export function corrigirPagamento(pagamento: Pagamento, params: ParametrosCorrecao): number {
  return detalharCorrecao(pagamento, params).valorCorrigido
}

export function corrigirPagamentos(pagamentos: Pagamento[], params: ParametrosCorrecao): number {
  return pagamentos.reduce((total, p) => total + corrigirPagamento(p, params), 0)
}

export function calcularBaseRestituicao(
  totalAtualizadoPago: number,
  comissaoCorretagem: number,
  incluirCorretagemNaBase: boolean
): number {
  return incluirCorretagemNaBase ? totalAtualizadoPago : totalAtualizadoPago - comissaoCorretagem
}
