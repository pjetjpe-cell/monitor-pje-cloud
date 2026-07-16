export type TipoIndice = 'INCC_DI_FGV' | 'IPCA'

export interface PontoIndice {
  indice: TipoIndice
  competencia: Date // primeiro dia do mês de referência
  numeroIndice: number
}

export interface Pagamento {
  data: Date
  valor: number
}

export interface ParametrosCorrecao {
  /** null = empreendimento sem habite-se registrado ainda: todos os pagamentos usam o índice pré-habite-se até a data de referência. */
  dataHabiteSe: Date | null
  indicePreHabiteSe: TipoIndice
  indicePosHabiteSe: TipoIndice
  serieIndices: PontoIndice[]
  dataReferencia: Date
}

export interface ParametrosCenarios {
  /** percentual de RESTITUIÇÃO (não de retenção) de cada cenário, ex.: 0.5 = devolve 50% */
  percentualConservador: number
  percentualIntermediario: number
  percentualOtimista: number
}

export type TeseJuros = 'selic_transito_julgado' | 'um_por_cento_citacao'

export interface ParametrosJuros {
  /** Tese A: taxa SELIC mensal vigente, já líquida de IPCA (SELIC - IPCA), aplicada apenas sobre o período estimado até o trânsito em julgado. */
  taxaSelicMensal: number
  taxaIpcaMensalEmbutida: number
  /** Tese B: juros de mora simples de 1% a.m. (art. 406 CC c/c art. 161 §1º CTN) */
  taxaJurosMensalSimples: number
  /** Data da citação ou da manifestação de desistência — marco inicial da Tese B */
  dataInicioContagemTeseB: Date
  dataBase: Date
  /** Slider administrativo: meses estimados até o fim do processo/trânsito em julgado */
  mesesEstimadosAteReferencia: number
}

export type NomeCenario = 'conservador' | 'intermediario' | 'otimista'

export interface Cenario {
  nome: NomeCenario
  percentualRetencao: number
  percentualRestituicao: number
  valor: number
}

export interface ResultadoCenario {
  nome: NomeCenario
  percentualRetencao: number
  percentualRestituicao: number
  valorSemJuros: number
  valorComJurosTeseA: number
  valorComJurosTeseB: number
}

export interface EntradaCalculo {
  pagamentos: Pagamento[]
  correcao: ParametrosCorrecao
  comissaoCorretagem: number
  incluirCorretagemNaBase: boolean
  cenarios: ParametrosCenarios
  juros: ParametrosJuros
}

export interface ResultadoCalculo {
  totalAtualizadoPago: number
  baseRestituicao: number
  cenarios: ResultadoCenario[]
}
