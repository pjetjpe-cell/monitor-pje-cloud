import { prisma } from '@/lib/prisma/client'
import { buscarIpcaIbge } from './ibge'

/** Substitui integralmente a série de IPCA pela do IBGE e carimba a configuração. */
export async function importarIpcaOficial(fetchImpl: typeof fetch = fetch) {
  const pontos = await buscarIpcaIbge(fetchImpl)
  const agora = new Date()

  await prisma.$transaction([
    prisma.indiceEconomico.deleteMany({ where: { indice: 'IPCA' } }),
    prisma.indiceEconomico.createMany({
      data: pontos.map(p => ({ indice: 'IPCA' as const, competencia: p.competencia, numeroIndice: p.numeroIndice })),
    }),
    prisma.calculadoraConfig.upsert({
      where: { id: 'default' },
      update: { ipcaAtualizadoEm: agora },
      create: { id: 'default', ipcaAtualizadoEm: agora },
    }),
  ])

  return {
    quantidade: pontos.length,
    de: pontos[0].competencia.toISOString().slice(0, 7),
    ate: pontos[pontos.length - 1].competencia.toISOString().slice(0, 7),
    atualizadoEm: agora.toISOString(),
  }
}
