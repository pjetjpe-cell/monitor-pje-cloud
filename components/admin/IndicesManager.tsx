'use client'

import { useState } from 'react'

interface Ponto {
  id: string
  indice: 'INCC_DI_FGV' | 'IPCA'
  competencia: string
  numeroIndice: string
}

export default function IndicesManager({ iniciais }: { iniciais: Ponto[] }) {
  const [pontos, setPontos] = useState(iniciais)
  const [form, setForm] = useState({ indice: 'IPCA', competencia: '', numeroIndice: '' })
  const [erro, setErro] = useState('')

  async function adicionar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    const res = await fetch('/api/admin/indices', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível salvar')
      return
    }

    setPontos(prev => {
      const semDuplicata = prev.filter(
        p => !(p.indice === data.ponto.indice && p.competencia === data.ponto.competencia)
      )
      return [data.ponto, ...semDuplicata].sort((a, b) => b.competencia.localeCompare(a.competencia))
    })
    setForm(f => ({ ...f, competencia: '', numeroIndice: '' }))
  }

  return (
    <div className="space-y-6">
      <form onSubmit={adicionar} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
        <select
          value={form.indice}
          onChange={e => setForm(f => ({ ...f, indice: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="INCC_DI_FGV">INCC-DI/FGV</option>
          <option value="IPCA">IPCA</option>
        </select>
        <input
          type="month"
          required
          value={form.competencia}
          onChange={e => setForm(f => ({ ...f, competencia: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          type="number"
          step="0.0001"
          required
          placeholder="Número-índice"
          value={form.numeroIndice}
          onChange={e => setForm(f => ({ ...f, numeroIndice: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-dipallacio-navy-900 px-3 py-2 text-sm font-medium text-white">
          Salvar mês
        </button>
        {erro && <p className="text-sm text-red-600 sm:col-span-4">{erro}</p>}
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Índice</th>
              <th className="px-4 py-3">Competência</th>
              <th className="px-4 py-3">Número-índice</th>
            </tr>
          </thead>
          <tbody>
            {pontos.map(p => (
              <tr key={p.id} className="border-t border-slate-100">
                <td className="px-4 py-3">{p.indice === 'INCC_DI_FGV' ? 'INCC-DI/FGV' : 'IPCA'}</td>
                <td className="px-4 py-3">
                  {new Date(p.competencia).toLocaleDateString('pt-BR', { timeZone: 'UTC', month: '2-digit', year: 'numeric' })}
                </td>
                <td className="px-4 py-3">{Number(p.numeroIndice).toFixed(4)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
