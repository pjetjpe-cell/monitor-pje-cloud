import { prisma } from '@/lib/prisma/client'

export const metadata = {
  title: 'Calendário de Disponibilidade — Di Pallacio Enterprise',
}

export const dynamic = 'force-dynamic'

export default async function CalendarioPage() {
  const anuncios = await prisma.anuncio.findMany({
    where: { status: 'aprovado' },
    include: { cota: { include: { empreendimento: true } } },
    orderBy: { createdAt: 'desc' },
  })

  const comDisponibilidade = anuncios.filter(
    a => Array.isArray(a.disponibilidades) && (a.disponibilidades as string[]).length > 0
  )

  return (
    <div className="mx-auto max-w-4xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Calendário de Disponibilidade</h1>
      <p className="mt-2 max-w-2xl text-sm text-dipallacio-navy-800/70">
        Períodos informados pelos próprios anunciantes do marketplace — útil para quem busca apenas usar
        (locação/troca), não necessariamente comprar.
      </p>

      {comDisponibilidade.length === 0 ? (
        <p className="mt-8 text-sm text-dipallacio-navy-800/60">
          Nenhum período de disponibilidade informado no momento.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {comDisponibilidade.map(a => (
            <div key={a.id} className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-5">
              <p className="font-medium text-dipallacio-navy-900">
                {a.cota ? a.cota.empreendimento.nome : a.titulo}
              </p>
              <ul className="mt-2 flex flex-wrap gap-2">
                {(a.disponibilidades as string[]).map((periodo, i) => (
                  <li
                    key={i}
                    className="rounded-full bg-dipallacio-petrol-700/10 px-3 py-1 text-xs text-dipallacio-petrol-700"
                  >
                    {periodo}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
