import { NextResponse } from 'next/server'
import { z } from 'zod'
import { prisma } from '@/lib/prisma/client'
import { exigirAdminApi } from '@/lib/auth/admin'

const schema = z.object({
  status: z.enum(['novo', 'em_analise', 'contatado', 'convertido', 'perdido']),
})

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const { id } = await params
  const body = await request.json().catch(() => null)
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Status inválido' }, { status: 400 })
  }

  const lead = await prisma.lead.update({ where: { id }, data: { status: parsed.data.status } })
  return NextResponse.json({ lead })
}
