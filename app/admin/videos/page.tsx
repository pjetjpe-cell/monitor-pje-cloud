import { prisma } from '@/lib/prisma/client'
import VideosManager from '@/components/admin/VideosManager'

export default async function AdminVideosPage() {
  const videos = await prisma.video.findMany({ orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }] })

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Vídeos</h1>
      <p className="mt-1 text-sm text-slate-500">Apenas a URL/ID do vídeo é armazenado — nunca o conteúdo.</p>
      <div className="mt-6">
        <VideosManager iniciais={JSON.parse(JSON.stringify(videos))} />
      </div>
    </div>
  )
}
