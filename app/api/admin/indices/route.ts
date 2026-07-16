import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { exigirAdminApi } from '@/lib/auth/admin'

const schema = z.object({
  indice: z.enum(['INCC_DI_FGV', 'IPCA']),
  competencia: z.coerce.date(),
  numeroIndice: z.coerce.number().positive(),
})

export async function GET() {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const indices = await prisma.indiceEconomico.findMany({
    orderBy: [{ indice: 'asc' }, { competencia: 'desc' }],
    take: 48,
  })
  return NextResponse.json({ indices })
}

export async function POST(request: Request) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const ponto = await prisma.indiceEconomico.upsert({
    where: { indice_competencia: { indice: parsed.data.indice, competencia: parsed.data.competencia } },
    update: { numeroIndice: parsed.data.numeroIndice },
    create: parsed.data,
  })

  return NextResponse.json({ ponto }, { status: 201 })
}
