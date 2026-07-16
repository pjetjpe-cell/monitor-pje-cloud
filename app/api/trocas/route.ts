import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'

const propostaSchema = z.object({
  periodoDesejado: z.string().trim().min(2, 'Descreva o período desejado'),
  empreendimentoDesejado: z.string().trim().min(2, 'Informe o empreendimento desejado'),
  cotaOfertadaId: z.string().optional(),
})

export async function GET() {
  const propostas = await prisma.propostaTroca.findMany({
    where: { status: 'aberta' },
    include: { user: { select: { name: true } }, cotaOfertada: { include: { empreendimento: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return NextResponse.json({ propostas })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = propostaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  if (parsed.data.cotaOfertadaId) {
    const cota = await prisma.cota.findUnique({ where: { id: parsed.data.cotaOfertadaId } })
    if (!cota || cota.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cota inválida' }, { status: 400 })
    }
  }

  const proposta = await prisma.propostaTroca.create({
    data: { ...parsed.data, userId: session.user.id },
  })

  return NextResponse.json({ proposta }, { status: 201 })
}
