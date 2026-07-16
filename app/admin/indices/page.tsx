import { prisma } from '@/lib/prisma/client'
import IndicesManager from '@/components/admin/IndicesManager'

export default async function AdminIndicesPage() {
  const indices = await prisma.indiceEconomico.findMany({
    orderBy: [{ indice: 'asc' }, { competencia: 'desc' }],
    take: 48,
  })

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Índices de Correção (INCC/IPCA)</h1>
      <p className="mt-1 text-sm text-slate-500">
        Série mensal usada pela calculadora de distrato. Atualize sempre que o IBGE/FGV publicar novos
        números-índice.
      </p>
      <div className="mt-6">
        <IndicesManager iniciais={JSON.parse(JSON.stringify(indices))} />
      </div>
    </div>
  )
}
