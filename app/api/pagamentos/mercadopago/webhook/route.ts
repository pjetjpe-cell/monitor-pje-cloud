import { prisma } from '@/lib/prisma/client'
import { buscarPagamento, pagamentoConfirmaPedido } from '@/lib/pagamentos/mercadopago'
import { marcarPago } from '@/lib/pedidos/service'
import { json } from '@/lib/http'

// Webhook do Mercado Pago. O conteúdo recebido serve só para descobrir o ID do pagamento;
// a aprovação é confirmada consultando a API do MP com o nosso token.
async function tratar(request: Request) {
  const url = new URL(request.url)
  const corpo = request.method === 'POST' ? await request.json().catch(() => null) : null

  const tipo = url.searchParams.get('type') ?? url.searchParams.get('topic') ?? corpo?.type ?? corpo?.topic
  if (tipo !== 'payment') return json({ ignorado: true })

  const idBruto =
    url.searchParams.get('data.id') ??
    corpo?.data?.id ??
    (url.searchParams.get('topic') === 'payment' ? url.searchParams.get('id') : null)
  const paymentId = idBruto == null ? '' : String(idBruto)
  if (!/^\d{1,20}$/.test(paymentId)) return json({ ignorado: true })

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!mpToken) return json({ ignorado: true })

  let pagamento
  try {
    pagamento = await buscarPagamento(paymentId, mpToken)
  } catch (e) {
    const status = (e as { status?: number }).status
    if (status === 404) return json({ ignorado: true }) // ex.: notificação de teste do painel do MP
    console.error('webhook mp: falha ao consultar pagamento', (e as Error).message)
    return json({ error: 'falha temporária' }, 500) // o MP tenta de novo
  }

  if (!pagamento.external_reference) return json({ ignorado: true })
  const pedido = await prisma.pedidoRelatorio.findUnique({ where: { id: pagamento.external_reference } })
  if (!pedido) return json({ ignorado: true })

  const verificacao = pagamentoConfirmaPedido(pagamento, pedido)
  if (verificacao.ok) await marcarPago(pedido.id, String(pagamento.id))
  return json({ processado: true })
}

export const POST = tratar
export const GET = tratar
