import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'
import { prisma } from '@/lib/prisma/client'
import CalculadoraForm from '@/components/portal/CalculadoraForm'

export default async function CalculadoraPage() {
  const session = await getServerSession(authOptions)
  const cotas = await prisma.cota.findMany({
    where: { userId: session!.user.id },
    include: { empreendimento: true },
    orderBy: { createdAt: 'desc' },
  })

  const opcoes = cotas.map(c => ({
    id: c.id,
    label: `${c.empreendimento.nome}${c.unidade ? ' — Unidade ' + c.unidade : ''}`,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-serif text-2xl text-dipallacio-navy-900">Calculadora de Estimativa de Distrato</h2>
        <p className="mt-1 text-sm text-dipallacio-navy-800/70">
          Selecione uma cota cadastrada para simular os cenários de restituição.
        </p>
      </div>
      {opcoes.length === 0 ? (
        <p className="rounded-xl border border-dashed border-dipallacio-navy-800/20 bg-white p-6 text-sm text-dipallacio-navy-800/70">
          Você ainda não tem cotas cadastradas.{' '}
          <a href="/area-do-cliente/minhas-cotas" className="font-medium text-dipallacio-petrol-600 hover:underline">
            Cadastre uma cota
          </a>{' '}
          para simular sua estimativa de distrato.
        </p>
      ) : (
        <CalculadoraForm cotas={opcoes} />
      )}
    </div>
  )
}
