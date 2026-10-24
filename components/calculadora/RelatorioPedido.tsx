'use client'

import { useEffect, useState } from 'react'

type Status = 'aguardando_pagamento' | 'aguardando_conferencia' | 'pago' | 'cancelado'

interface Props {
  token: string
  protocolo: string
  statusInicial: Status
  provider: 'mercadopago' | 'pix_manual'
  valorLabel: string
  faixaLabel: string
  pix: { payload: string; qr: string } | null
  whatsappHref: string
}

export default function RelatorioPedido({ token, protocolo, statusInicial, provider, valorLabel, faixaLabel, pix, whatsappHref }: Props) {
  const [status, setStatus] = useState<Status>(statusInicial)
  const [copiado, setCopiado] = useState(false)
  const [msg, setMsg] = useState('')
  const [ocupado, setOcupado] = useState(false)

  useEffect(() => {
    if (status === 'pago' || status === 'cancelado') return
    const t = setInterval(() => {
      fetch(`/api/pedidos/${token}`)
        .then(r => (r.ok ? r.json() : null))
        .then(d => d && setStatus(d.status))
        .catch(() => {})
    }, 6000)
    return () => clearInterval(t)
  }, [status, token])

  async function pagarMercadoPago() {
    setMsg('')
    setOcupado(true)
    try {
      const r = await fetch(`/api/pedidos/${token}/pagar`, { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return setMsg(d.error ?? 'Não foi possível iniciar o pagamento.')
      window.location.href = d.url
    } finally {
      setOcupado(false)
    }
  }

  async function jaPaguei() {
    setMsg('')
    setOcupado(true)
    try {
      const r = await fetch(`/api/pedidos/${token}/informar-pagamento`, { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      if (!r.ok) return setMsg(d.error ?? 'Não foi possível registrar agora.')
      setStatus('aguardando_conferencia')
    } finally {
      setOcupado(false)
    }
  }

  async function copiar() {
    if (!pix) return
    try {
      await navigator.clipboard.writeText(pix.payload)
      setCopiado(true)
      setTimeout(() => setCopiado(false), 2500)
    } catch {
      setMsg('Não foi possível copiar automaticamente — selecione o código e copie.')
    }
  }

  return (
    <div className="rounded-3xl border border-dipallacio-navy-800/10 bg-white p-6 shadow-suave sm:p-10">
      <p className="text-xs font-medium uppercase tracking-[0.18em] text-dipallacio-petrol-600">Protocolo {protocolo}</p>
      <p className="mt-2 text-sm text-dipallacio-navy-800/70">Faixa estimada</p>
      <p className="font-serif text-3xl text-dipallacio-navy-900">{faixaLabel}</p>

      <div className="mt-8 border-t border-dipallacio-navy-800/10 pt-8" aria-live="polite">
        {status === 'pago' && (
          <>
            <p className="font-serif text-2xl text-dipallacio-navy-900">Pagamento confirmado ✓</p>
            <p className="mt-2 text-sm text-dipallacio-navy-800/70">Seu relatório está pronto para download.</p>
            <a href={`/api/pedidos/${token}/pdf`} className="mt-5 inline-flex rounded-full bg-dipallacio-mint-400 px-7 py-4 text-sm font-semibold text-dipallacio-navy-950 hover:bg-dipallacio-mint-300">
              Baixar relatório em PDF
            </a>
          </>
        )}

        {status === 'cancelado' && <p className="text-sm text-dipallacio-navy-800">Este pedido foi cancelado. Faça um novo cálculo para gerar outro relatório.</p>}

        {status === 'aguardando_conferencia' && (
          <>
            <p className="font-serif text-2xl text-dipallacio-navy-900">Pagamento em conferência</p>
            <p className="mt-2 text-sm text-dipallacio-navy-800/70">Assim que a equipe confirmar o Pix, o botão de download aparece aqui automaticamente.</p>
          </>
        )}

        {status === 'aguardando_pagamento' && provider === 'mercadopago' && (
          <>
            <p className="font-serif text-2xl text-dipallacio-navy-900">Pagar {valorLabel}</p>
            <p className="mt-2 text-sm text-dipallacio-navy-800/70">Você será levado ao ambiente seguro do Mercado Pago (Pix, cartão ou boleto).</p>
            <button onClick={pagarMercadoPago} disabled={ocupado} className="mt-5 rounded-full bg-dipallacio-navy-900 px-7 py-4 text-sm font-semibold text-white hover:bg-dipallacio-navy-800 disabled:opacity-60">
              Pagar {valorLabel}
            </button>
          </>
        )}

        {status === 'aguardando_pagamento' && provider === 'pix_manual' && pix && (
          <>
            <p className="font-serif text-2xl text-dipallacio-navy-900">Pague {valorLabel} via Pix</p>
            <div className="mt-5 grid gap-6 sm:grid-cols-[auto_1fr] sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pix.qr} alt="QR Code Pix" width={180} height={180} className="rounded-xl border border-dipallacio-navy-800/10" />
              <div>
                <p className="text-sm text-dipallacio-navy-800/70">Ou use o Pix copia e cola:</p>
                <textarea readOnly value={pix.payload} rows={4} className="mt-2 w-full rounded-xl border border-dipallacio-navy-800/15 bg-dipallacio-paper p-3 font-mono text-xs" />
                <div className="mt-3 flex flex-wrap gap-3">
                  <button onClick={copiar} className="rounded-full border border-dipallacio-navy-800/20 px-5 py-2.5 text-sm font-medium hover:bg-dipallacio-navy-800/5">
                    {copiado ? 'Copiado ✓' : 'Copiar código'}
                  </button>
                  <button onClick={jaPaguei} disabled={ocupado} className="rounded-full bg-dipallacio-navy-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-dipallacio-navy-800 disabled:opacity-60">
                    Já paguei
                  </button>
                </div>
              </div>
            </div>
          </>
        )}

        {msg && <p role="alert" className="mt-4 text-sm text-red-600">{msg}</p>}
      </div>

      <div className="mt-8 rounded-2xl bg-dipallacio-paper p-5 text-sm text-dipallacio-navy-800">
        <p className="font-medium">Envie o número da sua cota para a equipe</p>
        <p className="mt-1 text-dipallacio-navy-800/70">A mensagem já vai com o seu protocolo.</p>
        <a href={whatsappHref} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex rounded-full bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-white hover:brightness-105">
          Abrir WhatsApp
        </a>
      </div>
      <p className="mt-6 text-xs text-dipallacio-navy-800/55">
        Guarde este link: ele é a sua chave de acesso ao relatório. O valor de {valorLabel} refere-se somente à emissão do relatório
        e não contrata o escritório. Estimativa educacional, sem garantia de resultado.
      </p>
    </div>
  )
}
