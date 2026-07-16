import { prisma } from '@/lib/prisma/client'
import LeadsTable from '@/components/admin/LeadsTable'

export default async function AdminLeadsPage() {
  const leads = await prisma.lead.findMany({ orderBy: { createdAt: 'desc' } })

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Leads</h1>
      <p className="mt-1 text-sm text-slate-500">Funil: novo → em análise → contatado → convertido/perdido.</p>
      <div className="mt-6">
        <LeadsTable leadsIniciais={JSON.parse(JSON.stringify(leads))} />
      </div>
    </div>
  )
}
