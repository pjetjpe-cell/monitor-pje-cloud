'use client'

import { useState, useEffect } from 'react'
import type { ProcessoMonitorado } from '@/lib/storage/kv'

export default function Dashboard() {
  const [processos, setProcessos] = useState<ProcessoMonitorado[]>([])
  const [loading, setLoading] = useState(true)
  const [adicionando, setAdicionando] = useState(false)
  const [form, setForm] = useState({ numeroProcesso: '', tribunal: '', apelido: '' })
  const [erro, setErro] = useState('')
  const [sucesso, setSucesso] = useState('')

  async function carregar() {
    setLoading(true)
    const res = await fetch('/api/processos')
    const data = await res.json()
    setProcessos(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { carregar() }, [])

  async function handleAdicionar(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setSucesso('')
    setAdicionando(true)

    const res = await fetch('/api/processos', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(form),
    })
    const data = await res.json()

    if (res.ok) {
      setSucesso(`Processo ${data.processo?.numeroProcesso} cadastrado com sucesso!`)
      setForm({ numeroProcesso: '', tribunal: '', apelido: '' })
      await carregar()
    } else {
      setErro(data.error ?? 'Erro ao cadastrar processo')
    }
    setAdicionando(false)
  }

  async function handleRemover(numeroProcesso: string) {
    if (!confirm(`Remover o processo ${numeroProcesso} do monitoramento?`)) return
    await fetch(`/api/processos?numeroProcesso=${encodeURIComponent(numeroProcesso)}`, {
      method: 'DELETE',
    })
    await carregar()
  }

  return (
    <div className="space-y-8">
      {/* Cabeçalho */}
      <div>
        <h2 className="text-2xl font-bold text-slate-100">Processos Monitorados</h2>
        <p className="text-slate-400 mt-1">
          Alertas enviados via Telegram · Verificação automática a cada 30 min
        </p>
      </div>

      {/* Formulário de cadastro */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
        <h3 className="font-semibold text-slate-200 mb-4">Adicionar Processo</h3>
        <form onSubmit={handleAdicionar} className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-1">
            <label className="text-xs text-slate-400 mb-1 block">Número do Processo *</label>
            <input
              required
              placeholder="0000000-00.0000.0.00.0000"
              value={form.numeroProcesso}
              onChange={e => setForm(f => ({ ...f, numeroProcesso: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Tribunal (opcional)</label>
            <input
              placeholder="Ex: TJSP, TRF1, TJBA"
              value={form.tribunal}
              onChange={e => setForm(f => ({ ...f, tribunal: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-slate-400 mb-1 block">Apelido (opcional)</label>
            <input
              placeholder="Ex: GAV Resorts"
              value={form.apelido}
              onChange={e => setForm(f => ({ ...f, apelido: e.target.value }))}
              className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div className="md:col-span-3 flex items-center gap-3">
            <button
              type="submit"
              disabled={adicionando}
              className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium px-5 py-2 rounded-lg text-sm transition-colors"
            >
              {adicionando ? 'Verificando no DataJud…' : 'Monitorar Processo'}
            </button>
            {erro && <p className="text-red-400 text-sm">{erro}</p>}
            {sucesso && <p className="text-green-400 text-sm">{sucesso}</p>}
          </div>
        </form>
      </div>

      {/* Lista de processos */}
      {loading ? (
        <div className="text-slate-500 text-sm">Carregando…</div>
      ) : processos.length === 0 ? (
        <div className="bg-slate-900 border border-dashed border-slate-700 rounded-xl p-12 text-center">
          <div className="text-4xl mb-3">⚖️</div>
          <p className="text-slate-400">Nenhum processo monitorado ainda.</p>
          <p className="text-slate-500 text-sm mt-1">Adicione o número de um processo acima.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {processos.map(proc => (
            <div
              key={proc.numeroProcesso}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex items-center justify-between gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${proc.ativo ? 'bg-green-500' : 'bg-slate-600'}`} />
                  <code className="text-sm font-mono text-slate-200">{proc.numeroProcesso}</code>
                  {proc.tribunal && (
                    <span className="bg-blue-900/50 text-blue-300 text-xs px-2 py-0.5 rounded">
                      {proc.tribunal}
                    </span>
                  )}
                  {proc.apelido && (
                    <span className="text-slate-400 text-sm">— {proc.apelido}</span>
                  )}
                </div>
                <div className="mt-1 text-xs text-slate-500 flex gap-4">
                  {proc.ultimaMovimentacaoVista && (
                    <span>
                      Última mov: {new Date(proc.ultimaMovimentacaoVista).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit', month: '2-digit', year: 'numeric',
                      })}
                    </span>
                  )}
                  {proc.ultimaChecagem && (
                    <span>
                      Checado: {new Date(proc.ultimaChecagem).toLocaleString('pt-BR', {
                        timeZone: 'America/Sao_Paulo',
                        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  )}
                </div>
              </div>
              <button
                onClick={() => handleRemover(proc.numeroProcesso)}
                className="text-slate-500 hover:text-red-400 transition-colors text-sm"
              >
                Remover
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Instruções de configuração */}
      <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6 text-sm text-slate-400 space-y-2">
        <p className="font-medium text-slate-300">Como configurar os alertas no Telegram</p>
        <ol className="list-decimal list-inside space-y-1 text-xs">
          <li>Fale com <code className="text-blue-400">@BotFather</code> no Telegram e crie um bot (<code>/newbot</code>)</li>
          <li>Copie o token e defina como variável de ambiente: <code className="text-blue-400">TELEGRAM_BOT_TOKEN</code></li>
          <li>Mande uma mensagem para o bot e acesse <code className="text-blue-400">api.telegram.org/bot[TOKEN]/getUpdates</code></li>
          <li>Copie o <code>chat_id</code> e defina: <code className="text-blue-400">TELEGRAM_CHAT_ID</code></li>
          <li>Configure também <code className="text-blue-400">KV_URL</code> no Vercel (Vercel KV ou Upstash Redis)</li>
        </ol>
      </div>
    </div>
  )
}
