import { WHATSAPP_LINK } from '@/lib/site/config'

export default function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_LINK}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-white shadow-lg shadow-black/20 transition-transform hover:scale-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-dipallacio-navy-900"
      aria-label="Falar com um advogado pelo WhatsApp"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
        <path d="M12.01 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.36 5.07L2 22l5.06-1.33A9.94 9.94 0 0 0 12.01 22C17.53 22 22 17.52 22 12S17.53 2 12.01 2Zm5.79 14.14c-.24.68-1.4 1.3-1.93 1.36-.5.06-1.02.28-3.4-.71-2.86-1.19-4.7-4.09-4.84-4.28-.14-.19-1.16-1.54-1.16-2.94s.72-2.09.98-2.38c.25-.28.55-.35.73-.35h.53c.17 0 .4-.03.62.48.24.56.8 1.96.87 2.1.07.14.12.31.02.5-.1.19-.15.31-.3.48-.15.17-.31.38-.44.51-.15.15-.3.31-.13.6.17.29.75 1.24 1.62 2.01 1.11.99 2.05 1.3 2.34 1.45.29.15.46.13.63-.08.17-.2.72-.84.91-1.13.19-.28.38-.24.63-.14.26.1 1.65.78 1.93.92.29.15.48.22.55.34.07.13.07.72-.17 1.4Z" />
      </svg>
      <span className="hidden sm:inline text-sm font-medium">Fale com um advogado</span>
    </a>
  )
}
