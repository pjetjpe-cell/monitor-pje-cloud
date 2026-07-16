import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { exigirAdminApi } from '@/lib/auth/admin'

const schema = z.object({
  percentualConservador: z.coerce.number().min(0).max(1),
  percentualIntermediario: z.coerce.number().min(0).max(1),
  percentualOtimista: z.coerce.number().min(0).max(1),
  teseJurosPadrao: z.enum(['selic_transito_julgado', 'um_por_cento_citacao']),
  mesesEstimadosPadrao: z.coerce.number().int().min(0).max(120),
  taxaSelicMensal: z.coerce.number().min(0).max(1),
  taxaIpcaMensalEmbutida: z.coerce.number().min(0).max(1),
  taxaJurosMensalSimples: z.coerce.number().min(0).max(1),
})

export async function PATCH(request: Request) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const config = await prisma.calculadoraConfig.upsert({
    where: { id: 'default' },
    update: parsed.data,
    create: { id: 'default', ...parsed.data },
  })

  return NextResponse.json({ config })
}
