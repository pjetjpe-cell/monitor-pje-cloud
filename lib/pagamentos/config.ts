export type ModoPagamento = 'mercadopago' | 'pix_manual' | 'desabilitado'

const PRECO_PADRAO_CENTAVOS = 990

/** Preço fixo definido no servidor — o cliente nunca envia valor. */
export function precoRelatorioCentavos(env: Record<string, string | undefined> = process.env): number {
  const bruto = env.PRECO_RELATORIO_CENTAVOS
  if (!bruto) return PRECO_PADRAO_CENTAVOS
  const n = Number(bruto)
  return Number.isInteger(n) && n >= 100 && n <= 100_000 ? n : PRECO_PADRAO_CENTAVOS
}

/**
 * Mercado Pago (confirmação automática) quando há token; senão Pix manual com conferência
 * pelo admin quando a chave Pix está configurada; senão o checkout fica desabilitado.
 */
export function modoPagamento(env: Record<string, string | undefined> = process.env): ModoPagamento {
  if (env.MERCADOPAGO_ACCESS_TOKEN) return 'mercadopago'
  if (env.PIX_CHAVE && env.PIX_RECEBEDOR_NOME && env.PIX_CIDADE) return 'pix_manual'
  return 'desabilitado'
}

export function formatarCentavos(centavos: number): string {
  return (centavos / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
