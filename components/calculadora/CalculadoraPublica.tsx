'use client'

import { useEffect, useMemo, useState } from 'react'
import { upload } from '@vercel/blob/client'
import { parseMoeda, formatarReais } from '@/lib/calculadora/moeda'
import { INCORPORADORAS_ALVO, whatsappEscritorio } from '@/lib/site/config'

type Modo = 'rapido' | 'detalhado'
interface Parcela {
  id: number
  data: string
  valor: string
}
interface Previa {
  faixa: { minimo: number; maximo: number }
  totalPagoInformado: number
  mesesEstimados: number
  dataReferencia: string
}
interface Status {
  disponivel: boolean
  motivo: string | null
  pagamentoDisponivel: boolean
  precoCentavos: number
}

const TAMANHO_MAXIMO_ANEXO = 10 * 1024 * 1024
const TIPOS_ANEXO = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp']

const campo =
  'w-full rounded-xl border border-dipallacio-navy-800/20 bg-white px-4 py-3 text-sm text-dipallacio-navy-900 shadow-sm transition focus:border-dipallacio-petrol-600 focus:outline-none focus:ring-2 focus:ring-dipallacio-mint-400/40'
const rotulo = 'mb-1.5 block text-sm font-medium text-dipallacio-navy-800'

function hojeIso() {
  return new Date().toISOString().slice(0, 10)
}

