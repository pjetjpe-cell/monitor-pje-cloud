'use client'

import { useState, Suspense } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl = searchParams.get('callbackUrl') || '/area-do-cliente'

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [erro, setErro] = useState('')
  const [carregando, setCarregando] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErro('')
    setCarregando(true)

    const resultado = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setCarregando(false)

    if (resultado?.error) {
      setErro('E-mail ou senha inválidos.')
      return
    }

    router.push(callbackUrl)
    router.refresh()
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Entrar</h1>
      <p className="mt-2 text-sm text-dipallacio-navy-800/70">
        Acesse sua área do cliente para cadastrar cotas e simular seu distrato.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">E-mail</label>
          <input
            required
            type="email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-dipallacio-navy-800">Senha</label>
          <input
            required
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg border border-dipallacio-navy-800/20 bg-white px-3 py-2 text-sm focus:border-dipallacio-petrol-600 focus:outline-none"
          />
        </div>

        {erro && <p className="text-sm text-red-600">{erro}</p>}

        <button
          type="submit"
          disabled={carregando}
          className="w-full rounded-full bg-dipallacio-navy-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-dipallacio-navy-800 disabled:opacity-50"
        >
          {carregando ? 'Entrando…' : 'Entrar'}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-dipallacio-navy-800/70">
        Ainda não tem conta?{' '}
        <Link href="/cadastro" className="font-medium text-dipallacio-petrol-600 hover:underline">
          Criar conta
        </Link>
      </p>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  )
}
