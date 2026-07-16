import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { exigirAdminApi } from '@/lib/auth/admin'

const schema = z.object({
  nome: z.string().trim().min(2).optional(),
  cidade: z.string().trim().min(2).optional(),
  uf: z.string().trim().length(2).optional(),
  dataHabiteSePrevista: z.coerce.date().optional().nullable(),
  dataHabiteSeReal: z.coerce.date().optional().nullable(),
  indiceCorrecaoPreHabiteSe: z.enum(['INCC_DI_FGV', 'IPCA']).optional(),
  indiceCorrecaoPosHabiteSe: z.enum(['INCC_DI_FGV', 'IPCA']).optional(),
  percentualMultaPadrao: z.coerce.number().min(0).max(1).optional(),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const empreendimento = await prisma.empreendimento.update({ where: { id }, data: parsed.data })
  return NextResponse.json({ empreendimento })
}

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const { id } = await params
  await prisma.empreendimento.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
