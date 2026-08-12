import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import LeadForm from '@/components/site/LeadForm'
import { NOME_ESCRITORIO_CURTO } from '@/lib/site/config'

function formatarMoeda(v: number) {
  return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>
}): Promise<Metadata> {
  const { id } = await params
  const anuncio = await prisma.anuncio.findUnique({ where: { id } })
  if (!anuncio || anuncio.status !== 'aprovado') return {}

  return {
    title: `${anuncio.titulo} — ${NOME_ESCRITORIO_CURTO}`,
    description: anuncio.descricao.slice(0, 155),
  }
}

export default async function AnuncioPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const anuncio = await prisma.anuncio.findUnique({
    where: { id },
    include: { cota: { include: { empreendimento: true } } },
  })

  if (!anuncio || anuncio.status !== 'aprovado') notFound()

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">{anuncio.titulo}</h1>
      {anuncio.cota && (
        <p className="mt-2 text-dipallacio-navy-800/70">
          {anuncio.cota.empreendimento.nome} — {anuncio.cota.empreendimento.cidade}/
          {anuncio.cota.empreendimento.uf}
          {anuncio.cota.fracaoTempo && ` · ${anuncio.cota.fracaoTempo}`}
        </p>
      )}
      <p className="mt-6 font-serif text-3xl text-dipallacio-navy-900">
        {formatarMoeda(Number(anuncio.precoPedido))}
      </p>
      <p className="mt-6 whitespace-pre-line text-dipallacio-navy-800/80">{anuncio.descricao}</p>

      <div className="mt-10 rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
        <h2 className="font-serif text-xl text-dipallacio-navy-900">Tenho interesse</h2>
        <p className="mt-2 text-sm text-dipallacio-navy-800/70">
          Por segurança, o contato entre comprador e vendedor é sempre mediado pela nossa equipe — não
          divulgamos e-mail ou telefone diretamente.
        </p>
        <div className="mt-4">
          <LeadForm
            origem="whatsapp"
            detalhes={{ anuncioId: anuncio.id, anuncioTitulo: anuncio.titulo, tipo: 'interesse_marketplace' }}
          />
        </div>
      </div>
    </div>
  )
}
