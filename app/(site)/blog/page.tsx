import Link from 'next/link'
import { prisma } from '@/lib/prisma/client'

export const metadata = {
  title: 'Blog — Di Pallacio Enterprise',
}

export default async function BlogPage() {
  const artigos = await prisma.artigo.findMany({
    where: { publicadoEm: { not: null } },
    orderBy: { publicadoEm: 'desc' },
  })

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Blog</h1>
      <p className="mt-2 text-sm text-dipallacio-navy-800/70">Artigos e FAQ jurídico sobre multipropriedade.</p>

      <div className="mt-8 space-y-6">
        {artigos.length === 0 ? (
          <p className="text-sm text-dipallacio-navy-800/60">Nenhum artigo publicado ainda.</p>
        ) : (
          artigos.map(a => (
            <Link
              key={a.id}
              href={`/blog/${a.slug}`}
              className="block rounded-xl border border-dipallacio-navy-800/10 bg-white p-6 transition-shadow hover:shadow-md"
            >
              <p className="font-serif text-xl text-dipallacio-navy-900">{a.titulo}</p>
              <p className="mt-2 text-sm text-dipallacio-navy-800/60">
                {a.autor} · {a.publicadoEm?.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
              </p>
            </Link>
          ))
        )}
      </div>
    </div>
  )
}
