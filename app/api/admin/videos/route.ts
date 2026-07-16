import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { exigirAdminApi } from '@/lib/auth/admin'

const schema = z.object({
  titulo: z.string().trim().min(2),
  descricao: z.string().trim().min(2),
  urlEmbed: z.string().trim().url(),
  categoria: z.string().trim().min(2),
  ordem: z.coerce.number().int().default(0),
})

export async function POST(request: Request) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const video = await prisma.video.create({ data: parsed.data })
  return NextResponse.json({ video }, { status: 201 })
}
