import { z } from 'zod'
import { calcularDistrato } from './calcularDistrato'
import { detalharCorrecao, verificarCobertura } from './correcaoMonetaria'
import type { Pagamento, PontoIndice, ResultadoCenario } from './types'

export const TOTAL_MAXIMO = 10_000_000
export const DATA_MINIMA_COMPRA = '1996-01-01'
export const MAX_PARCELAS = 240

export class ErroEstimativa extends Error {
  constructor(
    public codigo:
      | 'data_invalida'
      | 'corretagem_invalida'
      | 'indices_indisponiveis'
      | 'indices_nao_oficiais'
      | 'base_invalida',
    mensagem: string
  ) {
    super(mensagem)
    this.name = 'ErroEstimativa'
  }
}

/** Interpreta 'AAAA-MM-DD' como data UTC; devolve null para formatos ou dias inexistentes (ex.: 2023-02-31). */
export function parseDataIso(texto: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(texto)) return null
  const data = new Date(`${texto}T00:00:00Z`)
  if (Number.isNaN(data.getTime())) return null
  return data.toISOString().slice(0, 10) === texto ? data : null
}

const dataIso = z.string().refine(s => parseDataIso(s) !== null, 'Data inválida')
const dinheiro = z.number().finite().positive('Informe um valor maior que zero').max(TOTAL_MAXIMO, 'Valor acima do limite')

export const entradaPublicaSchema = z
  .object({
    empreendimento: z.string().trim().min(2, 'Informe o empreendimento').max(120),
    modo: z.enum(['rapido', 'detalhado']),
    dataCompra: dataIso,
    totalPago: dinheiro.optional(),
    dataUltimoPagamento: dataIso.optional(),
    parcelas: z.array(z.object({ data: dataIso, valor: dinheiro })).max(MAX_PARCELAS).optional(),
    valorCorretagem: z.number().finite().min(0).max(TOTAL_MAXIMO).default(0),
    incluirCorretagem: z.boolean().default(false),
    mesesEstimados: z.number().int().min(0).max(60).optional(),
  })
  .superRefine((v, ctx) => {
    if (v.modo === 'rapido' && v.totalPago === undefined) {
      ctx.addIssue({ code: 'custom', path: ['totalPago'], message: 'Informe o total pago' })
    }
    if (v.modo === 'detalhado' && (!v.parcelas || v.parcelas.length === 0)) {
      ctx.addIssue({ code: 'custom', path: ['parcelas'], message: 'Informe ao menos um pagamento' })
    }
  })

export type EntradaPublica = z.infer<typeof entradaPublicaSchema>

export interface ConfigCalculo {
  percentualConservador: number
  percentualIntermediario: number
  percentualOtimista: number
  mesesEstimadosPadrao: number
  taxaSelicMensal: number
  taxaIpcaMensalEmbutida: number
  taxaJurosMensalSimples: number
}

export interface LinhaMemoria {
  descricao: string
  data: string
  valorOriginal: number
  competenciaInicial: string
  competenciaFinal: string
  indiceInicial: number
  indiceFinal: number
  fator: number
  valorCorrigido: number
}

export interface EstimativaPublica {
  versao: 1
  geradaEm: string
  entrada: EntradaPublica
  premissas: {
    indice: 'IPCA'
    fonteIndice: string
    dataReferencia: string
    mesesEstimados: number
    percentuaisRestituicao: { conservador: number; intermediario: number; otimista: number }
    taxaSelicMensal: number
    taxaIpcaMensalEmbutida: number
    taxaJurosMensalSimples: number
    serieDe: string
    serieAte: string
    corretagemDeduzida: boolean
  }
  memoria: LinhaMemoria[]
  totais: {
    totalPagoInformado: number
    totalAtualizado: number
    corretagem: number
    baseRestituicao: number
  }
  cenarios: ResultadoCenario[]
  faixa: { minimo: number; maximo: number }
}

function competencia(d: Date): string {
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

function inicioDoDiaUtc(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()))
}

function dataMedia(a: Date, b: Date): Date {
  return inicioDoDiaUtc(new Date((a.getTime() + b.getTime()) / 2))
}

function montarPagamentos(entrada: EntradaPublica, hoje: Date): (Pagamento & { descricao: string })[] {
  const minima = parseDataIso(DATA_MINIMA_COMPRA)!
  const compra = parseDataIso(entrada.dataCompra)!

  if (compra < minima || compra > hoje) {
    throw new ErroEstimativa('data_invalida', 'A data da compra deve estar entre 01/01/1996 e hoje.')
  }

  if (entrada.modo === 'rapido') {
    const fim = entrada.dataUltimoPagamento ? parseDataIso(entrada.dataUltimoPagamento)! : hoje
    if (fim < compra || fim > hoje) {
      throw new ErroEstimativa('data_invalida', 'A data do último pagamento deve estar entre a data da compra e hoje.')
    }
    return [
      {
        descricao: `Total pago, considerado na data média entre a compra e o último pagamento (${competencia(compra)} a ${competencia(fim)})`,
        data: dataMedia(compra, fim),
        valor: entrada.totalPago!,
      },
    ]
  }

  return (entrada.parcelas ?? [])
    .map(p => ({ data: parseDataIso(p.data)!, valor: p.valor }))
    .sort((a, b) => a.data.getTime() - b.data.getTime())
    .map((p, i) => {
      if (p.data < minima || p.data > hoje) {
        throw new ErroEstimativa('data_invalida', `A data do pagamento ${i + 1} deve estar entre 01/01/1996 e hoje.`)
      }
      return { ...p, descricao: `Pagamento ${i + 1}` }
    })
}

