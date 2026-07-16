'use client'

import { useState } from 'react'

interface Artigo {
  id: string
  titulo: string
  slug: string
  conteudoMarkdown: string
  autor: string
  publicadoEm: string | null
}

export default function ArtigosManager({ iniciais }: { iniciais: Artigo[] }) {
  const [artigos, setArtigos] = useState(iniciais)
  const [form, setForm] = useState({ titulo: '', slug: '', conteudoMarkdown: '', autor: 'Equipe Di Pallacio' })
  const [erro, setErro] = useState('')

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const res = await fetch('/api/admin/artigos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, publicado: false }),
    })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível salvar')
      return
    }

    setArtigos(prev => [data.artigo, ...prev])
    setForm({ titulo: '', slug: '', conteudoMarkdown: '', autor: 'Equipe Di Pallacio' })
  }

  async function alternarPublicacao(id: string, publicadoAtual: string | null) {
    const publicado = !publicadoAtual
    setArtigos(prev =>
      prev.map(a => (a.id === id ? { ...a, publicadoEm: publicado ? new Date().toISOString() : null } : a))
    )
    await fetch(`/api/admin/artigos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ publicado }),
    })
  }

  async function remover(id: string) {
    setArtigos(prev => prev.filter(a => a.id !== id))
    await fetch(`/api/admin/artigos/${id}`, { method: 'DELETE' })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={criar} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <input
            placeholder="Título"
            required
            value={form.titulo}
            onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
          <input
            placeholder="slug-do-artigo"
            required
            value={form.slug}
            onChange={e => setForm(f => ({ ...f, slug: e.target.value }))}
            className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
          />
        </div>
        <textarea
          placeholder="Conteúdo em Markdown"
          required
          rows={6}
          value={form.conteudoMarkdown}
          onChange={e => setForm(f => ({ ...f, conteudoMarkdown: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-mono"
        />
        <button type="submit" className="rounded-lg bg-dipallacio-navy-900 px-3 py-2 text-sm font-medium text-white sm:w-fit">
          Salvar rascunho
        </button>
        {erro && <p className="text-sm text-red-600">{erro}</p>}
      </form>

      <div className="space-y-2">
        {artigos.map(a => (
          <div key={a.id} className="flex items-center justify-between rounded-xl border border-slate-200 bg-white p-4">
            <div>
              <p className="font-medium text-slate-900">{a.titulo}</p>
              <p className="text-xs text-slate-500">/{a.slug} · {a.publicadoEm ? 'Publicado' : 'Rascunho'}</p>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => alternarPublicacao(a.id, a.publicadoEm)}
                className="text-sm font-medium text-dipallacio-petrol-600 hover:underline"
              >
                {a.publicadoEm ? 'Despublicar' : 'Publicar'}
              </button>
              <button onClick={() => remover(a.id)} className="text-sm text-red-600 hover:underline">
                Remover
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
