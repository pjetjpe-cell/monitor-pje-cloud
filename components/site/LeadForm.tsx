'use client'

import { useState } from 'react'

interface LeadFormProps {
  origem: 'form_distrato' | 'calculadora' | 'whatsapp'
  detalhes?: Record<string, unknown>
  onSucesso?: () => void
}

export default function LeadForm({ origem, detalhes, onSucesso }: LeadFormProps) {
  const [form, setForm] = useState({
    nome: '',
    contato: '',
    empreendimento: '',
    valorPagoAprox: '',
    motivo: '',
  })
  const [aceite, setAceite] = useState(false)
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!aceite) {
      setErro('É necessário aceitar a Política de Privacidade para enviar.')
      return
    }

    setEnviando(true)

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        valorPagoAprox: form.valorPagoAprox || undefined,
        origem,
        detalhes,
        consentimento: true,
      }),
    })

    setEnviando(false)

    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      setErro(data.error ?? 'Não foi possível enviar. Tente novamente.')
      return
    }

    setSucesso(true)
    onSucesso?.()
  }

  if (sucesso) {
    return (
      <div className="rounded-lg border border-dipallacio-petrol-600/30 bg-dipallacio-petrol-700/5 p-6 text-center">
        <p className="font-serif text-lg text-dipallacio-navy-900">Recebemos sua solicitação</p>
        <p className="mt-2 text-sm text-dipallacio-navy-800/70">
          Nossa equipe jurídica vai analisar seu caso e entrar em contato em breve.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Nome completo *</label>
        <input
          required
          value={form.nome}
          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
          Telefone ou e-mail para contato *
        </label>
        <input
          required
          value={form.contato}
          onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Empreendimento</label>
        <input
          value={form.empreendimento}
          onChange={e => setForm(f => ({ ...f, empreendimento: e.target.value }))}
          placeholder="Nome do resort/empreendimento"
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
          Valor pago aproximado (R$)
        </label>
        <input
          type="number"
          min={0}
          step="0.01"
          value={form.valorPagoAprox}
          onChange={e => setForm(f => ({ ...f, valorPagoAprox: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
          Motivo da desistência
        </label>
        <textarea
          value={form.motivo}
          onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
          rows={3}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>

      <label className="flex items-start gap-2 text-xs text-dipallacio-navy-800/80">
        <input type="checkbox" checked={aceite} onChange={e => setAceite(e.target.checked)} className="mt-0.5" />
        <span>
          Autorizo o tratamento dos meus dados nos termos da{' '}
          <a href="/politica-de-privacidade" className="font-medium text-dipallacio-petrol-600 hover:underline">
            Política de Privacidade
          </a>
          , exclusivamente para retorno sobre meu caso.
        </span>
      </label>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-dipallacio-navy-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-dipallacio-navy-800 disabled:opacity-50"
      >
        {enviando ? 'Enviando…' : 'Quero uma análise do meu caso'}
      </button>
    </form>
  )
}
