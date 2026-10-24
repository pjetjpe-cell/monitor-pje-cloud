'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function ImportarIpcaButton({ ultimaAtualizacao }: { ultimaAtualizacao: string | null }) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState(false)
  const [msg, setMsg] = useState('')
  const [ok, setOk] = useState(false)

  async function importar() {
    if (!window.confirm('Substituir toda a série de IPCA pela série oficial do IBGE (SIDRA)?')) return
    setOcupado(true)
    setMsg('')
    try {
      const r = await fetch('/api/admin/indices/importar', { method: 'POST' })
      const d = await r.json().catch(() => ({}))
      setOk(r.ok)
      setMsg(r.ok ? `Importados ${d.quantidade} meses (${d.de} a ${d.ate}).` : d.error ?? 'Falha na importação.')
      if (r.ok) router.refresh()
    } finally {
      setOcupado(false)
    }
  }

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5">
      <p className="text-sm font-medium text-slate-900">IPCA oficial (IBGE)</p>
      <p className="mt-1 text-sm text-slate-500">
        A calculadora pública só funciona depois de uma importação oficial.{' '}
        {ultimaAtualizacao ? `Última importação: ${ultimaAtualizacao}.` : 'Nenhuma importação feita ainda — a calculadora pública está bloqueada.'}
      </p>
      <button onClick={importar} disabled={ocupado} className="mt-3 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
        {ocupado ? 'Importando…' : 'Importar IPCA do IBGE'}
      </button>
      {msg && <p className={`mt-2 text-sm ${ok ? 'text-emerald-700' : 'text-red-600'}`}>{msg}</p>}
    </div>
  )
}
