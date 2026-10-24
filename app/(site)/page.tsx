import Link from 'next/link'
import FotoOuArte from '@/components/site/FotoOuArte'
import { INCORPORADORAS_ALVO, WHATSAPP_LINK } from '@/lib/site/config'
import { formatarCentavos, modoPagamento, precoRelatorioCentavos } from '@/lib/pagamentos/config'

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

const etapasCalculadora = [
  {
    n: '01',
    titulo: 'Informe o básico',
    texto: 'Empreendimento, data da compra e quanto já foi pago. Em 2 minutos, sem cadastro e sem senha.',
  },
  {
    n: '02',
    titulo: 'Veja sua faixa grátis',
    texto: 'Uma estimativa média, corrigida pelo IPCA do IBGE, com cenários conservador e otimista.',
  },
  {
    n: '03',
    titulo: 'Leve o relatório completo',
    texto: 'PDF com memória de cálculo, premissas e cenários para conversar com seu advogado.',
  },
]

const conteudoRelatorio = [
  'Faixa estimada de restituição (mínimo e máximo)',
  'Memória de cálculo pagamento a pagamento, com os números-índice usados',
  'Três cenários de restituição e duas teses de juros',
  'Premissas, fonte do índice (IBGE) e data de referência',
  'Protocolo do relatório e avisos legais claros',
]

