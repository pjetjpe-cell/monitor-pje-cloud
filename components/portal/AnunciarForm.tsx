'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function AnunciarForm({ cotas }: { cotas: { id: string; label: string }[] }) {
  const router = useRouter()
  const [form, setForm] = useState({ titulo: '', descricao: '', precoPedido: '', cotaId: '', disponibilidades: '' })
  const [enviando, setEnviando] = useState(false)
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setEnviando(true)

    const disponibilidades = form.disponibilidades
      .split(',')
      .map(s => s.trim())
      .filter(Boolean)

    const res = await fetch('/api/anuncios', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        titulo: form.titulo,
        descricao: form.descricao,
        precoPedido: form.precoPedido,
        cotaId: form.cotaId || undefined,
        fotos: [],
        disponibilidades,
      }),
    })
    const data = await res.json()
    setEnviando(false)

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível publicar o anúncio.')
      return
    }

    setSucesso(true)
    setTimeout(() => router.push('/area-do-cliente/meus-anuncios'), 1500)
  }

  if (sucesso) {
    return (
      <div className="rounded-lg border border-dipallacio-petrol-600/30 bg-dipallacio-petrol-700/5 p-6 text-center">
        <p className="font-serif text-lg text-dipallacio-navy-900">Anúncio enviado para moderação</p>
        <p className="mt-2 text-sm text-dipallacio-navy-800/70">
          Assim que aprovado, ele ficará visível publicamente em Venda de Cotas.
        </p>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
      {cotas.length > 0 && (
        <div>
          <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
            Vincular a uma cota cadastrada (opcional)
          </label>
          <select
            value={form.cotaId}
            onChange={e => setForm(f => ({ ...f, cotaId: e.target.value }))}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
          >
            <option value="">Nenhuma</option>
            {cotas.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Título *</label>
        <input
          required
          value={form.titulo}
          onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Descrição *</label>
        <textarea
          required
          rows={4}
          value={form.descricao}
          onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Preço pedido (R$) *</label>
        <input
          required
          type="number"
          min={0}
          step="0.01"
          value={form.precoPedido}
          onChange={e => setForm(f => ({ ...f, precoPedido: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
          Períodos disponíveis (opcional)
        </label>
        <input
          placeholder="Ex.: Janeiro/2027, Julho/2027 (separados por vírgula)"
          value={form.disponibilidades}
          onChange={e => setForm(f => ({ ...f, disponibilidades: e.target.value }))}
          className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
        />
        <p className="mt-1 text-xs text-dipallacio-navy-800/50">
          Aparecem no calendário público para quem busca apenas usar a cota por temporada.
        </p>
      </div>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <button
        type="submit"
        disabled={enviando}
        className="w-full rounded-full bg-dipallacio-navy-900 px-4 py-3 text-sm font-medium text-white hover:bg-dipallacio-navy-800 disabled:opacity-50"
      >
        {enviando ? 'Publicando…' : 'Enviar para moderação'}
      </button>
    </form>
  )
}
