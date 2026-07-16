import { calcularBaseRestituicao, corrigirPagamentos } from './correcaoMonetaria'
import { calcularCenarios } from './cenarios'
import { calcularJurosTeseA, calcularJurosTeseB } from './juros'
import type { EntradaCalculo, ResultadoCalculo } from './types'

/**
 * Função pura e determinística que orquestra o cálculo completo de
 * estimativa de distrato. Nunca deve ser substituída por um LLM — ver
 * seção 6 do briefing: números derivam sempre destas funções.
 */
export function calcularDistrato(entrada: EntradaCalculo): ResultadoCalculo {
  const totalAtualizadoPago = corrigirPagamentos(entrada.pagamentos, entrada.correcao)
  const baseRestituicao = calcularBaseRestituicao(
    totalAtualizadoPago,
    entrada.comissaoCorretagem,
    entrada.incluirCorretagemNaBase
  )
  const cenariosBase = calcularCenarios(baseRestituicao, entrada.cenarios)

  const cenarios = cenariosBase.map(cenario => ({
    ...cenario,
    valorSemJuros: cenario.valor,
    valorComJurosTeseA: cenario.valor + calcularJurosTeseA(cenario.valor, entrada.juros),
    valorComJurosTeseB: cenario.valor + calcularJurosTeseB(cenario.valor, entrada.juros),
  }))

  return { totalAtualizadoPago, baseRestituicao, cenarios }
}
