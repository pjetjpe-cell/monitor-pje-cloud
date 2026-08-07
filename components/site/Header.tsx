'use client'

import Link from 'next/link'
import { useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { NOME_ESCRITORIO_CURTO } from '@/lib/site/config'
import Crest from '@/components/site/Crest'

const navLinks = [
  { href: '/distrato', label: 'Distrato' },
  { href: '/venda-de-cotas', label: 'Venda de Cotas' },
  { href: '/trocas', label: 'Trocas' },
  { href: '/calendario', label: 'Calendário' },
  { href: '/videos', label: 'Vídeos' },
  { href: '/blog', label: 'Blog' },
]

export default function Header() {
  const { data: session } = useSession()
  const [menuAberto, setMenuAberto] = useState(false)

  return (
    <header className="sticky top-0 z-30 border-b border-dipallacio-navy-800/10 bg-dipallacio-cream/95 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-4">
        <Link href="/" className="flex items-center gap-2.5" aria-label={`${NOME_ESCRITORIO_CURTO} — início`}>
          <Crest className="h-9 w-9 shrink-0" />
          <span className="flex flex-col leading-tight">
            <span className="font-serif text-lg font-semibold text-dipallacio-navy-900">Di Pallacio</span>
            <span className="text-[11px] uppercase tracking-wide text-dipallacio-navy-800/60">
              Enterprise · Família &amp; Associados
            </span>
          </span>
        </Link>

        <nav className="hidden items-center gap-6 lg:flex">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sm font-medium text-dipallacio-navy-800 hover:text-dipallacio-petrol-600"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 lg:flex">
          {session ? (
            <>
              <Link
                href="/area-do-cliente"
                className="text-sm font-medium text-dipallacio-navy-800 hover:text-dipallacio-petrol-600"
              >
                Área do Cliente
              </Link>
              {session.user.role === 'admin' && (
                <Link
                  href="/admin"
                  className="text-sm font-medium text-dipallacio-navy-800 hover:text-dipallacio-petrol-600"
                >
                  Admin
                </Link>
              )}
              <button
                onClick={() => signOut({ callbackUrl: '/' })}
                className="text-sm text-dipallacio-navy-800/70 hover:text-dipallacio-navy-900"
              >
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="text-sm font-medium text-dipallacio-navy-800 hover:text-dipallacio-petrol-600"
              >
                Entrar
              </Link>
              <Link
                href="/cadastro"
                className="rounded-full bg-dipallacio-navy-900 px-4 py-2 text-sm font-medium text-white hover:bg-dipallacio-navy-800"
              >
                Criar conta
              </Link>
            </>
          )}
        </div>

        <button
          className="text-dipallacio-navy-900 lg:hidden"
          onClick={() => setMenuAberto(v => !v)}
          aria-label="Abrir menu"
          aria-expanded={menuAberto}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>

      {menuAberto && (
        <nav className="space-y-3 border-t border-dipallacio-navy-800/10 bg-dipallacio-cream px-4 py-4 lg:hidden">
          {navLinks.map(link => (
            <Link
              key={link.href}
              href={link.href}
              className="block text-sm font-medium text-dipallacio-navy-800"
              onClick={() => setMenuAberto(false)}
            >
              {link.label}
            </Link>
          ))}
          <div className="space-y-3 border-t border-dipallacio-navy-800/10 pt-3">
            {session ? (
              <>
                <Link href="/area-do-cliente" className="block text-sm font-medium text-dipallacio-navy-800">
                  Área do Cliente
                </Link>
                {session.user.role === 'admin' && (
                  <Link href="/admin" className="block text-sm font-medium text-dipallacio-navy-800">
                    Admin
                  </Link>
                )}
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="block text-sm text-dipallacio-navy-800/70"
                >
                  Sair
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="block text-sm font-medium text-dipallacio-navy-800">
                  Entrar
                </Link>
                <Link href="/cadastro" className="block text-sm font-medium text-dipallacio-navy-800">
                  Criar conta
                </Link>
              </>
            )}
          </div>
        </nav>
      )}
    </header>
  )
}
