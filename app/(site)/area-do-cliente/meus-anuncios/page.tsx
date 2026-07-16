import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'

const statusLabel: Record<string, string> = {
  pendente: 'Pendente de aprovação',
  aprovado: 'Aprovado',
  em_negociacao: 'Em negociação',
  vendido: 'Vendido',
  rejeitado: 'Rejeitado',
}

export default async function MeusAnunciosPage() {
  const session = await getServerSession(authOptions)
  const anuncios = await prisma.anuncio.findMany({
    where: { userId: session!.user.id },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-dipallacio-navy-900">Meus Anúncios</h2>
        <Link
          href="/venda-de-cotas/anunciar"
          className="rounded-full bg-dipallacio-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-dipallacio-navy-800"
        >
          + Novo anúncio
        </Link>
      </div>

      {anuncios.length === 0 ? (
        <p className="text-sm text-dipallacio-navy-800/60">Você ainda não publicou nenhum anúncio.</p>
      ) : (
        <div className="space-y-3">
          {anuncios.map(a => (
            <div key={a.id} className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="font-medium text-dipallacio-navy-900">{a.titulo}</p>
                  <p className="mt-1 text-sm text-dipallacio-navy-800/60">{a.descricao}</p>
                </div>
                <span className="whitespace-nowrap rounded-full bg-dipallacio-navy-900/5 px-3 py-1 text-xs font-medium text-dipallacio-navy-800">
                  {statusLabel[a.status]}
                </span>
              </div>
              <p className="mt-2 text-sm font-medium text-dipallacio-navy-900">
                {Number(a.precoPedido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
