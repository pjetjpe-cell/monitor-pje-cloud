'use client'

import { useState, useId } from 'react'
import { useRouter } from 'next/navigation'

interface Empreendimento {
  id: string
  nome: string
  cidade: string
  uf: string
}

interface Pagamento {
  id: string
  data: string
  valor: string
  tipo: 'sinal' | 'parcela' | 'taxa'
}

interface Cota {
  id: string
  unidade: string | null
  bloco: string | null
  fracaoTempo: string | null
  dataContrato: string
  valorTotalContrato: string
  valorComissaoCorretagem: string
  percentualMultaContratual: string
  empreendimento: Empreendimento
  pagamentos: Pagamento[]
}

function formatarMoeda(valor: string | number) {
  return Number(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CotasManager({
  cotasIniciais,
  empreendimentos,
}: {
  cotasIniciais: Cota[]
  empreendimentos: Empreendimento[]
}) {
  const router = useRouter()
  const [cotas, setCotas] = useState(cotasIniciais)
  const [mostrarFormCota, setMostrarFormCota] = useState(cotasIniciais.length === 0)
  const [erro, setErro] = useState('')
  const empreendimentoId = useId()
  const unidadeId = useId()
  const blocoId = useId()
  const fracaoTempoId = useId()
  const dataContratoId = useId()
  const percentualMultaId = useId()
  const valorTotalId = useId()
  const comissaoId = useId()

  async function recarregar() {
    router.refresh()
  }

  async function handleCriarCota(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())

    const res = await fetch('/api/cotas', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível cadastrar a cota.')
      return
    }

    setCotas(prev => [{ ...data.cota, pagamentos: [] }, ...prev])
    setMostrarFormCota(false)
    recarregar()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-2xl text-dipallacio-navy-900">Minhas Cotas</h2>
        <button
          onClick={() => setMostrarFormCota(v => !v)}
          className="rounded-full border border-dipallacio-navy-800/20 px-4 py-2 text-sm font-medium text-dipallacio-navy-800 hover:bg-dipallacio-navy-900/5"
        >
          {mostrarFormCota ? 'Cancelar' : '+ Nova cota'}
        </button>
      </div>

      {mostrarFormCota && (
        <form
          onSubmit={handleCriarCota}
          className="grid gap-4 rounded-xl border border-dipallacio-navy-800/10 bg-white p-6 sm:grid-cols-2"
        >
          <div className="sm:col-span-2">
            <label htmlFor={empreendimentoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Empreendimento *</label>
            <select
              id={empreendimentoId}
              name="empreendimentoId"
              required
              className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
            >
              <option value="">Selecione…</option>
              {empreendimentos.map(emp => (
                <option key={emp.id} value={emp.id}>
                  {emp.nome} — {emp.cidade}/{emp.uf}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={unidadeId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Unidade</label>
            <input id={unidadeId} name="unidade" className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm" />
          </div>
          <div>
            <label htmlFor={blocoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Bloco</label>
            <input id={blocoId} name="bloco" className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm" />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor={fracaoTempoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Fração de tempo</label>
            <input
              id={fracaoTempoId}
              name="fracaoTempo"
              placeholder="Ex.: 1 semana - temporada alta"
              className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={dataContratoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Data do contrato *</label>
            <input
              id={dataContratoId}
              type="date"
              name="dataContrato"
              required
              className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={percentualMultaId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
              Percentual de multa contratual
            </label>
            <input
              id={percentualMultaId}
              type="number"
              step="0.01"
              min={0}
              max={1}
              name="percentualMultaContratual"
              defaultValue={0.5}
              className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={valorTotalId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
              Valor total do contrato (R$) *
            </label>
            <input
              id={valorTotalId}
              type="number"
              step="0.01"
              min={0}
              required
              name="valorTotalContrato"
              className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label htmlFor={comissaoId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">
              Comissão de corretagem (R$)
            </label>
            <input
              id={comissaoId}
              type="number"
              step="0.01"
              min={0}
              name="valorComissaoCorretagem"
              defaultValue={0}
              className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
            />
          </div>

          {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}

          <div className="sm:col-span-2">
            <button
              type="submit"
              className="rounded-full bg-dipallacio-navy-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-dipallacio-navy-800"
            >
              Cadastrar cota
            </button>
          </div>
        </form>
      )}

      <div className="space-y-4">
        {cotas.length === 0 && !mostrarFormCota && (
          <p className="text-sm text-dipallacio-navy-800/60">Você ainda não cadastrou nenhuma cota.</p>
        )}
        {cotas.map(cota => (
          <CotaCard key={cota.id} cota={cota} onPagamentoAdicionado={recarregar} />
        ))}
      </div>
    </div>
  )
}

function CotaCard({ cota, onPagamentoAdicionado }: { cota: Cota; onPagamentoAdicionado: () => void }) {
  const [pagamentos, setPagamentos] = useState(cota.pagamentos)
  const [mostrarForm, setMostrarForm] = useState(false)
  const [erro, setErro] = useState('')

  async function handleAdicionarPagamento(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setErro('')
    const form = new FormData(e.currentTarget)
    const payload = Object.fromEntries(form.entries())

    const res = await fetch(`/api/cotas/${cota.id}/pagamentos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível registrar o pagamento.')
      return
    }

    setPagamentos(prev => [...prev, data.pagamento].sort((a, b) => a.data.localeCompare(b.data)))
    setMostrarForm(false)
    onPagamentoAdicionado()
  }

  return (
    <div className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="font-serif text-lg text-dipallacio-navy-900">{cota.empreendimento.nome}</p>
          <p className="text-sm text-dipallacio-navy-800/60">
            {cota.empreendimento.cidade}/{cota.empreendimento.uf}
            {cota.unidade && ` · Unidade ${cota.unidade}`}
            {cota.bloco && ` · Bloco ${cota.bloco}`}
          </p>
          {cota.fracaoTempo && <p className="mt-1 text-sm text-dipallacio-navy-800/60">{cota.fracaoTempo}</p>}
        </div>
        <div className="text-right">
          <p className="text-sm text-dipallacio-navy-800/60">Valor do contrato</p>
          <p className="font-medium text-dipallacio-navy-900">{formatarMoeda(cota.valorTotalContrato)}</p>
        </div>
      </div>

      <div className="mt-4 border-t border-dipallacio-navy-800/10 pt-4">
        <div className="flex items-center justify-between">
          <p className="text-sm font-medium text-dipallacio-navy-800">
            Pagamentos registrados ({pagamentos.length})
          </p>
          <button
            onClick={() => setMostrarForm(v => !v)}
            className="text-sm font-medium text-dipallacio-petrol-600 hover:underline"
          >
            {mostrarForm ? 'Cancelar' : '+ Adicionar pagamento'}
          </button>
        </div>

        {pagamentos.length > 0 && (
          <ul className="mt-3 space-y-1 text-sm text-dipallacio-navy-800/80">
            {pagamentos.map(p => (
              <li key={p.id} className="flex justify-between">
                <span>
                  {new Date(p.data).toLocaleDateString('pt-BR', { timeZone: 'UTC' })} · {p.tipo}
                </span>
                <span>{formatarMoeda(p.valor)}</span>
              </li>
            ))}
          </ul>
        )}

        {mostrarForm && (
          <form onSubmit={handleAdicionarPagamento} className="mt-4 grid gap-3 sm:grid-cols-3">
            <input
              type="date"
              name="data"
              required
              className="rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              step="0.01"
              min={0}
              name="valor"
              placeholder="Valor (R$)"
              required
              className="rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
            />
            <select name="tipo" className="rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm">
              <option value="sinal">Sinal</option>
              <option value="parcela">Parcela</option>
              <option value="taxa">Taxa</option>
            </select>
            {erro && <p className="text-sm text-red-600 sm:col-span-3">{erro}</p>}
            <div className="sm:col-span-3">
              <button
                type="submit"
                className="rounded-full bg-dipallacio-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-dipallacio-navy-800"
              >
                Salvar pagamento
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
