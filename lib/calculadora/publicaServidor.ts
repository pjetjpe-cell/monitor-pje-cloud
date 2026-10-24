import { prisma } from '@/lib/prisma/client'
import { indiceOficialDisponivel } from '@/lib/indices/oficiais'
import { carregarConfigCalculadora } from './servidor'
import { calcularEstimativaPublica, ErroEstimativa, type EntradaPublica, type EstimativaPublica } from './publica'

const MENSAGEM_ATUALIZANDO =
  'A calculadora está sendo atualizada com os índices oficiais. Tente novamente em instantes ou fale com o escritório pelo WhatsApp.'

export async function calculadoraPublicaDisponivel(): Promise<{ ok: boolean; motivo?: string }> {
  const config = await carregarConfigCalculadora()
  return indiceOficialDisponivel(config, 'IPCA') ? { ok: true } : { ok: false, motivo: MENSAGEM_ATUALIZANDO }
}

export async function estimarPublicamente(entrada: EntradaPublica): Promise<EstimativaPublica> {
  const config = await carregarConfigCalculadora()
  if (!indiceOficialDisponivel(config, 'IPCA')) {
    throw new ErroEstimativa('indices_nao_oficiais', MENSAGEM_ATUALIZANDO)
  }

  const registros = await prisma.indiceEconomico.findMany({ where: { indice: 'IPCA' } })
  const serie = registros.map(r => ({
    indice: r.indice,
    competencia: r.competencia,
    numeroIndice: Number(r.numeroIndice),
  }))

  return calcularEstimativaPublica(entrada, {
    serie,
    config: {
      percentualConservador: Number(config.percentualConservador),
      percentualIntermediario: Number(config.percentualIntermediario),
      percentualOtimista: Number(config.percentualOtimista),
      mesesEstimadosPadrao: config.mesesEstimadosPadrao,
      taxaSelicMensal: Number(config.taxaSelicMensal),
      taxaIpcaMensalEmbutida: Number(config.taxaIpcaMensalEmbutida),
      taxaJurosMensalSimples: Number(config.taxaJurosMensalSimples),
    },
  })
}
