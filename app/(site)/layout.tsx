import type { Metadata } from 'next'
import { Playfair_Display, Work_Sans } from 'next/font/google'
import '../globals.css'
import SessionProviderWrapper from '@/components/SessionProviderWrapper'
import Header from '@/components/site/Header'
import Footer from '@/components/site/Footer'
import WhatsAppButton from '@/components/site/WhatsAppButton'
import { NOME_ESCRITORIO } from '@/lib/site/config'

const serif = Playfair_Display({ subsets: ['latin'], variable: '--font-dipallacio-serif' })
const sans = Work_Sans({ subsets: ['latin'], variable: '--font-dipallacio-sans' })

export const metadata: Metadata = {
  title: `${NOME_ESCRITORIO} — Distrato de Multipropriedade`,
  description:
    'Assessoria jurídica especializada em distrato de multipropriedade (timeshare): restituição de valores, cláusulas abusivas e mercado secundário de cotas.',
}

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${serif.variable} ${sans.variable}`}>
      <body className="min-h-screen bg-dipallacio-cream font-sans text-dipallacio-navy-900 antialiased">
        <SessionProviderWrapper>
          <Header />
          <main>{children}</main>
          <Footer />
          <WhatsAppButton />
        </SessionProviderWrapper>
      </body>
    </html>
  )
}
