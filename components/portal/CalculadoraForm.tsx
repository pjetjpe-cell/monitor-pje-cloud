'use client'

import { useState, useId } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid } from 'recharts'
import Disclaimer from '@/components/site/Disclaimer'
import LeadForm from '@/components/site/LeadForm'

interface CotaOpcao {
  id: string
  label: string
}

interface Cenario {
  nome: 'conservador' | 'intermediario' | 'otimista'
  percentualRetencao: number
  percentualRestituicao: number
  valorSemJuros: number
  valorComJurosTeseA: number
  valorComJurosTeseB: number
}

interface Resultado {
  totalAtualizadoPago: number
  baseRestituicao: number
  cenarios: Cenario[]
}

const nomeLabel: Record<Cenario['nome'], string> = {
  conservador: 'Conservador',
  intermediario: 'Intermediário',
  otimista: 'Otimista',
}

function formatarMoeda(valor: number) {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export default function CalculadoraForm({ cotas }: { cotas: CotaOpcao[] }) {
  const [cotaId, setCotaId] = useState(cotas[0]?.id ?? '')
  const [meses, setMeses] = useState(18)
  const [incluirCorretagem, setIncluirCorretagem] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [carregando, setCarregando] = useState(false)
  const [erro, setErro] = useState('')
  const [mostrarLead, setMostrarLead] = useState(false)
  const cotaSelectId = useId()
  const mesesInputId = useId()

  async function calcular(e?: React.FormEvent) {
    e?.preventDefault()
    if (!cotaId) {
      setErro('Cadastre uma cota antes de simular.')
      return
    }
    setErro('')
    setCarregando(true)

    const res = await fetch('/api/calculo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cotaId,
        mesesEstimadosAteReferencia: meses,
        incluirCorretagemNaBase: incluirCorretagem,
      }),
    })
    const data = await res.json()
    setCarregando(false)

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível calcular.')
      return
    }

    setResultado(data.resultado)
    setMostrarLead(false)
  }

  const dadosGrafico =
    resultado?.cenarios.map(c => ({
      nome: nomeLabel[c.nome],
      'Sem juros': Number(c.valorSemJuros.toFixed(2)),
      'Com juros (Tese A)': Number(c.valorComJurosTeseA.toFixed(2)),
      'Com juros (Tese B)': Number(c.valorComJurosTeseB.toFixed(2)),
    })) ?? []

  const faixa = resultado
    ? {
        min: Math.min(...resultado.cenarios.map(c => c.valorSemJuros)),
        max: Math.max(...resultado.cenarios.map(c => Math.max(c.valorComJurosTeseA, c.valorComJurosTeseB))),
      }
    : null

  return (
    <div className="space-y-8">
      <form
        onSubmit={calcular}
        className="grid gap-4 rounded-xl border border-dipallacio-navy-800/10 bg-white p-6 sm:grid-cols-2"
      >
        <div>
          <label htmlFor={cotaSelectId} className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Cota</label>
          <select
            id={cotaSelectId}
            value={cotaId}
            onChange={e => setCotaId(e.target.value)}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm"
          >
            {cotas.map(c => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor={mesesInputId} className="mb-1 flex items-center justify-between text-sm font-medium text-dipallacio-navy-800">
            <span>Meses estimados até o fim do processo</span>
            <span className="text-dipallacio-petrol-600">{meses}</span>
          </label>
          <input
            id={mesesInputId}
            type="range"
            min={0}
            max={60}
            value={meses}
            onChange={e => setMeses(Number(e.target.value))}
            className="w-full"
          />
          <p className="mt-1 text-xs text-dipallacio-navy-800/50">
            Estimativa administrativa — o tempo real de tramitação varia por comarca e vara.
          </p>
        </div>

        <label className="flex items-center gap-2 text-sm text-dipallacio-navy-800 sm:col-span-2">
          <input
            type="checkbox"
            checked={incluirCorretagem}
            onChange={e => setIncluirCorretagem(e.target.checked)}
          />
          Incluir comissão de corretagem na base de restituição
        </label>

        {erro && <p className="text-sm text-red-600 sm:col-span-2">{erro}</p>}

        <div className="sm:col-span-2">
          <button
            type="submit"
            disabled={carregando || !cotaId}
            className="rounded-full bg-dipallacio-navy-900 px-6 py-3 text-sm font-medium text-white hover:bg-dipallacio-navy-800 disabled:opacity-50"
          >
            {carregando ? 'Calculando…' : 'Simular restituição'}
          </button>
        </div>
      </form>

      {resultado && faixa && (
        <div className="space-y-6">
          <div className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
            <p className="text-sm text-dipallacio-navy-800/60">Faixa estimada de restituição</p>
            <p className="mt-1 font-serif text-3xl text-dipallacio-navy-900">
              {formatarMoeda(faixa.min)} – {formatarMoeda(faixa.max)}
            </p>
            <p className="mt-2 text-xs text-dipallacio-navy-800/50">
              Total atualizado pago: {formatarMoeda(resultado.totalAtualizadoPago)} · Base de restituição:{' '}
              {formatarMoeda(resultado.baseRestituicao)}
            </p>
          </div>

          <div className="h-80 rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={dadosGrafico}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e46771a" />
                <XAxis dataKey="nome" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={v => `R$${(v / 1000).toFixed(0)}k`} />
                <Tooltip formatter={(value: number) => formatarMoeda(value)} />
                <Legend />
                <Bar dataKey="Sem juros" fill="#15335c" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Com juros (Tese A)" fill="#125e5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Com juros (Tese B)" fill="#b8863e" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="overflow-x-auto rounded-xl border border-dipallacio-navy-800/10 bg-white">
            <table className="w-full text-sm">
              <thead className="bg-dipallacio-navy-900/5 text-left text-dipallacio-navy-800">
                <tr>
                  <th className="px-4 py-3">Cenário</th>
                  <th className="px-4 py-3">Retenção</th>
                  <th className="px-4 py-3">Restituição</th>
                  <th className="px-4 py-3">Sem juros</th>
                  <th className="px-4 py-3">Com juros (Tese A)</th>
                  <th className="px-4 py-3">Com juros (Tese B)</th>
                </tr>
              </thead>
              <tbody>
                {resultado.cenarios.map(c => (
                  <tr key={c.nome} className="border-t border-dipallacio-navy-800/10">
                    <td className="px-4 py-3 font-medium text-dipallacio-navy-900">{nomeLabel[c.nome]}</td>
                    <td className="px-4 py-3">{(c.percentualRetencao * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">{(c.percentualRestituicao * 100).toFixed(0)}%</td>
                    <td className="px-4 py-3">{formatarMoeda(c.valorSemJuros)}</td>
                    <td className="px-4 py-3">{formatarMoeda(c.valorComJurosTeseA)}</td>
                    <td className="px-4 py-3">{formatarMoeda(c.valorComJurosTeseB)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <Disclaimer />

          {!mostrarLead ? (
            <button
              onClick={() => setMostrarLead(true)}
              className="rounded-full bg-dipallacio-gold px-6 py-3 text-sm font-semibold text-dipallacio-navy-950 transition-transform hover:scale-105"
            >
              Quero uma análise do meu caso com um advogado
            </button>
          ) : (
            <div className="rounded-xl border border-dipallacio-navy-800/10 bg-white p-6">
              <h3 className="font-serif text-xl text-dipallacio-navy-900">Solicitar análise</h3>
              <p className="mt-2 text-sm text-dipallacio-navy-800/70">
                Sua simulação será anexada para a equipe jurídica revisar manualmente antes de qualquer
                contato.
              </p>
              <div className="mt-4">
                <LeadForm origem="calculadora" detalhes={{ resultado, meses, incluirCorretagem }} />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
