import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'

const anuncioSchema = z.object({
  titulo: z.string().trim().min(3, 'Informe um título'),
  descricao: z.string().trim().min(10, 'Descreva a cota anunciada'),
  precoPedido: z.coerce.number().positive('Informe o preço pedido'),
  fotos: z.array(z.string().url()).default([]),
  cotaId: z.string().optional(),
  disponibilidades: z.array(z.string()).optional(),
})

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const empreendimento = searchParams.get('empreendimento') ?? undefined
  const precoMin = searchParams.get('precoMin')
  const precoMax = searchParams.get('precoMax')

  const anuncios = await prisma.anuncio.findMany({
    where: {
      status: 'aprovado',
      ...(precoMin || precoMax
        ? {
            precoPedido: {
              ...(precoMin ? { gte: Number(precoMin) } : {}),
              ...(precoMax ? { lte: Number(precoMax) } : {}),
            },
          }
        : {}),
      ...(empreendimento
        ? { cota: { empreendimento: { nome: { contains: empreendimento, mode: 'insensitive' } } } }
        : {}),
    },
    include: { cota: { include: { empreendimento: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return NextResponse.json({ anuncios })
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions)
  if (!session) {
    return NextResponse.json({ error: 'Não autenticado' }, { status: 401 })
  }

  const body = await request.json().catch(() => null)
  const parsed = anuncioSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  if (parsed.data.cotaId) {
    const cota = await prisma.cota.findUnique({ where: { id: parsed.data.cotaId } })
    if (!cota || cota.userId !== session.user.id) {
      return NextResponse.json({ error: 'Cota inválida' }, { status: 400 })
    }
  }

  const anuncio = await prisma.anuncio.create({
    data: {
      titulo: parsed.data.titulo,
      descricao: parsed.data.descricao,
      precoPedido: parsed.data.precoPedido,
      fotos: parsed.data.fotos,
      cotaId: parsed.data.cotaId,
      disponibilidades: (parsed.data.disponibilidades ?? []) as Prisma.InputJsonValue,
      userId: session.user.id,
      status: 'pendente',
    },
  })

  return NextResponse.json({ anuncio }, { status: 201 })
}
