import Link from 'next/link'
import { prisma } from '@/lib/prisma/client'

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export const metadata = {
  title: 'Venda de Cotas — Di Pallacio Enterprise',
}

export default async function VendaDeCotasPage({
  searchParams,
}: {
  searchParams: Promise<{ empreendimento?: string; cidade?: string; precoMin?: string; precoMax?: string }>
}) {
  const params = await searchParams

  const anuncios = await prisma.anuncio.findMany({
    where: {
      status: 'aprovado',
      ...(params.precoMin || params.precoMax
        ? {
            precoPedido: {
              ...(params.precoMin ? { gte: Number(params.precoMin) } : {}),
              ...(params.precoMax ? { lte: Number(params.precoMax) } : {}),
            },
          }
        : {}),
      ...(params.empreendimento
        ? { cota: { empreendimento: { nome: { contains: params.empreendimento, mode: 'insensitive' } } } }
        : {}),
      ...(params.cidade
        ? { cota: { empreendimento: { cidade: { contains: params.cidade, mode: 'insensitive' } } } }
        : {}),
    },
    include: { cota: { include: { empreendimento: true } } },
    orderBy: { createdAt: 'desc' },
  })

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Venda de Cotas</h1>
      <p className="mt-2 max-w-2xl text-sm text-dipallacio-navy-800/70">
        Anúncios de cotas de multipropriedade entre particulares, sempre mediados pela nossa equipe para
        evitar fraudes.
      </p>

      <form className="mt-8 grid gap-3 rounded-xl border border-dipallacio-navy-800/10 bg-white p-4 sm:grid-cols-4">
        <input
          name="empreendimento"
          defaultValue={params.empreendimento}
          placeholder="Empreendimento"
          className="rounded-lg border border-dipallacio-navy-800/20 px-3 py-2 text-sm"
        />
        <input
          name="cidade"
          defaultValue={params.cidade}
          placeholder="Cidade"
          className="rounded-lg border border-dipallacio-navy-800/20 px-3 py-2 text-sm"
        />
        <input
          name="precoMin"
          defaultValue={params.precoMin}
          type="number"
          placeholder="Preço mín."
          className="rounded-lg border border-dipallacio-navy-800/20 px-3 py-2 text-sm"
        />
        <input
          name="precoMax"
          defaultValue={params.precoMax}
          type="number"
          placeholder="Preço máx."
          className="rounded-lg border border-dipallacio-navy-800/20 px-3 py-2 text-sm"
        />
        <button
          type="submit"
          className="rounded-full bg-dipallacio-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-dipallacio-navy-800 sm:col-span-4 sm:w-fit"
        >
          Filtrar
        </button>
      </form>

      <div className="mt-8 flex justify-end">
        <Link
          href="/venda-de-cotas/anunciar"
          className="text-sm font-medium text-dipallacio-petrol-600 hover:underline"
        >
          + Anunciar minha cota
        </Link>
      </div>

      {anuncios.length === 0 ? (
        <p className="mt-8 text-sm text-dipallacio-navy-800/60">Nenhum anúncio encontrado.</p>
      ) : (
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {anuncios.map(a => (
            <Link
              key={a.id}
              href={`/venda-de-cotas/${a.id}`}
              className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-5 transition-shadow hover:shadow-md"
            >
              <p className="font-medium text-dipallacio-navy-900">{a.titulo}</p>
              {a.cota && (
                <p className="mt-1 text-sm text-dipallacio-navy-800/60">
                  {a.cota.empreendimento.nome} — {a.cota.empreendimento.cidade}/{a.cota.empreendimento.uf}
                </p>
              )}
              <p className="mt-3 font-serif text-xl text-dipallacio-navy-900">
                {formatarMoeda(Number(a.precoPedido))}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
