// Endpoint chamado pelo Vercel Cron Jobs a cada 30 minutos
// Configurado em vercel.json

import { NextResponse } from 'next/server'
import { verificarTodosProcessos } from '@/lib/monitor/verificar'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function GET(request: Request) {
  // Verifica autorização do cron (Vercel injeta CRON_SECRET automaticamente)
  const authHeader = request.headers.get('authorization')
  const cronSecret = process.env.CRON_SECRET

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const inicio = Date.now()

  try {
    const resultados = await verificarTodosProcessos()

    const novas = resultados.filter(r => r.status === 'nova_movimentacao').length
    const erros = resultados.filter(r => r.status === 'erro').length
    const duracaoMs = Date.now() - inicio

    console.log(`Cron: ${resultados.length} processos, ${novas} novidades, ${erros} erros (${duracaoMs}ms)`)

    return NextResponse.json({
      ok: true,
      resumo: { total: resultados.length, novas, erros, duracaoMs },
      detalhes: resultados,
    })
  } catch (err) {
    console.error('Cron falhou:', err)
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 })
  }
}
