import type { ParametrosJuros } from './types'

function mesesEntre(dataInicio: Date, dataFim: Date): number {
  const meses =
    (dataFim.getUTCFullYear() - dataInicio.getUTCFullYear()) * 12 +
    (dataFim.getUTCMonth() - dataInicio.getUTCMonth())
  return Math.max(0, meses)
}

/**
 * Tese A (mais aceita): SELIC mensal líquida de IPCA (já embutido na correção
 * monetária), incidindo apenas sobre o período estimado até o trânsito em
 * julgado — contado a partir da data-base do cálculo via slider administrativo.
 */
export function calcularJurosTeseA(
  valorBase: number,
  params: Pick<ParametrosJuros, 'taxaSelicMensal' | 'taxaIpcaMensalEmbutida' | 'mesesEstimadosAteReferencia'>
): number {
  const taxaLiquida = Math.max(0, params.taxaSelicMensal - params.taxaIpcaMensalEmbutida)
  return valorBase * taxaLiquida * params.mesesEstimadosAteReferencia
}

/**
 * Tese B: juros de mora simples de 1% a.m. (art. 406 do CC c/c art. 161, §1º,
 * do CTN), contados da citação/manifestação de desistência até a mesma data
 * de referência estimada da Tese A, para permitir comparação lado a lado.
 */
export function calcularJurosTeseB(
  valorBase: number,
  params: Pick<
    ParametrosJuros,
    'taxaJurosMensalSimples' | 'dataInicioContagemTeseB' | 'dataBase' | 'mesesEstimadosAteReferencia'
  >
): number {
  const mesesJaDecorridos = mesesEntre(params.dataInicioContagemTeseB, params.dataBase)
  const totalMeses = mesesJaDecorridos + params.mesesEstimadosAteReferencia
  return valorBase * params.taxaJurosMensalSimples * totalMeses
}
