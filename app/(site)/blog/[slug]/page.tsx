import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { prisma } from '@/lib/prisma/client'

export default async function ArtigoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artigo = await prisma.artigo.findUnique({ where: { slug } })

  if (!artigo || !artigo.publicadoEm) notFound()

  const html = marked.parse(artigo.conteudoMarkdown, { async: false }) as string

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <p className="text-sm text-dipallacio-navy-800/60">
        {artigo.autor} · {artigo.publicadoEm?.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
      </p>
      {/* Conteúdo vem apenas do admin (CMS interno), nunca de input de usuário público. */}
      <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
