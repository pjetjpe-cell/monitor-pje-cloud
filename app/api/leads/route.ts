import { NextResponse } from 'next/server'
import { z } from 'zod'
import { getServerSession } from 'next-auth'
import type { Prisma } from '@prisma/client'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import { limitarTaxa, identificarCliente } from '@/lib/rateLimit'

const leadSchema = z.object({
  nome: z.string().trim().min(2, 'Informe seu nome'),
  contato: z.string().trim().min(5, 'Informe um telefone ou e-mail para contato'),
  empreendimento: z.string().trim().optional(),
  valorPagoAprox: z.coerce.number().nonnegative().optional(),
  motivo: z.string().trim().optional(),
  origem: z.enum(['form_distrato', 'calculadora', 'whatsapp']).default('form_distrato'),
  detalhes: z.record(z.string(), z.unknown()).optional(),
  consentimento: z.literal(true, {
    errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade' }),
  }),
})

export async function POST(request: Request) {
  const cliente = identificarCliente(request)
  if (!limitarTaxa(`lead:${cliente}`, 5, 60_000)) {
    return NextResponse.json({ error: 'Muitas tentativas. Tente novamente em instantes.' }, { status: 429 })
  }

  const body = await request.json().catch(() => null)
  const parsed = leadSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? 'Dados inválidos' }, { status: 400 })
  }

  const { consentimento: _consentimento, ...dados } = parsed.data

  const lead = await prisma.lead.create({
    data: { ...dados, detalhes: dados.detalhes as Prisma.InputJsonValue | undefined },
  })

  return NextResponse.json({ lead: { id: lead.id } }, { status: 201 })
}

export async function GET() {
  const session = await getServerSession(authOptions)
  if (session?.user.role !== 'admin') {
    return NextResponse.json({ error: 'Não autorizado' }, { status: 403 })
  }

  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })
  return NextResponse.json({ leads })
}
