import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { exigirAdminApi } from '@/lib/auth/admin'

const schema = z.object({
  titulo: z.string().trim().min(2),
  slug: z
    .string()
    .trim()
    .min(2)
    .regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífens'),
  conteudoMarkdown: z.string().trim().min(10),
  autor: z.string().trim().min(2),
  publicado: z.boolean().default(false),
})

export async function POST(request: Request) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const existente = await prisma.artigo.findUnique({ where: { slug: parsed.data.slug } })
  if (existente) {
    return NextResponse.json({ error: 'Já existe um artigo com este slug' }, { status: 409 })
  }

  const { publicado, ...dados } = parsed.data

  const artigo = await prisma.artigo.create({
    data: { ...dados, publicadoEm: publicado ? new Date() : null },
  })

  return NextResponse.json({ artigo }, { status: 201 })
}
