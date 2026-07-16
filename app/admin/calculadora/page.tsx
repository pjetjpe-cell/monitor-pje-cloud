import { prisma } from '@/lib/prisma/client'
import CalculadoraConfigForm from '@/components/admin/CalculadoraConfigForm'

export default async function AdminCalculadoraPage() {
  const config = await prisma.calculadoraConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  })

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Parâmetros da Calculadora</h1>
      <p className="mt-1 text-sm text-slate-500">
        Editável sem alterar código — afeta todas as simulações feitas pelos clientes a partir de agora.
      </p>
      <div className="mt-6">
        <CalculadoraConfigForm inicial={JSON.parse(JSON.stringify(config))} />
      </div>
    </div>
  )
}