export default function HomePage() {
  const pagamentoAtivo = modoPagamento() !== 'desabilitado'
  const preco = formatarCentavos(precoRelatorioCentavos())

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden bg-dipallacio-navy-950 text-white">
        <div className="absolute inset-y-0 right-0 -z-10 hidden w-[58%] lg:block">
          <FotoOuArte slot="hero" alt="" sizes="60vw" prioridade />
          <div className="absolute inset-0 bg-gradient-to-r from-dipallacio-navy-950 via-dipallacio-navy-950/70 to-transparent" />
        </div>
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-dipallacio-navy-950/40 to-dipallacio-navy-950 lg:hidden" />
        <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-24 pt-16 sm:pt-24 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-dipallacio-mint-400/30 bg-dipallacio-mint-400/10 px-3 py-1 text-xs font-medium uppercase tracking-[0.16em] text-dipallacio-mint-300">
              <span className="h-1.5 w-1.5 rounded-full bg-dipallacio-mint-400" aria-hidden />
              Distrato de multipropriedade
            </p>
            <h1 className="mt-6 font-serif text-4xl leading-[1.08] tracking-tight sm:text-6xl">
              Sua cota virou um peso?
              <span className="mt-2 block text-dipallacio-mint-300">Descubra quanto pode voltar para você.</span>
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-white/75">
              Calcule em 2 minutos uma estimativa média da restituição, corrigida pelo IPCA do IBGE. Sem
              cadastro, sem compromisso — e com a clareza que o contrato nunca te deu.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-4">
              <Link
                href="/calculadora"
                className="group inline-flex items-center gap-2 rounded-full bg-dipallacio-mint-400 px-7 py-4 text-sm font-semibold text-dipallacio-navy-950 shadow-luxo transition hover:bg-dipallacio-mint-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                Calcular minha estimativa grátis
                <span aria-hidden className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
              <a
                href={WHATSAPP_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-white/25 px-6 py-4 text-sm font-medium text-white transition hover:bg-white/10"
              >
                Falar com um advogado
              </a>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/65">
              <li className="flex items-center gap-2"><span className="text-dipallacio-mint-400">✓</span> Prévia 100% gratuita</li>
              <li className="flex items-center gap-2"><span className="text-dipallacio-mint-400">✓</span> Índice oficial do IBGE</li>
              <li className="flex items-center gap-2"><span className="text-dipallacio-mint-400">✓</span> Sem promessa de resultado</li>
            </ul>
          </div>

          {/* Cartão ilustrativo do relatório — valores mascarados, nada é prometido */}
          <div className="relative lg:justify-self-end">
            <div className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-luxo backdrop-blur-md sm:p-8 lg:w-[22rem]">
              <p className="text-xs font-medium uppercase tracking-[0.16em] text-dipallacio-mint-300">
                Exemplo ilustrativo do relatório
              </p>
              <p className="mt-4 text-sm text-white/65">Faixa estimada de restituição</p>
              <p className="mt-1 select-none whitespace-nowrap font-serif text-2xl blur-[7px]" aria-hidden>
                R$ 00.000 a R$ 00.000
              </p>
              <p className="sr-only">Valores ocultos neste exemplo.</p>
              <div className="mt-6 space-y-3 text-sm">
                {['Conservador — 50%', 'Intermediário — 75%', 'Otimista — 90%'].map(c => (
                  <div key={c} className="flex items-center justify-between border-t border-white/10 pt-3 text-white/75">
                    <span>{c}</span>
                    <span className="select-none blur-[5px]" aria-hidden>R$ 00.000</span>
                  </div>
                ))}
              </div>
              <p className="mt-6 text-xs text-white/50">
                Os valores reais aparecem para você ao final da calculadora. Estimativa educacional — não é
                garantia de resultado.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Empreendimentos */}
      <section aria-label="Empreendimentos em que atuamos" className="border-b border-dipallacio-navy-800/10 bg-dipallacio-paper">
        <div className="mx-auto max-w-6xl px-4 py-8">
          <p className="text-center text-xs font-medium uppercase tracking-[0.18em] text-dipallacio-navy-800/55">
            Atuação em casos envolvendo
          </p>
          <ul className="mt-4 flex flex-wrap justify-center gap-x-8 gap-y-2 font-serif text-lg text-dipallacio-navy-900/80">
            {INCORPORADORAS_ALVO.map(nome => (
              <li key={nome}>{nome}</li>
            ))}
          </ul>
          <p className="mx-auto mt-4 max-w-2xl text-center text-xs text-dipallacio-navy-800/50">
            Menção apenas para contextualizar a área de atuação — não há parceria, indicação ou vínculo com
            essas empresas.
          </p>
        </div>
      </section>

      {/* Destinos */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <div className="max-w-2xl">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-dipallacio-petrol-600">Férias dos sonhos, contrato de pesadelo</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-dipallacio-navy-900 sm:text-4xl">
            Você comprou tempo de descanso. Não era para virar preocupação.
          </h2>
          <p className="mt-4 text-dipallacio-navy-800/75">
            Muitos cotistas descobrem, depois da venda, retenções elevadas, taxas inesperadas e dificuldade para
            sair do contrato. Entender os números é o primeiro passo para decidir com segurança.
          </p>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-2">
          {[
            { slot: 'porto2life' as const, titulo: 'Porto 2 Life', texto: 'Contratos de multipropriedade que analisamos no escritório.' },
            { slot: 'granvalley' as const, titulo: 'Gran Valley', texto: 'Contratos de multipropriedade que analisamos no escritório.' },
          ].map(item => (
            <article key={item.slot} className="group relative overflow-hidden rounded-3xl bg-dipallacio-navy-900 shadow-suave">
              <div className="aspect-[4/3] transition-transform duration-700 group-hover:scale-[1.03]">
                <FotoOuArte slot={item.slot} alt={`Imagem ilustrativa — ${item.titulo}`} sizes="(min-width: 768px) 50vw, 100vw" />
              </div>
              <div className="absolute inset-0 bg-gradient-to-t from-dipallacio-navy-950/90 via-dipallacio-navy-950/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-6 text-white sm:p-8">
                <h3 className="font-serif text-2xl">{item.titulo}</h3>
                <p className="mt-1 text-sm text-white/75">{item.texto}</p>
                <Link href="/calculadora" className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-dipallacio-mint-300 hover:text-dipallacio-mint-400">
                  Calcular para este empreendimento <span aria-hidden>→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-4 text-xs text-dipallacio-navy-800/50">Imagens ilustrativas. Nomes citados apenas para identificar o contrato analisado.</p>
      </section>

      {/* Como funciona a calculadora */}
      <section className="bg-dipallacio-navy-950 py-24 text-white">
        <div className="mx-auto max-w-6xl px-4">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-dipallacio-mint-300">Calculadora de estimativa</p>
          <h2 className="mt-3 max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">Do “será que vale a pena?” ao número, em três passos.</h2>
          <ol className="mt-12 grid gap-px overflow-hidden rounded-3xl bg-white/10 md:grid-cols-3">
            {etapasCalculadora.map(e => (
              <li key={e.n} className="bg-dipallacio-navy-900 p-8">
                <span className="font-serif text-4xl text-dipallacio-mint-400">{e.n}</span>
                <h3 className="mt-4 font-serif text-xl">{e.titulo}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/70">{e.texto}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Relatório */}
      <section className="mx-auto grid max-w-6xl gap-12 px-4 py-24 lg:grid-cols-2 lg:items-center">
        <div>
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-dipallacio-petrol-600">Relatório detalhado em PDF</p>
          <h2 className="mt-3 font-serif text-3xl leading-tight text-dipallacio-navy-900 sm:text-4xl">
            Cada centavo explicado, por {preco}.
          </h2>
          <p className="mt-4 text-dipallacio-navy-800/75">
            {pagamentoAtivo
              ? 'Depois da prévia gratuita, você pode baixar o relatório completo com a memória de cálculo.'
              : 'A prévia da faixa já é gratuita. O relatório completo em PDF será liberado em breve — deixe seus dados na calculadora e avisamos você.'}
          </p>
          <ul className="mt-8 space-y-3">
            {conteudoRelatorio.map(item => (
              <li key={item} className="flex items-start gap-3 text-sm text-dipallacio-navy-800">
                <span aria-hidden className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-dipallacio-mint-400/25 text-xs text-dipallacio-petrol-700">✓</span>
                {item}
              </li>
            ))}
          </ul>
          <p className="mt-6 text-xs text-dipallacio-navy-800/55">
            O valor de {preco} refere-se somente à emissão do relatório — não são honorários advocatícios e não
            contrata o escritório.
          </p>
          <Link
            href="/calculadora"
            className="mt-8 inline-flex rounded-full bg-dipallacio-navy-900 px-7 py-4 text-sm font-semibold text-white transition hover:bg-dipallacio-navy-800"
          >
            Começar o cálculo
          </Link>
        </div>
        <div className="relative">
          <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-dipallacio-mint-400/30 to-dipallacio-navy-700/20 blur-2xl" />
          <div className="rounded-2xl border border-dipallacio-navy-800/10 bg-white p-8 shadow-luxo">
            <div className="rounded-lg bg-dipallacio-navy-950 p-5 text-white">
              <p className="text-[10px] uppercase tracking-[0.2em] text-dipallacio-mint-300">Di Pallacio Enterprise</p>
              <p className="mt-2 font-serif text-xl">Relatório de estimativa de restituição</p>
            </div>
            <div className="mt-5 space-y-2" aria-hidden>
              {[88, 100, 72, 94, 60].map((w, i) => (
                <div key={i} className="h-2.5 rounded-full bg-dipallacio-navy-800/10" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-center text-[11px] text-dipallacio-navy-800/70" aria-hidden>
              {['Conservador', 'Intermediário', 'Otimista'].map(c => (
                <div key={c} className="rounded-lg border border-dipallacio-navy-800/10 py-4">
                  <div className="mx-auto mb-2 h-2 w-10 rounded-full bg-dipallacio-mint-400/60" />
                  {c}
                </div>
              ))}
            </div>
            <p className="mt-5 text-center text-xs text-dipallacio-navy-800/50">Ilustração da estrutura do relatório</p>
          </div>
        </div>
      </section>

      {/* Situações/dores */}
      <section className="bg-dipallacio-paper py-24">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 lg:grid-cols-[0.8fr_1.2fr]">
          <div>
            <h2 className="font-serif text-3xl leading-tight text-dipallacio-navy-900 sm:text-4xl">Você se identifica com alguma destas situações?</h2>
            <p className="mt-4 text-sm text-dipallacio-navy-800/70">
              Atendemos consumidores em diferentes estágios do problema — de quem só está pesquisando a quem
              já recebeu cobrança ou ameaça de negativação.
            </p>
            <div className="mt-8 hidden aspect-[4/3] overflow-hidden rounded-3xl shadow-suave lg:block">
              <FotoOuArte slot="familia" alt="Imagem ilustrativa de família em momento de lazer" sizes="40vw" />
            </div>
          </div>
          <ul className="grid gap-3 sm:grid-cols-2">
            {situacoes.map(situacao => (
              <li
                key={situacao}
                className="flex items-start gap-3 rounded-2xl border border-dipallacio-navy-800/10 bg-white p-5 text-sm leading-relaxed text-dipallacio-navy-800 shadow-sm"
              >
                <span aria-hidden className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-dipallacio-mint-500" />
                {situacao}
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Como funciona o distrato */}
      <section className="mx-auto max-w-6xl px-4 py-24">
        <h2 className="font-serif text-3xl text-dipallacio-navy-900 sm:text-4xl">Como funciona o distrato com a gente</h2>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {passos.map(passo => (
            <div key={passo.titulo} className="border-t-2 border-dipallacio-mint-500 pt-5">
              <p className="font-serif text-xl text-dipallacio-navy-900">{passo.titulo}</p>
              <p className="mt-2 text-sm leading-relaxed text-dipallacio-navy-800/70">{passo.texto}</p>
            </div>
          ))}
        </div>
        <div className="mt-14 rounded-3xl bg-dipallacio-paper p-8">
          <h3 className="font-serif text-xl text-dipallacio-navy-900">Documentos que analisamos</h3>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {documentos.map(doc => (
              <li key={doc} className="flex items-start gap-3 text-sm text-dipallacio-navy-800">
                <span aria-hidden className="mt-0.5 text-dipallacio-petrol-600">✓</span>
                {doc}
              </li>
            ))}
          </ul>
          <p className="mt-4 text-xs text-dipallacio-navy-800/55">Não se preocupe se não tiver tudo em mãos — a equipe orienta o que é possível reunir em cada etapa.</p>
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 pb-24">
        <h2 className="font-serif text-3xl text-dipallacio-navy-900 sm:text-4xl">Perguntas frequentes</h2>
        <div className="mt-8 divide-y divide-dipallacio-navy-800/10 border-y border-dipallacio-navy-800/10">
          {faq.map(item => (
            <details key={item.pergunta} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-medium text-dipallacio-navy-900 [&::-webkit-details-marker]:hidden">
                {item.pergunta}
                <span aria-hidden className="text-xl text-dipallacio-petrol-600 transition-transform group-open:rotate-45">+</span>
              </summary>
              <p className="mt-3 text-sm leading-relaxed text-dipallacio-navy-800/75">{item.resposta}</p>
            </details>
          ))}
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-4">
        <div className="mx-auto max-w-6xl overflow-hidden rounded-[2rem] bg-dipallacio-navy-950 px-6 py-16 text-center text-white shadow-luxo sm:px-12">
          <h2 className="mx-auto max-w-2xl font-serif text-3xl leading-tight sm:text-4xl">
            Em 2 minutos você sai da dúvida e entra com números na conversa.
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-white/70">
            Sem cadastro. Sem compromisso. A decisão continua sendo sua — agora, bem informada.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-4">
            <Link href="/calculadora" className="rounded-full bg-dipallacio-mint-400 px-7 py-4 text-sm font-semibold text-dipallacio-navy-950 transition hover:bg-dipallacio-mint-300">
              Calcular minha estimativa grátis
            </Link>
            <Link href="/distrato" className="rounded-full border border-white/25 px-7 py-4 text-sm font-medium transition hover:bg-white/10">
              Quero uma análise do meu contrato
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
