// Integração mínima com o Mercado Pago (Checkout Pro). A confirmação de pagamento é SEMPRE
// verificada consultando a API do MP com o nosso token — nunca confiamos em parâmetros
// de URL nem no corpo do webhook.

const API = 'https://api.mercadopago.com'

export interface PagamentoMp {
  id: number
  status: string
  status_detail?: string
  external_reference?: string | null
  transaction_amount: number
  currency_id: string
}

export interface PedidoParaPagamento {
  id: string
  token: string
  valorCentavos: number
  nome: string
  email: string
}

async function chamar<T>(
  caminho: string,
  token: string,
  fetchImpl: typeof fetch,
  init: RequestInit = {}
): Promise<T> {
  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), 20_000)
  try {
    const res = await fetchImpl(`${API}${caminho}`, {
      ...init,
      signal: controle.signal,
      cache: 'no-store',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        ...(init.headers ?? {}),
      },
    })
    if (!res.ok) {
      const erro = new Error(`Mercado Pago respondeu HTTP ${res.status}`) as Error & { status?: number }
      erro.status = res.status
      throw erro
    }
    return (await res.json()) as T
  } finally {
    clearTimeout(timer)
  }
}

export async function criarPreferencia(
  pedido: PedidoParaPagamento,
  siteUrl: string,
  token: string,
  fetchImpl: typeof fetch = fetch
): Promise<{ id: string; urlPagamento: string }> {
  const base = siteUrl.replace(/\/$/, '')
  const retorno = `${base}/relatorio/${pedido.token}`
  const https = base.startsWith('https://')

  const corpo = {
    items: [
      {
        id: 'relatorio-estimativa',
        title: 'Relatório detalhado de estimativa — Di Pallacio Enterprise',
        quantity: 1,
        unit_price: pedido.valorCentavos / 100,
        currency_id: 'BRL',
      },
    ],
    external_reference: pedido.id,
    payer: { name: pedido.nome, email: pedido.email },
    back_urls: { success: retorno, pending: retorno, failure: retorno },
    ...(https ? { auto_return: 'approved' } : {}),
    notification_url: `${base}/api/pagamentos/mercadopago/webhook`,
    statement_descriptor: 'DIPALLACIO',
    payment_methods: { excluded_payment_types: [{ id: 'ticket' }], installments: 1 },
  }

  const resp = await chamar<{ id: string; init_point: string; sandbox_init_point?: string }>(
    '/checkout/preferences',
    token,
    fetchImpl,
    { method: 'POST', body: JSON.stringify(corpo) }
  )

  const usaSandbox = token.startsWith('TEST-')
  return { id: resp.id, urlPagamento: usaSandbox && resp.sandbox_init_point ? resp.sandbox_init_point : resp.init_point }
}

export async function buscarPagamento(
  paymentId: string,
  token: string,
  fetchImpl: typeof fetch = fetch
): Promise<PagamentoMp> {
  if (!/^\d{1,20}$/.test(paymentId)) throw new Error('ID de pagamento inválido')
  return chamar<PagamentoMp>(`/v1/payments/${paymentId}`, token, fetchImpl)
}

export async function buscarPagamentosPorReferencia(
  externalReference: string,
  token: string,
  fetchImpl: typeof fetch = fetch
): Promise<PagamentoMp[]> {
  const resp = await chamar<{ results?: PagamentoMp[] }>(
    `/v1/payments/search?external_reference=${encodeURIComponent(externalReference)}&sort=date_created&criteria=desc`,
    token,
    fetchImpl
  )
  return resp.results ?? []
}

/** Verificação pura: o pagamento é aprovado, em BRL, do valor do pedido e referente a ele? */
export function pagamentoConfirmaPedido(
  pagamento: PagamentoMp,
  pedido: { id: string; valorCentavos: number }
): { ok: true } | { ok: false; motivo: string } {
  if (pagamento.status !== 'approved') return { ok: false, motivo: `status ${pagamento.status}` }
  if (pagamento.external_reference !== pedido.id) return { ok: false, motivo: 'referência diferente do pedido' }
  if (pagamento.currency_id !== 'BRL') return { ok: false, motivo: 'moeda diferente de BRL' }
  if (Math.round(pagamento.transaction_amount * 100) !== pedido.valorCentavos) {
    return { ok: false, motivo: 'valor diferente do pedido' }
  }
  return { ok: true }
}
