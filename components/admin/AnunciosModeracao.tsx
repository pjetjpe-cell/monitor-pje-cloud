'use client'

import { useState } from 'react'

interface Anuncio {
  id: string
  titulo: string
  descricao: string
  precoPedido: string
  status: string
  userId: string
}

const statusOptions = ['pendente', 'aprovado', 'em_negociacao', 'vendido', 'rejeitado']

export default function AnunciosModeracao({ anunciosIniciais }: { anunciosIniciais: Anuncio[] }) {
  const [anuncios, setAnuncios] = useState(anunciosIniciais)

  async function atualizarStatus(id: string, status: string) {
    setAnuncios(prev => prev.map(a => (a.id === id ? { ...a, status } : a)))
    await fetch(`/api/admin/anuncios/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  return (
    <div className="space-y-3">
      {anuncios.map(a => (
        <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="font-medium text-slate-900">{a.titulo}</p>
              <p className="mt-1 text-sm text-slate-500">{a.descricao}</p>
              <p className="mt-2 text-sm font-medium text-slate-900">
                {Number(a.precoPedido).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
              </p>
            </div>
            <select
              value={a.status}
              onChange={e => atualizarStatus(a.id, e.target.value)}
              className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
            >
              {statusOptions.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>
      ))}
    </div>
  )
}
