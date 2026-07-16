import type { Cenario, NomeCenario, ParametrosCenarios } from './types'

/**
 * Sempre retorna os três cenários juntos (nunca um número único) —
 * ver seção 6.3 do briefing. `percentual*` são percentuais de RESTITUIÇÃO.
 */
export function calcularCenarios(baseRestituicao: number, percentuais: ParametrosCenarios): Cenario[] {
  const defs: { nome: NomeCenario; percentualRestituicao: number }[] = [
    { nome: 'conservador', percentualRestituicao: percentuais.percentualConservador },
    { nome: 'intermediario', percentualRestituicao: percentuais.percentualIntermediario },
    { nome: 'otimista', percentualRestituicao: percentuais.percentualOtimista },
  ]

  return defs.map(({ nome, percentualRestituicao }) => ({
    nome,
    percentualRestituicao,
    percentualRetencao: 1 - percentualRestituicao,
    valor: baseRestituicao * percentualRestituicao,
  }))
}
