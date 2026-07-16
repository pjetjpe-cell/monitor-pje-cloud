import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { montarEntradaCalculo } from '@/lib/calculadora/servidor'
import { calcularDistrato } from '@/lib/calculadora/calcularDistrato'

const calculoSchema = z.object({
  cotaId: z.string().min(1),
  mesesEstimadosAteReferencia: z.coerce.number().int().min(0).max(120).optional(),
  incluirCorretagemNaBase: z.boolean().optional(),
})

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = calculoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const cota = await prisma.cota.findUnique({ where: { id: parsed.data.cotaId } })
  if (!cota || cota.userId !== session.user.id) {
    return NextResponse.json({ error: 'Cota não encontrada' }, { status: 404 })
  }

  const entrada = await montarEntradaCalculo(parsed.data.cotaId, {
    mesesEstimadosAteReferencia: parsed.data.mesesEstimadosAteReferencia,
    incluirCorretagemNaBase: parsed.data.incluirCorretagemNaBase,
  })
  const resultado = calcularDistrato(entrada)

  await prisma.calculoResultado.create({
    data: {
      cotaId: parsed.data.cotaId,
      parametrosUsados: JSON.parse(JSON.stringify(entrada)) as Prisma.InputJsonValue,
      cenarios: JSON.parse(JSON.stringify(resultado)) as Prisma.InputJsonValue,
    },
  })

  return NextResponse.json({ resultado })
}
