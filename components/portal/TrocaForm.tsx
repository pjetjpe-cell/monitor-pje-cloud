'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function TrocaForm({ cotas }: { cotas: { id: string; label: string }[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ periodoDesejado: '', empreendimentoDesejado: '', cotaOfertadaId: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    const res = await fetch('/api/trocas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, cotaOfertadaId: form.cotaOfertadaId || undefined }),
    })
    const data = await res.json()
    setEnviando(false)

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível publicar a proposta.')
      return
    }

    setSucesso(true)
    router.refresh()
  }

  if (sucesso) {
    return (
      <p className="rounded-lg border border-dipallacio-petrol-600/30 bg-dipallacio-petrol-700/5 p-4 text-sm text-dipallacio-navy-900">
        Sua proposta de troca foi publicada no mural.
      </p>
    )
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="grid gap-3 rounded-xl border border-dipallacio-navy-800/10 bg-white p-6 sm:grid-cols-2"
    >
      {cotas.length > 0 && (
        <div className="sm:col-span-2">
          <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Cota que você possui</label>
          <select
            value={form.cotaOfertadaId}
            onChange={e => setForm(f => ({ ...f, cotaOfertadaId: e.target.value }))}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
          >
            <option value="">Selecione…</option>
            {cotas.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Período desejado *</label>
        <input
          required
          placeholder="Ex.: Janeiro/2027, temporada alta"
          value={form.periodoDesejado}
          onChange={e => setForm(f => ({ ...f, periodoDesejado: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
          Empreendimento desejado *
        </label>
        <input
          required
          value={form.empreendimentoDesejado}
          onChange={e => setForm(f => ({ ...f, empreendimentoDesejado: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
        />
      </div>

      {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}

      <div className="sm:col-span-2">
        <button
          type="submit"
          disabled={enviando}
          className="rounded-full bg-dipallacio-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-dipallacio-navy-800 disabled:opacity-50"
        >
          {enviando ? 'Publicando…' : 'Publicar proposta de troca'}
        </button>
      </div>
    </form>
  )
}
