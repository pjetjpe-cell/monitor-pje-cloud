import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import TrocaForm from '@/components/portal/TrocaForm'

export const metadata = {
  title: 'Trocas de Datas e Cotas — Di Pallacio Enterprise',
}

export default async function TrocasPage() {
  const session = await getServerSession(authOptions)

  const [propostas, cotas] = await Promise.all([
    prisma.propostaTroca.findMany({
      where: { status: 'aberta' },
      include: { user: { select: { name: true } }, cotaOfertada: { include: { empreendimento: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    session
      ? prisma.cota.findMany({
          where: { userId: session.user.id },
          include: { empreendimento: true },
        })
      : Promise.resolve([]),
  ])

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Mural de Trocas</h1>
      <p className="mt-2 text-sm text-dipallacio-navy-800/70">
        Proprietários que desejam trocar semanas ou temporadas entre si.
      </p>

      <div className="mt-8">
        {session ? (
          <TrocaForm
            cotas={cotas.map(c => ({
              id: c.id,
              label: `${c.empreendimento.nome}${c.unidade ? ' — Unidade ' + c.unidade : ''}`,
            }))}
          />
        ) : (
          <p className="rounded-xl border border-dashed border-dipallacio-navy-800/20 bg-white p-6 text-sm text-dipallacio-navy-800/70">
            <Link href="/login?callbackUrl=/trocas" className="font-medium text-dipallacio-petrol-600 hover:underline">
              Entre na sua conta
            </Link>{' '}
            para publicar uma proposta de troca.
          </p>
        )}
      </div>

      <div className="mt-10 space-y-3">
        {propostas.length === 0 ? (
          <p className="text-sm text-dipallacio-navy-800/60">Nenhuma proposta de troca no momento.</p>
        ) : (
          propostas.map(p => (
            <Link
              key={p.id}
              href={`/trocas/${p.id}`}
              className="block rounded-xl border border-dipallacio-navy-800/10 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <p className="font-medium text-dipallacio-navy-900">
                Deseja: {p.empreendimentoDesejado} · {p.periodoDesejado}
              </p>
              {p.cotaOfertada && (
                <p className="mt-1 text-sm text-dipallacio-navy-800/60">
                  Oferece: {p.cotaOfertada.empreendimento.nome}
                </p>
              )}
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
