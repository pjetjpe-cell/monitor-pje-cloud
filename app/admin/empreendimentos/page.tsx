import { prisma } from '@/lib/prisma/client'
import EmpreendimentosManager from '@/components/admin/EmpreendimentosManager'

export default async function AdminEmpreendimentosPage() {
  const empreendimentos = await prisma.empreendimento.findMany({ orderBy: { nome: 'asc' } })

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Empreendimentos</h1>
      <p className="mt-1 text-sm text-slate-500">
        Cadastro base usado nas cotas dos clientes e na calculadora de distrato.
      </p>
      <div className="mt-6">
        <EmpreendimentosManager iniciais={JSON.parse(JSON.stringify(empreendimentos))} />
      </div>
    </div>
  )
}
