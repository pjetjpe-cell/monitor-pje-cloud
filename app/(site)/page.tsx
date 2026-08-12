import Link from 'next/link'
import { INCORPORADORAS_ALVO } from '@/lib/site/config'

const situacoes = [
  'Quero cancelar o contrato e não sei como',
  'A retenção cobrada pela incorporadora parece excessiva',
  'Continuo sendo cobrado mesmo após pedir o distrato',
  'Recebi ameaça de negativação nos órgãos de proteção ao crédito',
  'A promessa comercial feita na venda não foi cumprida',
  'Fui obrigado a contratar produtos ou serviços casados com a compra',
  'Há restrição para eu alugar a cota fora da administradora',
  'A obra atrasou e o empreendimento não foi entregue no prazo',
  'Tenho dificuldade para revender ou até usar a cota',
  'Tenho dúvidas sobre comissão de corretagem, taxas e condomínio',
]

const passos = [
  {
    titulo: '1. Consulta inicial',
    texto: 'Você conta seu caso e envia os documentos do contrato — sem custo e sem compromisso.',
  },
  {
    titulo: '2. Análise jurídica',
    texto: 'Nossa equipe avalia as cláusulas do contrato, os valores pagos e o histórico do empreendimento.',
  },
  {
    titulo: '3. Estratégia e ação',
    texto: 'Definimos a tese mais adequada ao seu caso e ingressamos com a ação de distrato.',
  },
  {
    titulo: '4. Acompanhamento',
    texto: 'Você acompanha o andamento do processo e recebe atualizações da equipe jurídica.',
  },
]

const documentos = [
  'Contrato de compra e venda ou de adesão à multipropriedade',
  'Comprovantes de pagamento (boletos, recibos, extratos)',
  'Comunicações trocadas com a incorporadora ou administradora',
  'Documentos pessoais (RG/CPF ou CNH)',
]

