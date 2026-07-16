'use client'

import { useState } from 'react'

interface Video {
  id: string
  titulo: string
  descricao: string
  urlEmbed: string
  categoria: string
  ordem: number
}

export default function VideosManager({ iniciais }: { iniciais: Video[] }) {
  const [videos, setVideos] = useState(iniciais)
  const [form, setForm] = useState({ titulo: '', descricao: '', urlEmbed: '', categoria: '', ordem: '0' })
  const [erro, setErro] = useState('')

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const res = await fetch('/api/admin/videos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível salvar')
      return
    }

    setVideos(prev => [...prev, data.video])
    setForm({ titulo: '', descricao: '', urlEmbed: '', categoria: '', ordem: '0' })
  }

  async function remover(id: string) {
    setVideos(prev => prev.filter(v => v.id !== id))
    await fetch(`/api/admin/videos/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={adicionar} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-2">
        <input
          placeholder="Título"
          required
          value={form.titulo}
          onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Categoria"
          required
          value={form.categoria}
          onChange={e => setForm(f => ({ ...f, categoria: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="URL de embed (YouTube/Vimeo)"
          required
          value={form.urlEmbed}
          onChange={e => setForm(f => ({ ...f, urlEmbed: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <textarea
          placeholder="Descrição"
          required
          value={form.descricao}
          onChange={e => setForm(f => ({ ...f, descricao: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm sm:col-span-2"
        />
        <button type="submit" className="rounded-lg bg-dipallacio-navy-900 px-3 py-2 text-sm font-medium text-white sm:w-fit">
          + Adicionar vídeo
        </button>
        {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}
      </form>

      <div className="space-y-2">
        {videos.map(v => (
          <div key={v.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="font-medium text-slate-900">{v.titulo}</p>
              <p className="text-xs text-slate-500">{v.categoria}</p>
            </div>
            <button onClick={() => remover(v.id)} className="text-sm text-red-600 hover:underline">
              Remover
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
