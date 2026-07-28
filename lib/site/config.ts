// Identidade e contatos oficiais do escritório — fonte única de verdade,
// usada no header, footer, botão de WhatsApp, metadata e páginas legais.

export const NOME_ESCRITORIO = 'Di Pallacio Enterprise — Família & Associados'
export const NOME_ESCRITORIO_CURTO = 'Di Pallacio Enterprise'

export const EMAIL_PRINCIPAL = 'pjetjpe@gmail.com'
export const EMAIL_ALTERNATIVO = 'dipallacio@gmail.com'

export const WHATSAPP_NUMERO = process.env.WHATSAPP_NUMERO || '5581996232353'
export const WHATSAPP_DISPLAY = '(81) 99623-2353'
export const WHATSAPP_MENSAGEM_PADRAO =
  'Olá! Comprei uma cota de multipropriedade e gostaria de uma análise inicial gratuita sobre o distrato.'
export const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAGEM_PADRAO)}`

// Incorporadoras/empreendimentos que constituem o público-alvo típico do
// escritório — usados apenas em texto de marketing institucional. Os dados
// de exemplo no banco (seed) permanecem fictícios até o cadastro real via /admin.
export const INCORPORADORAS_ALVO = [
  'GAV Resorts',
  'Porto 2 Life',
  'Porto Alto',
  'Areya Barra',
  'Jeriquiá',
  'Oikos Maragogi',
  'Pitangui Beach Resort',
]
