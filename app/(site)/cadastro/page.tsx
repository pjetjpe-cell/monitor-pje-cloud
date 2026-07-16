'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function CadastroPage() {
  const router = useRouter()
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [aceite, setAceite] = useState(false)
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')

    if (!aceite) {
      setErro('É necessário aceitar a Política de Privacidade para continuar.')
      return
    }

    setCarregando(true)

    const res = await fetch('/api/auth/registrar', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...form, consentimento: true }),
    })
    const data = await res.json()

    if (!res.ok) {
      setErro(data.error ?? 'Não foi possível concluir o cadastro.')
      setCarregando(false)
      return
    }

    const resultado = await signIn('credentials', {
      email: form.email,
      password: form.password,
      redirect: false,
    })

    setCarregando(false)

    if (resultado?.error) {
      router.push('/login')
      return
    }

    router.push('/area-do-cliente')
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Criar conta</h1>
      <p className="mt-2 text-sm text-dipallacio-navy-800/70">
        Cadastre-se para registrar suas cotas, histórico de pagamentos e simular sua estimativa de
        distrato.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Nome completo</label>
          <input
            required
            value={form.name}
            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">E-mail</label>
          <input
            required
            type="email"
            value={form.email}
            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Telefone (opcional)</label>
          <input
            value={form.phone}
            onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Senha</label>
          <input
            required
            minLength={8}
            type="password"
            value={form.password}
            onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
          />
          <p className="mt-1 text-xs text-dipallacio-navy-800/50">Mínimo de 8 caracteres.</p>
        </div>

        <label className="flex items-start gap-2 text-xs text-dipallacio-navy-800/80">
          <input
            type="checkbox"
            checked={aceite}
            onChange={e => setAceite(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            Li e aceito a{' '}
            <Link href="/politica-de-privacidade" className="font-medium text-dipallacio-petrol-600 hover:underline">
              Política de Privacidade
            </Link>{' '}
            e autorizo o tratamento dos meus dados nos termos da LGPD.
          </span>
        </label>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-full bg-dipallacio-navy-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-dipallacio-navy-800 disabled:opacity-50"
        >
          {carregando ? 'Criando conta…' : 'Criar conta'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dipallacio-navy-800/70">
        Já tem conta?{' '}
        <Link href="/login" className="font-medium text-dipallacio-petrol-600 hover:underline">
          Entrar
        </Link>
      </p>
    </div>
  )
}
