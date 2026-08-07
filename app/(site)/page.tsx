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
    titulo: 'Consulta inicial',
    texto: 'Você conta seu caso e envia os documentos do contrato — sem custo e sem compromisso.',
  },
  {
    titulo: 'Análise jurídica',
    texto: 'Nossa equipe avalia as cláusulas do contrato, os valores pagos e o histórico do empreendimento.',
  },
  {
    titulo: 'Estratégia e ação',
    texto: 'Definimos a tese mais adequada ao seu caso e ingressamos com a ação de distrato.',
  },
  {
    titulo: 'Acompanhamento',
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
      <section className="dp-hero-pattern relative overflow-hidden bg-gradient-to-b from-dipallacio-navy-950 to-dipallacio-navy-900 text-white">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 lg:grid-cols-2 lg:items-center lg:py-28">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full border border-dipallacio-gold/30 bg-white/5 px-3 py-1 text-xs font-medium uppercase tracking-wide text-dipallacio-gold">
              <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-dipallacio-gold" />
              Especialistas em multipropriedade
            </span>
            <h1 className="mt-5 font-serif text-4xl leading-tight sm:text-5xl">
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
                href="/area-do-cliente/calculadora"
                className="rounded-full bg-dipallacio-gold px-6 py-3 text-sm font-semibold text-dipallacio-navy-950 shadow-lg shadow-black/20 transition-transform hover:scale-105"
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
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-2 text-sm text-dipallacio-cream/70">
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3l7 3v5c0 4.6-2.9 8-7 10-4.1-2-7-5.4-7-10V6l7-3z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M8.5 12l2.2 2.2 4.8-5" />
                </svg>
                Análise individualizada
              </span>
              <span className="inline-flex items-center gap-2">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v18M7 21h10M4 7h16M6 7l-3 6h6L6 7zM18 7l-3 6h6l-3-6z" />
                </svg>
                Orientação jurídica responsável
              </span>
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
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

      {/* Barra comercial */}
      <section className="border-b border-dipallacio-navy-800/10 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-dipallacio-petrol-600">
              Condição de atendimento
            </p>
            <p className="font-serif text-lg text-dipallacio-navy-900">
              Sem entrada antes do início do processo
            </p>
          </div>
          <p className="max-w-xl text-sm text-dipallacio-navy-800/70">
            A análise inicial do seu contrato é gratuita. As condições de honorários são apresentadas por
            escrito antes de qualquer providência.
          </p>
        </div>
      </section>

      {/* Situações/dores */}
      <section className="bg-dipallacio-petrol-700/5 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-dipallacio-petrol-600">
            Um caminho objetivo
          </p>
          <h2 className="mt-2 font-serif text-3xl text-dipallacio-navy-900">
            Você se identifica com alguma dessas situações?
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-dipallacio-navy-800/70">
            Atendemos consumidores em diferentes estágios do problema — desde quem só está pesquisando até
            quem já recebeu cobrança ou ameaça de negativação.
          </p>
          <ul className="mt-8 grid gap-3 sm:grid-cols-2">
            {situacoes.map(situacao => (
              <li
                key={situacao}
                className="dp-card-hover flex items-start gap-3 rounded-lg border border-dipallacio-navy-800/10 bg-white p-4 text-sm text-dipallacio-navy-800"
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
        <p className="text-xs font-semibold uppercase tracking-wide text-dipallacio-petrol-600">
          Do primeiro documento à decisão final
        </p>
        <h2 className="mt-2 font-serif text-3xl text-dipallacio-navy-900">Como funciona o distrato</h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map((passo, i) => (
            <div
              key={passo.titulo}
              className="dp-card-hover relative rounded-xl border border-dipallacio-navy-800/10 bg-white p-6"
            >
              <span className="font-serif text-3xl text-dipallacio-gold/40">
                {String(i + 1).padStart(2, '0')}
              </span>
              <p className="mt-2 font-serif text-lg text-dipallacio-navy-900">{passo.titulo}</p>
              <p className="mt-2 text-sm text-dipallacio-navy-800/70">{passo.texto}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Duas frentes complementares */}
      <section className="bg-dipallacio-petrol-700/5 py-20">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-dipallacio-petrol-600">
            Duas frentes complementares
          </p>
          <h2 className="mt-2 font-serif text-3xl text-dipallacio-navy-900">
            Nem todo caso pede a mesma solução.
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-dipallacio-navy-800/70">
            O contrato, a situação da cota e seu objetivo pessoal ajudam a definir qual caminho merece ser
            estudado.
          </p>
          <div className="mt-8 grid gap-6 sm:grid-cols-2">
            <div className="dp-card-hover rounded-2xl border border-dipallacio-navy-800/10 bg-white p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dipallacio-navy-900 text-dipallacio-gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 3h9l5 5v12H5z" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14 3v5h5M8 12h6M8 16h4" />
                </svg>
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-dipallacio-petrol-600">
                Frente jurídica
              </p>
              <p className="mt-1 font-serif text-xl text-dipallacio-navy-900">Distrato e restituição</p>
              <p className="mt-2 text-sm text-dipallacio-navy-800/70">
                Análise de cláusulas, retenções, corretagem, atualização monetária e demais pontos do
                contrato.
              </p>
              <Link
                href="/distrato"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-dipallacio-petrol-600 hover:text-dipallacio-petrol-700"
              >
                Entender o distrato
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
            <div className="dp-card-hover rounded-2xl border border-dipallacio-navy-800/10 bg-white p-8">
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-dipallacio-navy-900 text-dipallacio-gold">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 10v10h16V10M3 10l2-6h14l2 6" />
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 10c0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0 0 2 3 2 3 0" />
                </svg>
              </span>
              <p className="mt-4 text-xs font-semibold uppercase tracking-wide text-dipallacio-petrol-600">
                Mercado secundário
              </p>
              <p className="mt-1 font-serif text-xl text-dipallacio-navy-900">Venda, aluguel ou troca</p>
              <p className="mt-2 text-sm text-dipallacio-navy-800/70">
                Uma vitrine mediada para anunciar sua cota, sem expor seus dados pessoais entre
                interessados.
              </p>
              <Link
                href="/venda-de-cotas"
                className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-dipallacio-petrol-600 hover:text-dipallacio-petrol-700"
              >
                Explorar oportunidades
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Documentos */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <h2 className="font-serif text-3xl text-dipallacio-navy-900">Documentos que analisamos</h2>
        <p className="mt-2 max-w-2xl text-sm text-dipallacio-navy-800/70">
          Não se preocupe se não tiver tudo em mãos — a equipe orienta você sobre o que é possível reunir
          em cada etapa.
        </p>
        <ul className="mt-8 grid gap-4 sm:grid-cols-2">
          {documentos.map(doc => (
            <li
              key={doc}
              className="dp-card-hover flex items-start gap-3 rounded-lg border border-dipallacio-navy-800/10 bg-white p-4 text-sm text-dipallacio-navy-800"
            >
              <span aria-hidden className="mt-0.5 text-dipallacio-petrol-600">✓</span>
              {doc}
            </li>
          ))}
        </ul>
      </section>

      {/* Prova social qualitativa */}
      <section className="bg-dipallacio-petrol-700/5 px-4 py-20 text-center">
        <p className="mx-auto max-w-2xl font-serif text-2xl text-dipallacio-navy-900 sm:text-3xl">
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
      <section className="mx-auto max-w-3xl px-4 py-20">
        <h2 className="font-serif text-3xl text-dipallacio-navy-900">Perguntas frequentes</h2>
        <p className="mt-2 text-sm text-dipallacio-navy-800/70">
          Respostas gerais não substituem a análise do contrato, mas ajudam você a organizar os próximos
          passos.
        </p>
        <div className="mt-8 space-y-3">
          {faq.map(item => (
            <details
              key={item.pergunta}
              className="group rounded-lg border border-dipallacio-navy-800/10 bg-white p-4 open:border-dipallacio-gold/40"
            >
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 font-medium text-dipallacio-navy-900">
                {item.pergunta}
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  aria-hidden="true"
                  className="shrink-0 text-dipallacio-gold transition-transform group-open:rotate-45"
                >
                  <path strokeLinecap="round" d="M12 5v14M5 12h14" />
                </svg>
              </summary>
              <p className="mt-3 text-sm text-dipallacio-navy-800/70">{item.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="bg-gradient-to-r from-dipallacio-navy-950 to-dipallacio-navy-900">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-4 py-16 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-dipallacio-gold">
              Comece pelo documento certo
            </p>
            <h2 className="mt-2 font-serif text-2xl text-white sm:text-3xl">
              Envie seu contrato para uma análise inicial.
            </h2>
          </div>
          <Link
            href="/distrato"
            className="shrink-0 rounded-full bg-dipallacio-gold px-6 py-3 text-sm font-semibold text-dipallacio-navy-950 shadow-lg shadow-black/20 transition-transform hover:scale-105"
          >
            Solicitar análise
          </Link>
        </div>
      </section>
    </div>
  )
}
