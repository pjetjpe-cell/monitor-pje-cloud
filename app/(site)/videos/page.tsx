import { prisma } from '@/lib/prisma/client'

export const metadata = {
  title: 'Vídeos — Di Pallacio Enterprise',
}

export const dynamic = 'force-dynamic'

export default async function VideosPage() {
  const videos = await prisma.video.findMany({ orderBy: [{ categoria: 'asc' }, { ordem: 'asc' }] })

  const categorias = Array.from(new Set(videos.map(v => v.categoria)))

  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Central de Vídeos</h1>
      <p className="mt-2 max-w-2xl text-sm text-dipallacio-navy-800/70">
        Conteúdo educativo sobre direitos do consumidor em multipropriedade.
      </p>

      {categorias.length === 0 ? (
        <p className="mt-8 text-sm text-dipallacio-navy-800/60">Nenhum vídeo publicado ainda.</p>
      ) : (
        categorias.map(categoria => (
          <section key={categoria} className="mt-10">
            <h2 className="font-serif text-xl text-dipallacio-navy-900">{categoria}</h2>
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {videos
                .filter(v => v.categoria === categoria)
                .map(video => (
                  <div key={video.id} className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-4">
                    <div className="aspect-video overflow-hidden rounded-lg bg-dipallacio-navy-900/5">
                      <iframe
                        src={video.urlEmbed}
                        title={video.titulo}
                        className="h-full w-full"
                        allowFullScreen
                      />
                    </div>
                    <p className="mt-3 font-medium text-dipallacio-navy-900">{video.titulo}</p>
                    <p className="mt-1 text-sm text-dipallacio-navy-800/60">{video.descricao}</p>
                  </div>
                ))}
            </div>
          </section>
        ))
      )}
    </div>
  )
}
