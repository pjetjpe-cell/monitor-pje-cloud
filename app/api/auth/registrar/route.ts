import { NextResponse } from 'next/server'
import { z } from 'zod'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma/client'

const registroSchema = z.object({
  name: z.string().trim().min(2, 'Informe seu nome completo'),
  email: z.string().trim().email('E-mail inválido'),
  password: z.string().min(8, 'A senha deve ter ao menos 8 caracteres'),
  phone: z.string().trim().optional(),
  consentimento: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade' }),
  }),
})

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = registroSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const { name, email, password, phone } = parsed.data

  const existente = await prisma.user.findUnique({ where: { email } })
  if (existente) {
    return NextResponse.json({ error: 'Já existe uma conta com este e-mail' }, { status: 409 })
  }

  const passwordHash = await bcrypt.hash(password, 10)

  const user = await prisma.user.create({
    data: { name, email, phone, passwordHash, role: 'cliente' },
    select: { id: true, name: true, email: true },
  })

  return NextResponse.json({ user }, { status: 201 })
}
