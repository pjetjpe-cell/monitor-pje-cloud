import { prisma } from '@/lib/prisma/client'
import ArtigosManager from '@/components/admin/ArtigosManager'

export default async function AdminArtigosPage() {
  const artigos = await prisma.artigo.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Artigos</h1>
      <p className="mt-1 text-sm text-slate-500">CMS simples em Markdown para conteúdo de SEO e FAQ jurídico.</p>
      <div className="mt-6">
        <ArtigosManager iniciais={JSON.parse(JSON.stringify(artigos))} />
      </div>
    </div>
  )
}
