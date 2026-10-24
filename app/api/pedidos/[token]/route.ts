import { obterPedidoPorToken, protocoloDe, sincronizarMercadoPago } from '@/lib/pedidos/service'
import { erro, json } from '@/lib/http'
import { identificarCliente, limitarTaxa } from '@/lib/rateLimit'

// Consulta de status (usada pelo polling da página do pedido).
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!limitarTaxa(`status:${identificarCliente(request)}`, 120, 60_000)) {
    return erro('Muitas consultas. Aguarde.', 429)
  }
  const { token } = await params
  let pedido = await obterPedidoPorToken(token)
  if (!pedido) return erro('Pedido não encontrado', 404)

  pedido = await sincronizarMercadoPago(pedido)
  return json({ status: pedido.status, protocolo: protocoloDe(pedido.id), provider: pedido.provider })
}
