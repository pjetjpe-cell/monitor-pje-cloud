import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth/options'

const links = [
  { href: '/area-do-cliente', label: 'Visão geral' },
  { href: '/area-do-cliente/minhas-cotas', label: 'Minhas Cotas' },
  { href: '/area-do-cliente/calculadora', label: 'Calculadora de Distrato' },
  { href: '/area-do-cliente/meus-anuncios', label: 'Meus Anúncios' },
]

export default async function AreaDoClienteLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  const primeiroNome = session?.user.name?.split(' ')[0] ?? ''

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <p className="text-sm text-dipallacio-navy-800/60">Área do Cliente</p>
      <h1 className="font-serif text-3xl text-dipallacio-navy-900">Olá, {primeiroNome}</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1">
          {links.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block rounded-lg px-3 py-2 text-sm font-medium text-dipallacio-navy-800 hover:bg-dipallacio-navy-900/5"
            >
              {link.label}
            </Link>
          ))}
        </nav>
        <div>{children}</div>
      </div>
    </div>
  )
}
