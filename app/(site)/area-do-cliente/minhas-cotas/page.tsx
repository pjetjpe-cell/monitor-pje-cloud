import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import CotasManager from '@/components/portal/CotasManager'

export default async function MinhasCotasPage() {
  const session = await getServerSession(authOptions)

  const [cotas, empreendimentos] = await Promise.all([
    prisma.cota.findMany({
      where: { userId: session!.user.id },
      include: { empreendimento: true, pagamentos: { orderBy: { data: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.empreendimento.findMany({ orderBy: { nome: 'asc' } }),
  ])

  return (
    <CotasManager
      cotasIniciais={JSON.parse(JSON.stringify(cotas))}
      empreendimentos={JSON.parse(JSON.stringify(empreendimentos))}
    />
  )
}
