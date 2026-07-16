import { redirect } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import AnunciarForm from '@/components/portal/AnunciarForm'

export default async function AnunciarPage() {
  const session = await getServerSession(authOptions)
  if (!session) {
    redirect('/login?callbackUrl=/venda-de-cotas/anunciar')
  }

  const cotas = await prisma.cota.findMany({
    where: { userId: session.user.id },
    include: { empreendimento: true },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Anunciar minha cota</h1>
      <p className="mt-2 text-sm text-dipallacio-navy-800/70">
        Todo anúncio novo passa por moderação da nossa equipe antes de ficar visível publicamente.
      </p>

      <div className="mt-8">
        <AnunciarForm
          cotas={cotas.map(c => ({
            id: c.id,
            label: `${c.empreendimento.nome}${c.unidade ? ' — Unidade ' + c.unidade : ''}`,
          }))}
        />
      </div>
    </div>
  )
}
