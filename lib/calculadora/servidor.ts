import { prisma } from '@/lib/prisma/client'
import type { EntradaCalculo, PontoIndice } from './types'

export async function carregarSerieIndices(): Promise<PontoIndice[]> {
  const registros = await prisma.indiceEconomico.findMany()
  return registros.map(r => ({
    indice: r.indice,
    competencia: r.competencia,
    numeroIndice: Number(r.numeroIndice),
  }))
}

export async function carregarConfigCalculadora() {
  const config = await prisma.calculadoraConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  })
  return config
}

interface OpcoesCalculo {
  mesesEstimadosAteReferencia?: number
  incluirCorretagemNaBase?: boolean
}

export async function montarEntradaCalculo(cotaId: string, opts: OpcoesCalculo = {}): Promise<EntradaCalculo> {
  const cota = await prisma.cota.findUnique({
    where: { id: cotaId },
    include: { pagamentos: true, empreendimento: true },
  })
  if (!cota) throw new Error('Cota não encontrada')

  const [serieIndices, config] = await Promise.all([carregarSerieIndices(), carregarConfigCalculadora()])

  const dataReferencia = new Date()

  return {
    pagamentos: cota.pagamentos.map(p => ({ data: p.data, valor: Number(p.valor) })),
    correcao: {
      dataHabiteSe: cota.empreendimento.dataHabiteSeReal,
      indicePreHabiteSe: cota.empreendimento.indiceCorrecaoPreHabiteSe,
      indicePosHabiteSe: cota.empreendimento.indiceCorrecaoPosHabiteSe,
      serieIndices,
      dataReferencia,
    },
    comissaoCorretagem: Number(cota.valorComissaoCorretagem),
    incluirCorretagemNaBase: opts.incluirCorretagemNaBase ?? false,
    cenarios: {
      percentualConservador: Number(config.percentualConservador),
      percentualIntermediario: Number(config.percentualIntermediario),
      percentualOtimista: Number(config.percentualOtimista),
    },
    juros: {
      taxaSelicMensal: Number(config.taxaSelicMensal),
      taxaIpcaMensalEmbutida: Number(config.taxaIpcaMensalEmbutida),
      taxaJurosMensalSimples: Number(config.taxaJurosMensalSimples),
      // Ainda não há citação/manifestação de desistência registrada nesta etapa
      // (estimativa pré-processual): a contagem da Tese B começa na data-base.
      dataInicioContagemTeseB: dataReferencia,
      dataBase: dataReferencia,
      mesesEstimadosAteReferencia: opts.mesesEstimadosAteReferencia ?? config.mesesEstimadosPadrao,
    },
  }
}
