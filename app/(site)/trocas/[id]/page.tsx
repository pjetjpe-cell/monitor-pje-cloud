import { notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma/client'
import LeadForm from '@/components/site/LeadForm'

export default async function PropostaTrocaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const proposta = await prisma.propostaTroca.findUnique({
    where: { id },
    include: { cotaOfertada: { include: { empreendimento: true } } },
  })

  if (!proposta) notFound()

  return (
    <div className="mx-auto max-w-2xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">
        Deseja {proposta.empreendimentoDesejado}
      </h1>
      <p className="mt-2 text-dipallacio-navy-800/70">Período desejado: {proposta.periodoDesejado}</p>

      {proposta.cotaOfertada && (
        <p className="mt-4 text-sm text-dipallacio-navy-800/70">
          Oferece em troca: {proposta.cotaOfertada.empreendimento.nome} —{' '}
          {proposta.cotaOfertada.empreendimento.cidade}/{proposta.cotaOfertada.empreendimento.uf}
        </p>
      )}

      <div className="mt-10 rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
        <h2 className="font-serif text-xl text-dipallacio-navy-900">Tenho interesse nesta troca</h2>
        <p className="mt-2 text-sm text-dipallacio-navy-800/70">
          O contato é mediado pela nossa equipe — não divulgamos dados diretamente entre usuários.
        </p>
        <div className="mt-4">
          <LeadForm
            origem="whatsapp"
            detalhes={{ propostaTrocaId: proposta.id, tipo: 'interesse_troca' }}
          />
        </div>
      </div>
    </div>
  )
}
