import { importarIpcaOficial } from '@/lib/indices/importar'
import { erro, json } from '@/lib/http'

export const maxDuration = 60

// Atualização mensal do IPCA (Vercel Cron). Exige CRON_SECRET — diferente do cron do monitor,
// aqui a rota nunca fica aberta quando a variável não está definida.
export async function GET(request: Request) {
  const segredo = process.env.CRON_SECRET
  if (!segredo || request.headers.get('authorization') !== `Bearer ${segredo}`) {
    return erro('Unauthorized', 401)
  }
  try {
    return json(await importarIpcaOficial())
  } catch (e) {
    console.error('cron indices: falha', (e as Error).message)
    return erro('Falha ao importar o IPCA', 502)
  }
}
