import { z } from 'zod'
import { entradaPublicaSchema } from '@/lib/calculadora/publica'

/** Normaliza para o formato internacional brasileiro (55 + DDD + número) ou devolve null. */
export function normalizarWhatsapp(entrada: string): string | null {
  const digitos = entrada.replace(/\D/g, '')
  if (digitos.length === 10 || digitos.length === 11) return `55${digitos}`
  if ((digitos.length === 12 || digitos.length === 13) && digitos.startsWith('55')) return digitos
  return null
}

/** Só aceitamos anexos hospedados no Blob da Vercel (evita links arbitrários no painel admin). */
export function urlAnexoValida(url: string): boolean {
  try {
    const u = new URL(url)
    return u.protocol === 'https:' && u.hostname.endsWith('.blob.vercel-storage.com')
  } catch {
    return false
  }
}

const TOKEN_REGEX = /^[A-Za-z0-9_-]{20,64}$/
export function tokenValido(token: string): boolean {
  return TOKEN_REGEX.test(token)
}

export const pedidoSchema = z.object({
  nome: z.string().trim().min(3, 'Informe seu nome completo').max(120),
  email: z.string().trim().toLowerCase().email('E-mail inválido').max(160),
  whatsapp: z
    .string()
    .trim()
    .max(30)
    .transform(v => normalizarWhatsapp(v))
    .refine((v): v is string => v !== null, 'WhatsApp inválido — informe DDD + número'),
  numeroCota: z
    .string()
    .trim()
    .max(60)
    .optional()
    .transform(v => (v ? v : undefined)),
  contratoUrl: z
    .string()
    .trim()
    .max(500)
    .optional()
    .transform(v => (v ? v : undefined))
    .refine(v => v === undefined || urlAnexoValida(v), 'Anexo inválido'),
  consentimento: z.literal(true, { errorMap: () => ({ message: 'É necessário aceitar a Política de Privacidade' }) }),
  entrada: entradaPublicaSchema,
})

export type DadosPedido = z.infer<typeof pedidoSchema>
