import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'

const cotaSchema = z.object({
  empreendimentoId: z.string().min(1, 'Selecione o empreendimento'),
  unidade: z.string().trim().optional(),
  bloco: z.string().trim().optional(),
  fracaoTempo: z.string().trim().optional(),
  dataContrato: z.coerce.date(),
  valorTotalContrato: z.coerce.number().positive('Informe o valor total do contrato'),
  valorComissaoCorretagem: z.coerce.number().nonnegative().default(0),
  percentualMultaContratual: z.coerce.number().min(0).max(1).default(0.5),
})

export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const cotas = await prisma.cota.findMany({
    where: { userId: session.user.id },
    include: { empreendimento: true, pagamentos: { orderBy: { data: 'asc' } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ cotas })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = cotaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const cota = await prisma.cota.create({
    data: { ...parsed.data, userId: session.user.id },
    include: { empreendimento: true, pagamentos: true },
  })

  return NextResponse.json({ cota }, { status: 201 })
}
