// Trava de segurança: as calculadoras públicas só operam com séries importadas de fonte
// oficial (carimbo preenchido pelo importador) e recentes. Dados de demonstração do seed
// nunca têm carimbo, então jamais chegam ao consumidor.

export const IDADE_MAXIMA_DIAS = 120

export interface CarimbosIndices {
  ipcaAtualizadoEm: Date | null
  inccAtualizadoEm: Date | null
}

export function indiceOficialDisponivel(
  carimbos: CarimbosIndices,
  indice: 'IPCA' | 'INCC_DI_FGV',
  agora: Date = new Date()
): boolean {
  const carimbo = indice === 'IPCA' ? carimbos.ipcaAtualizadoEm : carimbos.inccAtualizadoEm
  if (!carimbo) return false
  const idadeDias = (agora.getTime() - carimbo.getTime()) / 86_400_000
  return idadeDias <= IDADE_MAXIMA_DIAS
}
