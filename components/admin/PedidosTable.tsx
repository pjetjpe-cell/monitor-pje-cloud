'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface PedidoLinha {
  id: string
  protocolo: string
  status: 'aguardando_pagamento' | 'aguardando_conferencia' | 'pago' | 'cancelado'
  provider: string
  valor: string
  nome: string
  email: string
  whatsapp: string
  whatsappLink: string
  empreendimento: string
  numeroCota: string | null
  contratoUrl: string | null
  faixa: string
  criadoEm: string
  token: string
}

const rotulos: Record<PedidoLinha['status'], string> = {
  aguardando_pagamento: 'Aguardando pagamento',
  aguardando_conferencia: 'Conferir Pix',
  pago: 'Pago',
  cancelado: 'Cancelado',
}

export default function PedidosTable({ pedidos }: { pedidos: PedidoLinha[] }) {
  const router = useRouter()
  const [ocupado, setOcupado] = useState<string | null>(null)
  const [erro, setErro] = useState('')

  async function agir(id: string, acao: 'confirmar' | 'cancelar') {
    if (acao === 'confirmar' && !window.confirm('Confirmar que o pagamento foi recebido na sua conta? O cliente poderá baixar o PDF.')) return
    setErro('')
    setOcupado(id)
    const r = await fetch(`/api/admin/pedidos/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ acao }),
    })
    setOcupado(null)
    if (!r.ok) return setErro((await r.json().catch(() => ({}))).error ?? 'Falha ao atualizar.')
    router.refresh()
  }

  if (pedidos.length === 0) return <p className="text-sm text-slate-500">Nenhum pedido ainda.</p>

  return (
    <div className="space-y-3">
      {erro && <p className="text-sm text-red-600">{erro}</p>}
      {pedidos.map(p => (
        <div key={p.id} className="rounded-xl border border-slate-200 bg-white p-4 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-medium text-slate-900">
              {p.protocolo} · {p.nome}
            </p>
            <span className={`rounded-full px-3 py-1 text-xs font-medium ${p.status === 'pago' ? 'bg-emerald-100 text-emerald-800' : p.status === 'aguardando_conferencia' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-600'}`}>
              {rotulos[p.status]}
            </span>
          </div>
          <p className="mt-1 text-slate-600">
            {p.empreendimento} · faixa {p.faixa} · {p.valor} ({p.provider}) · {p.criadoEm}
          </p>
          <p className="mt-1 text-slate-600">
            {p.email} ·{' '}
            <a className="text-emerald-700 underline" href={p.whatsappLink} target="_blank" rel="noopener noreferrer">
              {p.whatsapp}
            </a>
            {p.numeroCota && <> · cota: <strong>{p.numeroCota}</strong></>}
            {p.contratoUrl && (
              <> · <a className="text-emerald-700 underline" href={p.contratoUrl} target="_blank" rel="noopener noreferrer">anexo</a></>
            )}
          </p>
          {(p.status === 'aguardando_pagamento' || p.status === 'aguardando_conferencia') && (
            <div className="mt-3 flex gap-2">
              <button disabled={ocupado === p.id} onClick={() => agir(p.id, 'confirmar')} className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-700 disabled:opacity-50">
                Confirmar pagamento recebido
              </button>
              <button disabled={ocupado === p.id} onClick={() => agir(p.id, 'cancelar')} className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50">
                Cancelar
              </button>
            </div>
          )}
        </div>
      ))}
    </div>
  )
}
