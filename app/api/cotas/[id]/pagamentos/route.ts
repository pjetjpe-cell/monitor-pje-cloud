import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'

const pagamentoSchema = z.object({
  data: z.coerce.date(),
  valor: z.coerce.number().positive('Informe o valor pago'),
  tipo: z.enum(['sinal', 'parcela', 'taxa']).default('parcela'),
})

export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const { id: cotaId } = await params

  const cota = await prisma.cota.findUnique({ where: { id: cotaId } })
  if (!cota || cota.userId !== session.user.id) {
    return NextResponse.json({ error: 'Cota não encontrada' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = pagamentoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const pagamento = await prisma.pagamento.create({
    data: { ...parsed.data, cotaId },
  })

  return NextResponse.json({ pagamento }, { status: 201 })
}
