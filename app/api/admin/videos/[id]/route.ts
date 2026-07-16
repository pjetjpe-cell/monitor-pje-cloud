import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma/client'
import { exigirAdminApi } from '@/lib/auth/admin'

export async function DELETE(_request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { erro } = await exigirAdminApi()
  if (erro) return erro

  const { id } = await params
  await prisma.video.delete({ where: { id } })
  return NextResponse.json({ ok: true })
}
