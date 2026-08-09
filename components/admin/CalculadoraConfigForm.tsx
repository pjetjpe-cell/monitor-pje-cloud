'use client'

import { useState, useId } from 'react'

interface Config {
  percentualConservador: string
  percentualIntermediario: string
  percentualOtimista: string
  teseJurosPadrao: string
  mesesEstimadosPadrao: number
  taxaSelicMensal: string
  taxaIpcaMensalEmbutida: string
  taxaJurosMensalSimples: string
}

export default function CalculadoraConfigForm({ inicial }: { inicial: Config }) {
  const [form, setForm] = useState(inicial)
  const [salvando, setSalvando] = useState(false)
  const [mensagem, setMensagem] = useState('')
  const idPrefix = useId()
  const teseId = useId()
  const mesesId = useId()
  const selicId = useId()
  const ipcaId = useId()
  const jurosSimplesId = useId()

  async function salvar(e: React.FormEvent) {
    e.preventDefault()
    setSalvando(true)
    setMensagem('')

    const res = await fetch('/api/admin/calculadora-config', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })

    setSalvando(false)
    setMensagem(res.ok ? 'Configurações salvas.' : 'Não foi possível salvar.')
  }

  return (
    <form onSubmit={salvar} className="max-w-xl space-y-6 rounded-xl border border-slate-200 bg-white p-6">
      <div>
        <p className="text-sm font-semibold text-slate-900">Percentuais de restituição dos 3 cenários</p>
        <div className="mt-2 grid grid-cols-3 gap-3">
          {(
            [
              ['percentualConservador', 'Conservador'],
              ['percentualIntermediario', 'Intermediário'],
              ['percentualOtimista', 'Otimista'],
            ] as const
          ).map(([campo, label]) => (
            <div key={campo}>
              <label htmlFor={`${idPrefix}-${campo}`} className="mb-1 block text-xs text-slate-500">{label}</label>
              <input
                id={`${idPrefix}-${campo}`}
                type="number"
                step="0.01"
                min={0}
                max={1}
                value={form[campo]}
                onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
              />
            </div>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor={teseId} className="mb-1 block text-sm font-medium text-slate-900">Tese de juros padrão</label>
        <select
          id={teseId}
          value={form.teseJurosPadrao}
          onChange={e => setForm(f => ({ ...f, teseJurosPadrao: e.target.value }))}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        >
          <option value="selic_transito_julgado">Tese A — SELIC líquida de IPCA, do trânsito em julgado</option>
          <option value="um_por_cento_citacao">Tese B — 1% a.m., da citação/desistência</option>
        </select>
      </div>

      <div>
        <label htmlFor={mesesId} className="mb-1 block text-sm font-medium text-slate-900">
          Meses estimados padrão até o trânsito em julgado
        </label>
        <input
          id={mesesId}
          type="number"
          min={0}
          max={120}
          value={form.mesesEstimadosPadrao}
          onChange={e => setForm(f => ({ ...f, mesesEstimadosPadrao: Number(e.target.value) }))}
          className="w-32 rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div>
          <label htmlFor={selicId} className="mb-1 block text-xs text-slate-500">Taxa SELIC mensal</label>
          <input
            id={selicId}
            type="number"
            step="0.0001"
            value={form.taxaSelicMensal}
            onChange={e => setForm(f => ({ ...f, taxaSelicMensal: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor={ipcaId} className="mb-1 block text-xs text-slate-500">IPCA mensal embutido</label>
          <input
            id={ipcaId}
            type="number"
            step="0.0001"
            value={form.taxaIpcaMensalEmbutida}
            onChange={e => setForm(f => ({ ...f, taxaIpcaMensalEmbutida: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </div>
        <div>
          <label htmlFor={jurosSimplesId} className="mb-1 block text-xs text-slate-500">Juros simples 1% (Tese B)</label>
          <input
            id={jurosSimplesId}
            type="number"
            step="0.0001"
            value={form.taxaJurosMensalSimples}
            onChange={e => setForm(f => ({ ...f, taxaJurosMensalSimples: e.target.value }))}
            className="w-full rounded-lg border border-slate-200 px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      <button
        type="submit"
        disabled={salvando}
        className="rounded-full bg-dipallacio-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-dipallacio-navy-800 disabled:opacity-50"
      >
        {salvando ? 'Salvando…' : 'Salvar configurações'}
      </button>
      {mensagem && <p className="text-sm text-slate-600">{mensagem}</p>}
    </form>
  )
}
