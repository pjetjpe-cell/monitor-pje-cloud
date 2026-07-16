'use client'

import { useState } from 'react'

interface Empreendimento {
  id: string
  nome: string
  cidade: string
  uf: string
  dataHabiteSePrevista: string | null
  dataHabiteSeReal: string | null
  indiceCorrecaoPreHabiteSe: 'INCC_DI_FGV' | 'IPCA'
  indiceCorrecaoPosHabiteSe: 'INCC_DI_FGV' | 'IPCA'
  percentualMultaPadrao: string
}

export default function EmpreendimentosManager({ iniciais }: { iniciais: Empreendimento[] }) {
  const [lista, setLista] = useState(iniciais)
  const [novo, setNovo] = useState({ nome: '', cidade: '', uf: '', percentualMultaPadrao: '0.5' })
  const [erro, setErro] = useState('')

  async function criar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    const res = await fetch('/api/admin/empreendimentos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(novo),
    })
    const data = await res.json()
    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível criar')
      return
    }
    setLista(prev => [...prev, data.empreendimento])
    setNovo({ nome: '', cidade: '', uf: '', percentualMultaPadrao: '0.5' })
  }

  async function atualizarCampo(id: string, campo: string, valor: string) {
    setLista(prev => prev.map(e => (e.id === id ? { ...e, [campo]: valor } : e)))
    await fetch(`/api/admin/empreendimentos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [campo]: campo === 'percentualMultaPadrao' ? Number(valor) : valor }),
    })
  }

  return (
    <div className="space-y-6">
      <form onSubmit={criar} className="grid gap-3 rounded-xl border border-slate-200 bg-white p-5 sm:grid-cols-4">
        <input
          placeholder="Nome"
          required
          value={novo.nome}
          onChange={e => setNovo(n => ({ ...n, nome: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="Cidade"
          required
          value={novo.cidade}
          onChange={e => setNovo(n => ({ ...n, cidade: e.target.value }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <input
          placeholder="UF"
          required
          maxLength={2}
          value={novo.uf}
          onChange={e => setNovo(n => ({ ...n, uf: e.target.value.toUpperCase() }))}
          className="rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        <button type="submit" className="rounded-lg bg-dipallacio-navy-900 px-3 py-2 text-sm font-medium text-white">
          + Adicionar
        </button>
        {erro && <p className="text-sm text-red-600 sm:col-span-4">{erro}</p>}
      </form>

      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-left text-slate-600">
            <tr>
              <th className="px-4 py-3">Nome</th>
              <th className="px-4 py-3">Cidade/UF</th>
              <th className="px-4 py-3">Índice pré</th>
              <th className="px-4 py-3">Índice pós</th>
              <th className="px-4 py-3">Multa padrão</th>
            </tr>
          </thead>
          <tbody>
            {lista.map(e => (
              <tr key={e.id} className="border-t border-slate-100">
                <td className="px-4 py-3 font-medium text-slate-900">{e.nome}</td>
                <td className="px-4 py-3 text-slate-600">
                  {e.cidade}/{e.uf}
                </td>
                <td className="px-4 py-3">
                  <select
                    value={e.indiceCorrecaoPreHabiteSe}
                    onChange={ev => atualizarCampo(e.id, 'indiceCorrecaoPreHabiteSe', ev.target.value)}
                    className="rounded border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option value="INCC_DI_FGV">INCC-DI/FGV</option>
                    <option value="IPCA">IPCA</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <select
                    value={e.indiceCorrecaoPosHabiteSe}
                    onChange={ev => atualizarCampo(e.id, 'indiceCorrecaoPosHabiteSe', ev.target.value)}
                    className="rounded border border-slate-200 px-2 py-1 text-xs"
                  >
                    <option value="INCC_DI_FGV">INCC-DI/FGV</option>
                    <option value="IPCA">IPCA</option>
                  </select>
                </td>
                <td className="px-4 py-3">
                  <input
                    type="number"
                    step="0.01"
                    min={0}
                    max={1}
                    defaultValue={e.percentualMultaPadrao}
                    onBlur={ev => atualizarCampo(e.id, 'percentualMultaPadrao', ev.target.value)}
                    className="w-20 rounded border border-slate-200 px-2 py-1 text-xs"
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