export default function CalculadoraPublica() {
  const [status, setStatus] = useState<Status | null>(null)
  const [modo, setModo] = useState<Modo>('rapido')
  const [empreendimento, setEmpreendimento] = useState('')
  const [dataCompra, setDataCompra] = useState('')
  const [totalPago, setTotalPago] = useState('')
  const [dataUltimo, setDataUltimo] = useState('')
  const [parcelas, setParcelas] = useState<Parcela[]>([{ id: 1, data: '', valor: '' }])
  const [teveCorretagem, setTeveCorretagem] = useState(false)
  const [corretagem, setCorretagem] = useState('')
  const [incluirCorretagem, setIncluirCorretagem] = useState(false)

  const [previa, setPrevia] = useState<Previa | null>(null)
  const [calculando, setCalculando] = useState(false)
  const [erro, setErro] = useState('')

  const [nome, setNome] = useState('')
  const [email, setEmail] = useState('')
  const [whatsapp, setWhatsapp] = useState('')
  const [numeroCota, setNumeroCota] = useState('')
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState('')
  const [aceite, setAceite] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erroEnvio, setErroEnvio] = useState('')
  const [concluido, setConcluido] = useState(false)

  useEffect(() => {
    fetch('/api/calculadora/status')
      .then(r => r.json())
      .then(setStatus)
      .catch(() => setStatus({ disponivel: false, motivo: 'Calculadora indisponível no momento.', pagamentoDisponivel: false, precoCentavos: 990 }))
  }, [])

  const preco = useMemo(
    () => ((status?.precoCentavos ?? 990) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }),
    [status]
  )

  /** Monta a entrada validando o que dá para validar no navegador (o servidor revalida tudo). */
  function montarEntrada(): { entrada: Record<string, unknown> } | { erro: string } {
    if (empreendimento.trim().length < 2) return { erro: 'Informe o empreendimento.' }
    if (!dataCompra) return { erro: 'Informe a data da compra.' }

    const base: Record<string, unknown> = { empreendimento: empreendimento.trim(), modo, dataCompra }
    if (teveCorretagem) {
      const c = parseMoeda(corretagem)
      if (c === null) return { erro: 'Informe o valor da comissão de corretagem (ou desmarque a opção).' }
      base.valorCorretagem = c
      base.incluirCorretagem = incluirCorretagem
    }

    if (modo === 'rapido') {
      const total = parseMoeda(totalPago)
      if (total === null) return { erro: 'Informe o total já pago, por exemplo 18.500,00.' }
      base.totalPago = total
      if (dataUltimo) base.dataUltimoPagamento = dataUltimo
    } else {
      const lista = []
      for (const [i, p] of parcelas.entries()) {
        const v = parseMoeda(p.valor)
        if (!p.data || v === null) return { erro: `Preencha a data e o valor do pagamento ${i + 1}.` }
        lista.push({ data: p.data, valor: v })
      }
      base.parcelas = lista
    }
    return { entrada: base }
  }

  async function calcular(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const m = montarEntrada()
    if ('erro' in m) return setErro(m.erro)

    setCalculando(true)
    try {
      const res = await fetch('/api/calculadora/previa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(m.entrada),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) return setErro(dados.error ?? 'Não foi possível calcular agora.')
      setPrevia(dados)
      requestAnimationFrame(() => document.getElementById('resultado')?.scrollIntoView({ behavior: 'smooth', block: 'start' }))
    } catch {
      setErro('Falha de conexão. Verifique sua internet e tente de novo.')
    } finally {
      setCalculando(false)
    }
  }

  function escolherArquivo(ev: React.ChangeEvent<HTMLInputElement>) {
    const f = ev.target.files?.[0] ?? null
    setErroArquivo('')
    if (!f) return setArquivo(null)
    if (!TIPOS_ANEXO.includes(f.type)) {
      ev.target.value = ''
      setArquivo(null)
      return setErroArquivo('Envie PDF, JPG, PNG ou WebP.')
    }
    if (f.size > TAMANHO_MAXIMO_ANEXO) {
      ev.target.value = ''
      setArquivo(null)
      return setErroArquivo('O arquivo deve ter no máximo 10 MB.')
    }
    setArquivo(f)
  }

  async function enviar(e: React.FormEvent) {
    e.preventDefault()
    setErroEnvio('')
    const m = montarEntrada()
    if ('erro' in m) return setErroEnvio(m.erro)
    if (nome.trim().length < 3) return setErroEnvio('Informe seu nome completo.')
    const digitos = whatsapp.replace(/\D/g, '')
    if (digitos.length < 10 || digitos.length > 13) return setErroEnvio('Informe o WhatsApp com DDD, por exemplo (81) 99999-0000.')
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setErroEnvio('Informe um e-mail válido.')
    if (!aceite) return setErroEnvio('É necessário aceitar a Política de Privacidade.')

    setEnviando(true)
    let contratoUrl: string | undefined
    if (arquivo) {
      try {
        const blob = await upload(arquivo.name, arquivo, { access: 'public', handleUploadUrl: '/api/upload' })
        contratoUrl = blob.url
      } catch {
        setEnviando(false)
        return setErroArquivo('Não foi possível enviar o anexo agora. Você pode mandar a foto da cota pelo WhatsApp depois.')
      }
    }

    try {
      if (status?.pagamentoDisponivel) {
        const res = await fetch('/api/pedidos', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ nome: nome.trim(), email: email.trim(), whatsapp, numeroCota, contratoUrl, consentimento: true, entrada: m.entrada }),
        })
        const dados = await res.json().catch(() => ({}))
        if (!res.ok) return setErroEnvio(dados.error ?? 'Não foi possível registrar o pedido.')
        window.location.href = dados.url
        return
      }

      // Pagamento ainda não habilitado: registramos o interesse (lista de espera) com a prévia.
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: nome.trim(),
          contato: `${whatsapp} / ${email.trim()}`,
          empreendimento: empreendimento.trim(),
          valorPagoAprox: previa?.totalPagoInformado,
          motivo: 'Lista de espera do relatório detalhado (calculadora pública)',
          origem: 'calculadora',
          detalhes: {
            tipo: 'lista_espera_relatorio',
            numeroCota: numeroCota || null,
            contratoUrl: contratoUrl ?? null,
            faixa: previa?.faixa,
            entrada: m.entrada,
          },
          consentimento: true,
        }),
      })
      const dados = await res.json().catch(() => ({}))
      if (!res.ok) return setErroEnvio(dados.error ?? 'Não foi possível enviar agora. Tente novamente.')
      setConcluido(true)
    } catch {
      setErroEnvio('Falha de conexão. Tente novamente.')
    } finally {
      setEnviando(false)
    }
  }

  const textoWhats = previa
    ? `Olá! Usei a calculadora do site (empreendimento ${empreendimento.trim()}) e a faixa estimada foi de ${formatarReais(previa.faixa.minimo)} a ${formatarReais(previa.faixa.maximo)}. ${
        numeroCota ? `O número da minha cota/venda é ${numeroCota}. ` : 'Vou enviar o número da minha cota. '
      }Meu nome é ${nome || '—'}.`
    : ''

  if (status && !status.disponivel) {
    return (
      <div className="rounded-3xl border border-dipallacio-gold/40 bg-dipallacio-gold/10 p-8 text-dipallacio-navy-900">
        <p className="font-serif text-xl">Calculadora em atualização</p>
        <p className="mt-2 text-sm leading-relaxed">{status.motivo}</p>
        <a
          href={whatsappEscritorio('Olá! Gostaria de uma estimativa da restituição do meu distrato de multipropriedade.')}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-5 inline-flex rounded-full bg-dipallacio-navy-900 px-6 py-3 text-sm font-semibold text-white hover:bg-dipallacio-navy-800"
        >
          Pedir minha estimativa pelo WhatsApp
        </a>
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <form onSubmit={calcular} className="rounded-3xl border border-dipallacio-navy-800/10 bg-white p-6 shadow-suave sm:p-10" noValidate>
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dipallacio-navy-950 text-sm font-semibold text-dipallacio-mint-400">1</span>
          <h2 className="font-serif text-2xl text-dipallacio-navy-900">Dados da sua compra</h2>
        </div>

        <div className="mt-8 grid gap-5 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label htmlFor="empreendimento" className={rotulo}>Empreendimento</label>
            <input
              id="empreendimento"
              list="lista-empreendimentos"
              value={empreendimento}
              onChange={e => setEmpreendimento(e.target.value)}
              placeholder="Ex.: Porto 2 Life, Gran Valley…"
              className={campo}
              autoComplete="off"
            />
            <datalist id="lista-empreendimentos">
              {INCORPORADORAS_ALVO.map(n => (
                <option key={n} value={n} />
              ))}
            </datalist>
          </div>

          <div>
            <label htmlFor="dataCompra" className={rotulo}>Data da compra</label>
            <input id="dataCompra" type="date" min="1996-01-01" max={hojeIso()} value={dataCompra} onChange={e => setDataCompra(e.target.value)} className={campo} />
          </div>

          <fieldset className="sm:col-span-2">
            <legend className={rotulo}>Como prefere informar o que já pagou?</legend>
            <div className="grid grid-cols-2 gap-1 rounded-full bg-dipallacio-navy-800/5 p-1" role="radiogroup">
              {([
                ['rapido', 'Total pago (rápido)'],
                ['detalhado', 'Pagamento a pagamento'],
              ] as const).map(([v, l]) => (
                <button
                  key={v}
                  type="button"
                  role="radio"
                  aria-checked={modo === v}
                  onClick={() => setModo(v)}
                  className={`rounded-full px-4 py-2.5 text-sm font-medium transition ${
                    modo === v ? 'bg-dipallacio-navy-950 text-white shadow' : 'text-dipallacio-navy-800 hover:bg-white'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </fieldset>

          {modo === 'rapido' ? (
            <>
              <div>
                <label htmlFor="totalPago" className={rotulo}>Total já pago (R$)</label>
                <input id="totalPago" inputMode="decimal" value={totalPago} onChange={e => setTotalPago(e.target.value)} placeholder="18.500,00" className={campo} />
              </div>
              <div>
                <label htmlFor="dataUltimo" className={rotulo}>Data do último pagamento <span className="font-normal text-dipallacio-navy-800/50">(opcional)</span></label>
                <input id="dataUltimo" type="date" min="1996-01-01" max={hojeIso()} value={dataUltimo} onChange={e => setDataUltimo(e.target.value)} className={campo} />
              </div>
              <p className="text-xs leading-relaxed text-dipallacio-navy-800/60 sm:col-span-2">
                No modo rápido, o total é considerado na data média entre a compra e o último pagamento (ou hoje). É uma
                aproximação — o modo “pagamento a pagamento” é mais preciso.
              </p>
            </>
          ) : (
            <div className="sm:col-span-2">
              <div className="space-y-3">
                {parcelas.map((p, i) => (
                  <div key={p.id} className="grid grid-cols-[1fr_1fr_auto] items-end gap-3">
                    <div>
                      {i === 0 && <label className={rotulo}>Data</label>}
                      <input aria-label={`Data do pagamento ${i + 1}`} type="date" min="1996-01-01" max={hojeIso()} value={p.data} onChange={e => setParcelas(l => l.map(x => (x.id === p.id ? { ...x, data: e.target.value } : x)))} className={campo} />
                    </div>
                    <div>
                      {i === 0 && <label className={rotulo}>Valor (R$)</label>}
                      <input aria-label={`Valor do pagamento ${i + 1}`} inputMode="decimal" value={p.valor} onChange={e => setParcelas(l => l.map(x => (x.id === p.id ? { ...x, valor: e.target.value } : x)))} placeholder="650,00" className={campo} />
                    </div>
                    <button
                      type="button"
                      onClick={() => setParcelas(l => (l.length > 1 ? l.filter(x => x.id !== p.id) : l))}
                      disabled={parcelas.length === 1}
                      aria-label={`Remover pagamento ${i + 1}`}
                      className="mb-0.5 h-11 w-11 rounded-xl border border-dipallacio-navy-800/15 text-dipallacio-navy-800/70 hover:bg-dipallacio-navy-800/5 disabled:opacity-30"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setParcelas(l => (l.length < 240 ? [...l, { id: Math.max(...l.map(x => x.id)) + 1, data: '', valor: '' }] : l))}
                className="mt-4 rounded-full border border-dipallacio-petrol-600/40 px-4 py-2 text-sm font-medium text-dipallacio-petrol-700 hover:bg-dipallacio-petrol-600/5"
              >
                + Adicionar pagamento
              </button>
            </div>
          )}

          <div className="sm:col-span-2">
            <label className="flex items-start gap-3 text-sm text-dipallacio-navy-800">
              <input type="checkbox" checked={teveCorretagem} onChange={e => setTeveCorretagem(e.target.checked)} className="mt-1" />
              <span>Paguei comissão de corretagem na compra</span>
            </label>
            {teveCorretagem && (
              <div className="mt-4 grid gap-4 rounded-2xl bg-dipallacio-paper p-4 sm:grid-cols-2">
                <div>
                  <label htmlFor="corretagem" className={rotulo}>Valor da corretagem (R$)</label>
                  <input id="corretagem" inputMode="decimal" value={corretagem} onChange={e => setCorretagem(e.target.value)} placeholder="3.000,00" className={campo} />
                </div>
                <label className="flex items-start gap-3 self-end pb-3 text-xs leading-relaxed text-dipallacio-navy-800/80">
                  <input type="checkbox" checked={incluirCorretagem} onChange={e => setIncluirCorretagem(e.target.checked)} className="mt-0.5" />
                  <span>Incluir a corretagem na base da restituição (por padrão ela é deduzida, em cálculo conservador)</span>
                </label>
              </div>
            )}
          </div>
        </div>

        {erro && <p role="alert" className="mt-6 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{erro}</p>}

        <button
          type="submit"
          disabled={calculando || !status}
          className="mt-8 w-full rounded-full bg-dipallacio-mint-400 px-6 py-4 text-sm font-semibold text-dipallacio-navy-950 shadow-suave transition hover:bg-dipallacio-mint-300 disabled:opacity-60 sm:w-auto sm:px-10"
        >
          {calculando ? 'Calculando…' : 'Ver minha faixa estimada — grátis'}
        </button>
      </form>

      {previa && (
        <section id="resultado" aria-live="polite" className="scroll-mt-24 overflow-hidden rounded-3xl bg-dipallacio-navy-950 text-white shadow-luxo">
          <div className="p-6 sm:p-10">
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-dipallacio-mint-300">Sua faixa estimada de restituição</p>
            <p className="mt-4 font-serif text-4xl leading-tight sm:text-5xl">
              {formatarReais(previa.faixa.minimo)}
              <span className="mx-3 text-xl text-white/40 sm:text-2xl">a</span>
              {formatarReais(previa.faixa.maximo)}
            </p>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-white/70">
              Do cenário conservador (sem juros) ao otimista (com juros), com os valores pagos corrigidos pelo IPCA
              do IBGE até {previa.dataReferencia.split('-').reverse().join('/')}. Prazo médio considerado até o fim
              do processo: {previa.mesesEstimados} meses.
            </p>
            <p className="mt-4 rounded-xl bg-white/10 px-4 py-3 text-xs leading-relaxed text-white/75">
              Estimativa educacional baseada em parâmetros gerais. Não é garantia, promessa de valor ou prazo, nem
              consultoria jurídica individualizada: o resultado de cada processo depende das provas do caso e da
              decisão do juízo.
            </p>
          </div>

          {concluido ? (
            <div className="border-t border-white/10 bg-dipallacio-navy-900 p-6 sm:p-10">
              <p className="font-serif text-2xl text-dipallacio-mint-300">Recebemos seus dados ✓</p>
              <p className="mt-2 text-sm leading-relaxed text-white/75">
                Avisaremos você no WhatsApp assim que o relatório detalhado estiver disponível. Se quiser adiantar, envie
                agora o número e a foto da sua cota para a nossa equipe:
              </p>
              <a
                href={whatsappEscritorio(textoWhats)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-white hover:brightness-105"
              >
                Enviar número da cota pelo WhatsApp
              </a>
            </div>
          ) : (
            <form onSubmit={enviar} className="border-t border-white/10 bg-dipallacio-navy-900 p-6 sm:p-10" noValidate>
              <div className="flex items-center gap-3">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-dipallacio-mint-400 text-sm font-semibold text-dipallacio-navy-950">2</span>
                <h2 className="font-serif text-2xl">
                  Relatório detalhado em PDF — {preco}
                </h2>
              </div>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/70">
                Memória de cálculo pagamento a pagamento, três cenários, duas teses de juros e premissas.{' '}
                {status?.pagamentoDisponivel
                  ? 'Informe seus dados e o número da cota; o pagamento é feito na etapa seguinte.'
                  : 'O pagamento do relatório será liberado em breve — deixe seus dados e avisamos você no WhatsApp, sem cobrança agora.'}
              </p>

              <div className="mt-8 grid gap-5 sm:grid-cols-2 [&_input]:bg-white">
                <div>
                  <label htmlFor="nome" className="mb-1.5 block text-sm font-medium text-white/85">Nome completo</label>
                  <input id="nome" value={nome} onChange={e => setNome(e.target.value)} autoComplete="name" className={campo} />
                </div>
                <div>
                  <label htmlFor="whatsapp" className="mb-1.5 block text-sm font-medium text-white/85">WhatsApp (com DDD)</label>
                  <input id="whatsapp" inputMode="tel" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="(81) 99999-0000" autoComplete="tel" className={campo} />
                </div>
                <div>
                  <label htmlFor="email" className="mb-1.5 block text-sm font-medium text-white/85">E-mail</label>
                  <input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" className={campo} />
                </div>
                <div>
                  <label htmlFor="numeroCota" className="mb-1.5 block text-sm font-medium text-white/85">Número da cota / venda <span className="font-normal text-white/50">(opcional)</span></label>
                  <input id="numeroCota" value={numeroCota} onChange={e => setNumeroCota(e.target.value)} placeholder="Ex.: 123/45" className={campo} />
                </div>
                <div className="sm:col-span-2">
                  <label htmlFor="anexo" className="mb-1.5 block text-sm font-medium text-white/85">Anexar sua cota ou contrato <span className="font-normal text-white/50">(opcional — PDF, JPG ou PNG, até 10 MB)</span></label>
                  <input
                    id="anexo"
                    type="file"
                    accept="application/pdf,image/jpeg,image/png,image/webp"
                    onChange={escolherArquivo}
                    className="w-full rounded-xl border border-white/20 bg-white/5 px-4 py-3 text-sm text-white/80 file:mr-3 file:rounded-full file:border-0 file:bg-dipallacio-mint-400 file:px-4 file:py-1.5 file:text-xs file:font-semibold file:text-dipallacio-navy-950"
                  />
                  {erroArquivo && <p className="mt-1.5 text-sm text-red-300">{erroArquivo}</p>}
                  <p className="mt-1.5 text-xs text-white/55">
                    Prefere mandar a cota depois? Sem problema: após enviar, você poderá mandar o número e a foto direto pelo
                    WhatsApp do escritório.
                  </p>
                </div>
              </div>

              <label className="mt-6 flex items-start gap-3 text-xs leading-relaxed text-white/75">
                <input type="checkbox" checked={aceite} onChange={e => setAceite(e.target.checked)} className="mt-0.5" />
                <span>
                  Autorizo o tratamento dos meus dados nos termos da{' '}
                  <a href="/politica-de-privacidade" className="font-medium text-dipallacio-mint-300 underline">Política de Privacidade</a>,
                  para emissão do relatório e contato sobre meu caso. Entendo que {preco} refere-se somente ao relatório
                  e não contrata o escritório.
                </span>
              </label>

              {erroEnvio && <p role="alert" className="mt-5 rounded-xl bg-red-500/15 px-4 py-3 text-sm text-red-200">{erroEnvio}</p>}

              <button
                type="submit"
                disabled={enviando}
                className="mt-6 w-full rounded-full bg-dipallacio-mint-400 px-6 py-4 text-sm font-semibold text-dipallacio-navy-950 transition hover:bg-dipallacio-mint-300 disabled:opacity-60 sm:w-auto sm:px-10"
              >
                {enviando
                  ? 'Enviando…'
                  : status?.pagamentoDisponivel
                    ? `Continuar para o pagamento de ${preco}`
                    : 'Quero ser avisado quando o relatório abrir'}
              </button>
            </form>
          )}
        </section>
      )}
    </div>
  )
}
