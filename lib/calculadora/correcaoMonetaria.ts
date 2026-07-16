import type { Pagamento, ParametrosCorrecao, PontoIndice, TipoIndice } from './types'

function competenciaDoMes(data: Date): string {
  return `${data.getUTCFullYear()}-${String(data.getUTCMonth() + 1).padStart(2, '0')}`
}

/**
 * Busca o número-índice vigente para o mês de `data`. Usa o último ponto
 * cadastrado igual ou anterior ao mês solicitado (a série é editada
 * mensalmente pelo admin e pode não ter o mês exato ainda).
 */
export function buscarNumeroIndice(serie: PontoIndice[], indice: TipoIndice, data: Date): number {
  const pontos = serie
    .filter(p => p.indice === indice)
    .sort((a, b) => a.competencia.getTime() - b.competencia.getTime())

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
  return selecionado.numeroIndice
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

/**
 * Corrige um único pagamento até a data de referência do cálculo.
 * Regra (seção 6.2 do briefing): pagamentos anteriores ao habite-se corrigem
 * primeiro pelo índice pré-habite-se até o habite-se, depois pelo índice
 * pós-habite-se do habite-se até a data de referência; pagamentos posteriores
 * ao habite-se corrigem direto pelo índice pós-habite-se.
 */
export function corrigirPagamento(pagamento: Pagamento, params: ParametrosCorrecao): number {
  const { dataHabiteSe, indicePreHabiteSe, indicePosHabiteSe, serieIndices, dataReferencia } = params

  if (dataHabiteSe && pagamento.data < dataHabiteSe) {
    const fatorPre = fatorCorrecao(serieIndices, indicePreHabiteSe, pagamento.data, dataHabiteSe)
    const fatorPos = fatorCorrecao(serieIndices, indicePosHabiteSe, dataHabiteSe, dataReferencia)
    return pagamento.valor * fatorPre * fatorPos
  }

  const fator = fatorCorrecao(serieIndices, indicePosHabiteSe, pagamento.data, dataReferencia)
  return pagamento.valor * fator
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
