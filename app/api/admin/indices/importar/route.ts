import { exigirAdminApi } from '@/lib/auth/admin'
import { importarIpcaOficial } from '@/lib/indices/importar'
import { ErroImportacaoIndices } from '@/lib/indices/ibge'
import { erro, json } from '@/lib/http'

export const maxDuration = 60

export async function POST() {
  const { erro: negado } = await exigirAdminApi()
  if (negado) return negado
  try {
    return json(await importarIpcaOficial())
  } catch (e) {
    if (e instanceof ErroImportacaoIndices) return erro(e.message, 502)
    console.error('importar ipca: erro inesperado', (e as Error).message)
    return erro('Erro inesperado ao importar o IPCA.', 500)
  }
}
