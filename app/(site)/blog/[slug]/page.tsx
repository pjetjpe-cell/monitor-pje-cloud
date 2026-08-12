import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { marked } from 'marked'
import { prisma } from '@/lib/prisma/client'
import { NOME_ESCRITORIO_CURTO } from '@/lib/site/config'
import { extrairResumo, removerPrimeiroTitulo } from '@/lib/site/markdown'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>
}): Promise<Metadata> {
  const { slug } = await params
  const artigo = await prisma.artigo.findUnique({ where: { slug } })
  if (!artigo || !artigo.publicadoEm) return {}

  return {
    title: `${artigo.titulo} — ${NOME_ESCRITORIO_CURTO}`,
    description: extrairResumo(artigo.conteudoMarkdown),
  }
}

export default async function ArtigoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const artigo = await prisma.artigo.findUnique({ where: { slug } })

  if (!artigo || !artigo.publicadoEm) notFound()

  const html = marked.parse(removerPrimeiroTitulo(artigo.conteudoMarkdown), { async: false }) as string

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900 sm:text-4xl">{artigo.titulo}</h1>
      <p className="mt-3 text-sm text-dipallacio-navy-800/60">
        {artigo.autor} · {artigo.publicadoEm?.toLocaleDateString('pt-BR', { timeZone: 'UTC' })}
      </p>
      {/* Conteúdo vem apenas do admin (CMS interno), nunca de input de usuário público. */}
      <div className="prose prose-slate mt-6 max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  )
}
