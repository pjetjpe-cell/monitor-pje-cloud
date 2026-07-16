import { prisma } from '@/lib/prisma/client'
import AnunciosModeracao from '@/components/admin/AnunciosModeracao'

export default async function AdminAnunciosPage() {
  const anuncios = await prisma.anuncio.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Moderação de Anúncios</h1>
      <p className="mt-1 text-sm text-slate-500">Aprove, rejeite ou atualize o status de cada anúncio.</p>
      <div className="mt-6">
        <AnunciosModeracao anunciosIniciais={JSON.parse(JSON.stringify(anuncios))} />
      </div>
    </div>
  )
}
