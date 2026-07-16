import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'

export async function GET() {
  const empreendimentos = await prisma.empreendimento.findMany({
    select: { id: true, nome: true, cidade: true, uf: true },
    orderBy: { nome: 'asc' },
  })
  return NextResponse.json({ empreendimentos })
}
