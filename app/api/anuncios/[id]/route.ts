import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'

export async function GET(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const anuncio = await prisma.anuncio.findUnique({
    where: { id },
    include: { cota: { include: { empreendimento: true } } },
  })

  if (!anuncio) {
    return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 })
  }

  if (anuncio.status !== 'aprovado') {
    const session = await getServerSession(authOptions)
    const podeVer = session?.user.role === 'admin' || session?.user.id === anuncio.userId
    if (!podeVer) {
      return NextResponse.json({ error: 'Anúncio não encontrado' }, { status: 404 })
    }
  }

  return NextResponse.json({ anuncio })
}