const faq = [
  {
    pergunta: 'Tenho direito a receber de volta o que já paguei?',
    resposta:
      'Em geral, sim — a legislação prevê a possibilidade de restituição em caso de desistência ou rescisão, mas o percentual devolvido depende das circunstâncias do contrato e do entendimento do juízo responsável.',
  },
  {
    pergunta: 'Quanto tempo demora um processo de distrato?',
    resposta:
      'Varia conforme a comarca, a vara e a complexidade do caso. Por isso trabalhamos sempre com estimativas de prazo, nunca com promessas fechadas.',
  },
  {
    pergunta: 'Preciso estar em dia com as parcelas para pedir o distrato?',
    resposta:
      'Não necessariamente — cada situação exige uma análise específica do contrato e do histórico de pagamentos.',
  },
  {
    pergunta: 'A consulta inicial tem custo?',
    resposta: 'Não. A primeira análise do seu caso é gratuita e sem compromisso.',
  },
  {
    pergunta: 'Recebi ameaça de negativação — o que eu faço?',
    resposta:
      'Nos envie a comunicação recebida o quanto antes. Cada caso exige uma análise específica sobre a exigibilidade do valor cobrado e as medidas cabíveis.',
  },
  {
    pergunta: 'Fui obrigado a contratar corretagem ou outros produtos junto com a cota — isso é normal?',
    resposta:
      'A chamada "venda casada" e a cobrança de taxas como a SATI são pontos frequentemente discutidos em ações de multipropriedade. Analisamos o seu contrato para verificar se há abusividade.',
  },
  {
    pergunta: 'Que documentos preciso ter em mãos para começar?',
    resposta:
      'Para uma primeira análise, basta informar a data da compra e o total pago. Contrato, aditivos, extratos e comunicações com a empresa permitem uma análise mais completa, mas não são obrigatórios de início.',
  },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-b from-dipallacio-navy-950 to-dipallacio-navy-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-dipallacio-gold">
              Distrato de multipropriedade
            </p>
            <h1 className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
              Comprou multipropriedade e quer sair do contrato?
              <br />
              <span className="text-dipallacio-gold">Saiba se você tem direito a receber de volta.</span>
            </h1>
            <p className="mt-6 max-w-xl text-dipallacio-cream/80">
              Atuação especializada em ações contra grandes incorporadoras de multipropriedade —
              discutimos cláusulas abusivas de retenção, comissão de corretagem, correção monetária e
              juros.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/distrato#formulario"
                className="rounded-full bg-dipallacio-gold px-6 py-3 text-sm font-semibold text-dipallacio-navy-950 transition-transform hover:scale-105"
              >
                Simular minha restituição
              </Link>
              <Link
                href="/distrato"
                className="rounded-full border border-white/30 px-6 py-3 text-sm font-medium text-white transition-colors hover:bg-white/10"
              >
                Quero fazer distrato
              </Link>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
            <p className="font-serif text-lg text-white">Nossa atuação</p>
            <ul className="mt-4 space-y-3 text-sm text-dipallacio-cream/80">
              <li>• Rescisão contratual (distrato) com pedido de restituição de valores pagos</li>
              <li>• Discussão de cláusulas abusivas de retenção (multa contratual)</li>
              <li>• Comissão de corretagem, SATI, correção monetária e juros</li>
              <li>• Intermediação de venda e troca de cotas entre particulares</li>
            </ul>
          </div>
        </div>
      </section>

      {/* Situações/dores */}
      <section className="bg-dipallacio-petrol-700/5 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-serif text-3xl text-dipallacio-navy-900">Você se identifica com alguma dessas situações?</h2>
          <p className="mt-2 max-w-2xl text-sm text-dipallacio-navy-800/70">
            Atendemos consumidores em diferentes estágios do problema — desde quem só está pesquisando até
            quem já recebeu cobrança ou ameaça de negativação.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {situacoes.map(situacao => (
              <li
                key={situacao}
                className="flex items-start gap-3 rounded-lg border border-dipallacio-navy-800/10 bg-white p-4 text-sm text-dipallacio-navy-800"
              >
                <span aria-hidden className="mt-0.5 text-dipallacio-gold">•</span>
                {situacao}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Como funciona */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-serif text-3xl text-dipallacio-navy-900">Como funciona o distrato</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map(passo => (
            <div key={passo.titulo} className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
              <p className="font-serif text-lg text-dipallacio-navy-900">{passo.titulo}</p>
              <p className="mt-2 text-sm text-dipallacio-navy-800/70">{passo.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Documentos */}
      <section className="bg-dipallacio-petrol-700/5 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="font-serif text-3xl text-dipallacio-navy-900">Documentos que analisamos</h2>
          <p className="mt-2 max-w-2xl text-sm text-dipallacio-navy-800/70">
            Não se preocupe se não tiver tudo em mãos — a equipe orienta você sobre o que é possível
            reunir em cada etapa.
          </p>
          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {documentos.map(doc => (
              <li
                key={doc}
                className="flex items-start gap-3 rounded-lg border border-dipallacio-navy-800/10 bg-white p-4 text-sm text-dipallacio-navy-800"
              >
                <span aria-hidden className="mt-0.5 text-dipallacio-petrol-600">✓</span>
                {doc}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Prova social qualitativa */}
      <section className="mx-auto max-w-6xl px-4 py-20 text-center">
        <p className="font-serif text-2xl text-dipallacio-navy-900 sm:text-3xl">
          Atuação especializada em ações contra grandes incorporadoras de multipropriedade
        </p>
        <p className="mx-auto mt-4 max-w-2xl text-sm text-dipallacio-navy-800/70">
          Acompanhamos de perto as mudanças na jurisprudência sobre distrato de multipropriedade para
          construir a estratégia mais adequada a cada caso, incluindo ações relacionadas a empreendimentos
          como:
        </p>
        <ul className="mx-auto mt-6 flex max-w-3xl flex-wrap justify-center gap-2">
          {INCORPORADORAS_ALVO.map(nome => (
            <li
              key={nome}
              className="rounded-full border border-dipallacio-navy-800/15 bg-white px-4 py-1.5 text-sm text-dipallacio-navy-800"
            >
              {nome}
            </li>
          ))}
        </ul>
        <p className="mx-auto mt-4 max-w-2xl text-xs text-dipallacio-navy-800/50">
          Menção aos empreendimentos apenas para contextualizar a área de atuação — não representa
          parceria, indicação ou vínculo com essas empresas.
        </p>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-20">
        <h2 className="font-serif text-3xl text-dipallacio-navy-900">Perguntas frequentes</h2>
        <div className="mt-8 space-y-3">
          {faq.map(item => (
            <details
              key={item.pergunta}
              className="group rounded-lg border border-dipallacio-navy-800/10 bg-white p-4"
            >
              <summary className="cursor-pointer list-none font-medium text-dipallacio-navy-900">
                {item.pergunta}
              </summary>
              <p className="mt-3 text-sm text-dipallacio-navy-800/70">{item.resposta}</p>
            </details>
          ))}
        </div>
      </section>
    </div>
  )
}
