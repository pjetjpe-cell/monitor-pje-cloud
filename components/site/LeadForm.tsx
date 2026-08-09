'use client'

import { useState, useId } from 'react'
import { upload } from '@vercel/blob/client'

const TAMANHO_MAXIMO_CONTRATO = 10 * 1024 * 1024 // 10 MB

interface LeadFormProps {
  origem: 'form_distrato' | 'calculadora' | 'whatsapp'
  detalhes?: Record<string, unknown>
  onSucesso?: () => void
  permitirUploadContrato?: boolean
}

export default function LeadForm({ origem, detalhes, onSucesso, permitirUploadContrato }: LeadFormProps) {
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
  const [arquivo, setArquivo] = useState<File | null>(null)
  const [erroArquivo, setErroArquivo] = useState('')
  const nomeId = useId()
  const contatoId = useId()
  const empreendimentoId = useId()
  const valorId = useId()
  const motivoId = useId()
  const contratoId = useId()

  function handleArquivoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selecionado = e.target.files?.[0] ?? null
    setErroArquivo('')

    if (!selecionado) {
      setArquivo(null)
      return
    }
    if (selecionado.type !== 'application/pdf') {
      setErroArquivo('Envie o contrato em formato PDF.')
      e.target.value = ''
      setArquivo(null)
      return
    }
    if (selecionado.size > TAMANHO_MAXIMO_CONTRATO) {
      setErroArquivo('O arquivo deve ter no máximo 10 MB.')
      e.target.value = ''
      setArquivo(null)
      return
    }
    setArquivo(selecionado)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!aceite) {
      setErro('É necessário aceitar a Política de Privacidade para enviar.')
      return
    }

    setEnviando(true)

    let contratoUrl: string | undefined
    if (arquivo) {
      try {
        const blob = await upload(arquivo.name, arquivo, {
          access: 'public',
          handleUploadUrl: '/api/upload',
        })
        contratoUrl = blob.url
      } catch {
        setEnviando(false)
        setErroArquivo('Não foi possível enviar o contrato agora. Você pode enviar depois pelo WhatsApp.')
        return
      }
    }

    const res = await fetch('/api/leads', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...form,
        valorPagoAprox: form.valorPagoAprox || undefined,
        origem,
        detalhes: contratoUrl ? { ...detalhes, contratoUrl } : detalhes,
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
        <label htmlFor={nomeId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Nome completo *</label>
        <input
          id={nomeId}
          required
          value={form.nome}
          onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor={contatoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
          Telefone ou e-mail para contato *
        </label>
        <input
          id={contatoId}
          required
          value={form.contato}
          onChange={e => setForm(f => ({ ...f, contato: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor={empreendimentoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Empreendimento</label>
        <input
          id={empreendimentoId}
          value={form.empreendimento}
          onChange={e => setForm(f => ({ ...f, empreendimento: e.target.value }))}
          placeholder="Nome do resort/empreendimento"
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor={valorId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
          Valor pago aproximado (R$)
        </label>
        <input
          id={valorId}
          type="number"
          min={0}
          step="0.01"
          value={form.valorPagoAprox}
          onChange={e => setForm(f => ({ ...f, valorPagoAprox: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>
      <div>
        <label htmlFor={motivoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
          Motivo da desistência
        </label>
        <textarea
          id={motivoId}
          value={form.motivo}
          onChange={e => setForm(f => ({ ...f, motivo: e.target.value }))}
          rows={3}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
        />
      </div>

      {permitirUploadContrato && (
        <div>
          <label htmlFor={contratoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
            Contrato em PDF (opcional)
          </label>
          <input
            id={contratoId}
            type="file"
            accept="application/pdf"
            onChange={handleArquivoChange}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm file:mr-3 file:rounded-full file:border-0 file:bg-dipallacio-navy-900/5 file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-dipallacio-navy-800"
          />
          <p className="mt-1 text-xs text-dipallacio-navy-800/50">
            Máximo 10 MB. Não é obrigatório para iniciar — se preferir, envie depois pelo WhatsApp.
          </p>
          {erroArquivo && <p className="mt-1 text-sm text-red-600">{erroArquivo}</p>}
        </div>
      )}

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
        {enviando ? (arquivo ? 'Enviando contrato…' : 'Enviando…') : 'Quero uma análise do meu caso'}
      </button>
    </form>
  )
}