/**
 * Estimativa pública ("cálculo médio"): correção pelo IPCA do IBGE, três cenários de
 * restituição e duas teses de juros. Função pura — não consulta banco nem rede.
 */
export function calcularEstimativaPublica(
  entrada: EntradaPublica,
  ctx: { serie: PontoIndice[]; config: ConfigCalculo; hoje?: Date }
): EstimativaPublica {
  const agora = ctx.hoje ?? new Date()
  const hoje = inicioDoDiaUtc(agora)
  const { config } = ctx

  const pagamentos = montarPagamentos(entrada, hoje)
  const totalPago = pagamentos.reduce((acc, p) => acc + p.valor, 0)

  if (entrada.valorCorretagem > totalPago) {
    throw new ErroEstimativa('corretagem_invalida', 'A comissão de corretagem não pode ser maior que o total pago.')
  }

  const maisAntiga = pagamentos.reduce((min, p) => (p.data < min ? p.data : min), pagamentos[0].data)
  const cobertura = verificarCobertura(ctx.serie, 'IPCA', maisAntiga, hoje)
  if (!cobertura.ok) {
    throw new ErroEstimativa('indices_indisponiveis', cobertura.motivo ?? 'Série de índices indisponível.')
  }

  const correcao = {
    dataHabiteSe: null,
    indicePreHabiteSe: 'IPCA' as const,
    indicePosHabiteSe: 'IPCA' as const,
    serieIndices: ctx.serie,
    dataReferencia: hoje,
  }

  const mesesEstimados = entrada.mesesEstimados ?? config.mesesEstimadosPadrao

  const resultado = calcularDistrato({
    pagamentos: pagamentos.map(({ data, valor }) => ({ data, valor })),
    correcao,
    comissaoCorretagem: entrada.valorCorretagem,
    incluirCorretagemNaBase: entrada.incluirCorretagem,
    cenarios: {
      percentualConservador: config.percentualConservador,
      percentualIntermediario: config.percentualIntermediario,
      percentualOtimista: config.percentualOtimista,
    },
    juros: {
      taxaSelicMensal: config.taxaSelicMensal,
      taxaIpcaMensalEmbutida: config.taxaIpcaMensalEmbutida,
      taxaJurosMensalSimples: config.taxaJurosMensalSimples,
      dataInicioContagemTeseB: hoje,
      dataBase: hoje,
      mesesEstimadosAteReferencia: mesesEstimados,
    },
  })

  if (resultado.baseRestituicao <= 0) {
    throw new ErroEstimativa('base_invalida', 'Com os valores informados a base de restituição ficou zerada. Revise a comissão de corretagem.')
  }

  const memoria: LinhaMemoria[] = pagamentos.map(p => {
    const detalhe = detalharCorrecao({ data: p.data, valor: p.valor }, correcao)
    const etapa = detalhe.etapas[0]
    return {
      descricao: p.descricao,
      data: p.data.toISOString().slice(0, 10),
      valorOriginal: p.valor,
      competenciaInicial: competencia(etapa.competenciaInicial),
      competenciaFinal: competencia(etapa.competenciaFinal),
      indiceInicial: etapa.indiceInicial,
      indiceFinal: etapa.indiceFinal,
      fator: detalhe.fatorTotal,
      valorCorrigido: detalhe.valorCorrigido,
    }
  })

  const minimo = Math.min(...resultado.cenarios.map(c => c.valorSemJuros))
  const maximo = Math.max(...resultado.cenarios.map(c => Math.max(c.valorComJurosTeseA, c.valorComJurosTeseB)))

  return {
    versao: 1,
    geradaEm: agora.toISOString(),
    entrada,
    premissas: {
      indice: 'IPCA',
      fonteIndice: 'IBGE — IPCA, número-índice (base dez/1993 = 100)',
      dataReferencia: hoje.toISOString().slice(0, 10),
      mesesEstimados,
      percentuaisRestituicao: {
        conservador: config.percentualConservador,
        intermediario: config.percentualIntermediario,
        otimista: config.percentualOtimista,
      },
      taxaSelicMensal: config.taxaSelicMensal,
      taxaIpcaMensalEmbutida: config.taxaIpcaMensalEmbutida,
      taxaJurosMensalSimples: config.taxaJurosMensalSimples,
      serieDe: competencia(cobertura.primeiraCompetencia!),
      serieAte: competencia(cobertura.ultimaCompetencia!),
      corretagemDeduzida: !entrada.incluirCorretagem && entrada.valorCorretagem > 0,
    },
    memoria,
    totais: {
      totalPagoInformado: totalPago,
      totalAtualizado: resultado.totalAtualizadoPago,
      corretagem: entrada.valorCorretagem,
      baseRestituicao: resultado.baseRestituicao,
    },
    cenarios: resultado.cenarios,
    faixa: { minimo, maximo },
  }
}
