import Link from 'next/link'
import { EMAIL_ALTERNATIVO, EMAIL_PRINCIPAL, NOME_ESCRITORIO, WHATSAPP_DISPLAY, WHATSAPP_LINK } from '@/lib/site/config'
import Crest from '@/components/site/Crest'

export default function Footer() {
  return (
    <footer className="mt-24 border-t border-dipallacio-navy-800/10 bg-dipallacio-navy-950 text-dipallacio-cream/80">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <Link href="/" className="flex items-center gap-2.5" aria-label={`${NOME_ESCRITORIO} — início`}>
            <Crest className="h-10 w-10 shrink-0" shield="#f7f4ec" lines="#b8863e" />
            <span className="font-serif text-lg text-white">{NOME_ESCRITORIO}</span>
          </Link>
          <p className="mt-3 text-sm">
            Atuação especializada em ações de distrato de multipropriedade contra grandes incorporadoras
            do setor.
          </p>
          <div className="mt-4 space-y-1 text-sm">
            <p>
              <a href={WHATSAPP_LINK} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                WhatsApp: {WHATSAPP_DISPLAY}
              </a>
            </p>
            <p>
              <a href={`mailto:${EMAIL_PRINCIPAL}`} className="hover:text-white">
                {EMAIL_PRINCIPAL}
              </a>
            </p>
            <p>
              <a href={`mailto:${EMAIL_ALTERNATIVO}`} className="hover:text-white">
                {EMAIL_ALTERNATIVO}
              </a>
            </p>
          </div>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Plataforma</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li><Link href="/distrato" className="hover:text-white">Quero fazer distrato</Link></li>
            <li><Link href="/venda-de-cotas" className="hover:text-white">Venda de cotas</Link></li>
            <li><Link href="/trocas" className="hover:text-white">Trocas</Link></li>
            <li><Link href="/calendario" className="hover:text-white">Calendário</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Conteúdo</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li><Link href="/videos" className="hover:text-white">Vídeos</Link></li>
            <li><Link href="/blog" className="hover:text-white">Blog</Link></li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-white">Legal</p>
          <ul className="mt-2 space-y-2 text-sm">
            <li><Link href="/politica-de-privacidade" className="hover:text-white">Política de Privacidade</Link></li>
            <li><Link href="/termos" className="hover:text-white">Termos de Uso</Link></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 px-4 py-6">
        <div className="mx-auto flex max-w-6xl flex-col gap-1 text-xs text-dipallacio-cream/50 sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} {NOME_ESCRITORIO}. Todos os direitos reservados.</span>
          <span>Conteúdo institucional e educacional — não constitui aconselhamento jurídico individualizado.</span>
        </div>
      </div>
    </footer>
  )
}
