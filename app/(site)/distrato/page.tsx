import LeadForm from '@/components/site/LeadForm'
import Disclaimer from '@/components/site/Disclaimer'

export const metadata = {
  title: 'Quero fazer distrato — Di Pallacio Enterprise',
}

export default function DistratoPage() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16">
      <div className="grid gap-12 lg:grid-cols-2">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-dipallacio-petrol-600">
            Distrato de multipropriedade
          </p>
          <h1 className="mt-2 font-serif text-4xl text-dipallacio-navy-900">Quero fazer distrato</h1>

          <div className="prose prose-sm mt-6 max-w-none text-dipallacio-navy-800/80">
            <p>
              A <strong>Lei 13.786/2018</strong> (Lei do Distrato) regula a resolução de contratos de
              incorporação imobiliária e loteamento, prevendo hipóteses de rescisão e restituição de
              valores pagos. Em paralelo, o <strong>Código de Defesa do Consumidor (CDC)</strong> e a{' '}
              <strong>Súmula 543 do STJ</strong> orientam a devolução de valores em contratos
              desfeitos, especialmente quando há cláusulas consideradas abusivas.
            </p>
            <p>
              No caso da multipropriedade, um dos pontos mais discutidos é a{' '}
              <strong>multa de retenção</strong>, prevista no art. 67-A, §5º, da Lei 4.591/64, que pode
              chegar a 50% dos valores pagos — percentual que a jurisprudência frequentemente reduz por
              considerá-lo excessivo diante das circunstâncias do caso concreto.
            </p>
            <p>
              Também analisamos a <strong>comissão de corretagem</strong>, taxas como a{' '}
              <strong>SATI</strong>, e os critérios de <strong>correção monetária e juros</strong>{' '}
              aplicáveis aos valores pagos ao longo do contrato.
            </p>
          </div>

          <div className="mt-6">
            <Disclaimer compact />
          </div>
        </div>

        <div className="rounded-2xl border border-dipallacio-navy-800/10 bg-white p-6">
          <h2 className="font-serif text-xl text-dipallacio-navy-900">Fale com a equipe jurídica</h2>
          <p className="mt-2 text-sm text-dipallacio-navy-800/70">
            Conte um pouco sobre o seu caso. A análise inicial é gratuita e sem compromisso.
          </p>
          <div className="mt-6">
            <LeadForm origem="form_distrato" />
          </div>
        </div>
      </div>
    </div>
  )
}
