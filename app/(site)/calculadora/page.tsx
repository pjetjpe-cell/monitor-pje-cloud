import type { Metadata } from 'next'
import FotoOuArte from '@/components/site/FotoOuArte'
import Disclaimer from '@/components/site/Disclaimer'
import CalculadoraPublica from '@/components/calculadora/CalculadoraPublica'

export const metadata: Metadata = {
  title: 'Calculadora de distrato de multipropriedade — estimativa grátis',
  description:
    'Calcule em 2 minutos uma estimativa média da restituição do seu distrato de multipropriedade, corrigida pelo IPCA do IBGE. Prévia gratuita e relatório detalhado em PDF.',
}

export default function CalculadoraPage() {
  return (
    <div>
      <section className="relative isolate overflow-hidden bg-dipallacio-navy-950 text-white">
        <div className="absolute inset-0 -z-10 opacity-60">
          <FotoOuArte slot="calculadora" alt="" sizes="100vw" prioridade />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-dipallacio-navy-950/70 to-dipallacio-navy-950" />
        <div className="mx-auto max-w-4xl px-4 pb-28 pt-16 sm:pt-24">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-dipallacio-mint-300">Calculadora de estimativa</p>
          <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">Quanto pode voltar para você?</h1>
          <p className="mt-5 max-w-2xl text-lg leading-relaxed text-white/75">
            Informe o básico da sua compra e veja uma faixa estimada, corrigida pelo IPCA do IBGE. A prévia é grátis e
            não pede cadastro.
          </p>
        </div>
      </section>

      <div className="relative z-10 mx-auto -mt-16 max-w-4xl space-y-8 px-4 pb-8">
        <CalculadoraPublica />
        <Disclaimer />
      </div>
    </div>
  )
}
