import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Link from 'next/link'
import '../globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Monitor PJe Cloud',
  description: 'Monitoramento automático de processos judiciais eletrônicos',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} bg-slate-950 text-slate-100`}>
        <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
          <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-blue-600 flex items-center justify-center text-white font-bold text-sm">
              ⚖
            </div>
            <div>
              <h1 className="font-semibold text-slate-100 text-sm leading-none">Monitor PJe Cloud</h1>
              <p className="text-xs text-slate-500 mt-0.5">Alertas automáticos de movimentações</p>
            </div>
            <Link href="/" className="ml-auto text-xs text-slate-500 hover:text-slate-300 transition-colors">
              ← Site institucional
            </Link>
          </div>
        </header>
        <main className="max-w-5xl mx-auto px-4 py-8">
          {children}
        </main>
      </body>
    </html>
  )
}
