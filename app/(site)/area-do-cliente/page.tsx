import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'

export default async function AreaDoClienteDashboard() {
  const session = await getServerSession(authOptions)
  const userId = session!.user.id

  const [cotas, anuncios] = await Promise.all([
    prisma.cota.count({ where: { userId } }),
    prisma.anuncio.count({ where: { userId } }),
  ])

  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
        <p className="text-sm text-dipallacio-navy-800/60">Cotas cadastradas</p>
        <p className="mt-2 font-serif text-3xl text-dipallacio-navy-900">{cotas}</p>
        <Link
          href="/area-do-cliente/minhas-cotas"
          className="mt-4 inline-block text-sm font-medium text-dipallacio-petrol-600 hover:underline"
        >
          Gerenciar cotas →
        </Link>
      </div>
      <div className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
        <p className="text-sm text-dipallacio-navy-800/60">Anúncios cadastrados</p>
        <p className="mt-2 font-serif text-3xl text-dipallacio-navy-900">{anuncios}</p>
        <Link
          href="/area-do-cliente/meus-anuncios"
          className="mt-4 inline-block text-sm font-medium text-dipallacio-petrol-600 hover:underline"
        >
          Ver anúncios →
        </Link>
      </div>
      <div className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
        <p className="text-sm text-dipallacio-navy-800/60">Simulação de distrato</p>
        <p className="mt-2 text-sm text-dipallacio-navy-800/70">
          Estime os cenários de restituição da sua cota.
        </p>
        <Link
          href="/area-do-cliente/calculadora"
          className="mt-4 inline-block text-sm font-medium text-dipallacio-petrol-600 hover:underline"
        >
          Ir para a calculadora →
        </Link>
      </div>
    </div>
  )
}
