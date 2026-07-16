import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import '../globals.css'
import { exigirAdmin } from '@/lib/auth/admin'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import SairButton from '@/components/admin/SairButton'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Painel Admin — Di Pallacio Enterprise',
}

const links = [
  { href: '/admin', label: 'Visão geral' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/anuncios', label: 'Moderação de Anúncios' },
  { href: '/admin/empreendimentos', label: 'Empreendimentos' },
  { href: '/admin/indices', label: 'Índices (INCC/IPCA)' },
  { href: '/admin/videos', label: 'Vídeos' },
  { href: '/admin/artigos', label: 'Artigos' },
  { href: '/admin/calculadora', label: 'Parâmetros da Calculadora' },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await exigirAdmin()

  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen bg-slate-50 text-slate-900 antialiased`}>
        <SessionProviderWrapper>
          <div className="flex min-h-screen">
            <aside className="w-64 shrink-0 border-r border-slate-200 bg-white">
              <div className="border-b border-slate-200 px-6 py-5">
                <p className="font-serif text-lg text-dipallacio-navy-900">Di Pallacio</p>
                <p className="text-xs text-slate-500">Painel administrativo</p>
              </div>
              <nav className="space-y-1 px-3 py-4">
                {links.map(link => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
              <div className="border-t border-slate-200 px-6 py-4">
                <p className="text-xs text-slate-500">{session.user.name}</p>
                <SairButton />
              </div>
            </aside>
            <main className="flex-1 px-8 py-8">{children}</main>
          </div>
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
