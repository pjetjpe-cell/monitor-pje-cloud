import { prisma } from '@/lib/prisma/client'

export default async function AdminDashboard() {
  const [leadsNovos, anunciosPendentes, empreendimentos, cotas] = await Promise.all([
    prisma.lead.count({ where: { status: 'novo' } }),
    prisma.anuncio.count({ where: { status: 'pendente' } }),
    prisma.empreendimento.count(),
    prisma.cota.count(),
  ])

  const cards = [
    { label: 'Leads novos', valor: leadsNovos, href: '/admin/leads' },
    { label: 'Anúncios pendentes', valor: anunciosPendentes, href: '/admin/anuncios' },
    { label: 'Empreendimentos', valor: empreendimentos, href: '/admin/empreendimentos' },
    { label: 'Cotas cadastradas', valor: cotas, href: '/admin/empreendimentos' },
  ]

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Visão geral</h1>
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map(card => (
          <div key={card.label} className="rounded-xl border border-slate-200 bg-white p-6">
            <p className="text-sm text-slate-500">{card.label}</p>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{card.valor}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
