import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { exigirAdminApi } from '@/lib/auth/admin'

const schema = z.object({
  nome: z.string().trim().min(2),
  cidade: z.string().trim().min(2),
  uf: z.string().trim().length(2),
  dataHabiteSePrevista: z.coerce.date().optional(),
  dataHabiteSeReal: z.coerce.date().optional(),
  indiceCorrecaoPreHabiteSe: z.enum(['INCC_DI_FGV', 'IPCA']).default('INCC_DI_FGV'),
  indiceCorrecaoPosHabiteSe: z.enum(['INCC_DI_FGV', 'IPCA']).default('IPCA'),
  percentualMultaPadrao: z.coerce.number().min(0).max(1).default(0.5),
})

export async function GET() {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const empreendimentos = await prisma.empreendimento.findMany({ orderBy: { nome: 'asc' } })
  return NextResponse.json({ empreendimentos })
}

export async function POST(request: Request) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const empreendimento = await prisma.empreendimento.create({ data: parsed.data })
  return NextResponse.json({ empreendimento }, { status: 201 })
}
