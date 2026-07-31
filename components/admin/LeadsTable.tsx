'use client'

import { useState } from 'react'

interface Lead {
  id: string
  nome: string
  contato: string
  empreendimento: string | null
  valorPagoAprox: string | null
  motivo: string | null
  origem: string
  status: string
  createdAt: string
  detalhes: { contratoUrl?: string } | null
}

const statusOptions = ['novo', 'em_analise', 'contatado', 'convertido', 'perdido']

export default function LeadsTable({ leadsIniciais }: { leadsIniciais: Lead[] }) {
  const [leads, setLeads] = useState(leadsIniciais)

  async function atualizarStatus(id: string, status: string) {
    setLeads(prev => prev.map(l => (l.id === id ? { ...l, status } : l)))
    await fetch(`/api/admin/leads/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
      <table className="w-full text-sm">
        <thead className="bg-slate-50 text-left text-slate-600">
          <tr>
            <th className="px-4 py-3">Nome</th>
            <th className="px-4 py-3">Contato</th>
            <th className="px-4 py-3">Empreendimento</th>
            <th className="px-4 py-3">Origem</th>
            <th className="px-4 py-3">Recebido em</th>
            <th className="px-4 py-3">Contrato</th>
            <th className="px-4 py-3">Status</th>
          </tr>
        </thead>
        <tbody>
          {leads.map(lead => (
            <tr key={lead.id} className="border-t border-slate-100">
              <td className="px-4 py-3 font-medium text-slate-900">{lead.nome}</td>
              <td className="px-4 py-3 text-slate-600">{lead.contato}</td>
              <td className="px-4 py-3 text-slate-600">{lead.empreendimento ?? '—'}</td>
              <td className="px-4 py-3 text-slate-600">{lead.origem}</td>
              <td className="px-4 py-3 text-slate-600">
                {new Date(lead.createdAt).toLocaleDateString('pt-BR')}
              </td>
              <td className="px-4 py-3">
                {lead.detalhes?.contratoUrl ? (
                  <a
                    href={lead.detalhes.contratoUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-dipallacio-petrol-600 hover:underline"
                  >
                    Ver PDF
                  </a>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-4 py-3">
                <select
                  value={lead.status}
                  onChange={e => atualizarStatus(lead.id, e.target.value)}
                  className="rounded-lg border border-slate-200 px-2 py-1 text-xs"
                >
                  {statusOptions.map(s => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
