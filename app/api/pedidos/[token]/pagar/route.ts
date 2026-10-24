import { prisma } from '@/lib/prisma/client'
import { criarPreferencia } from '@/lib/pagamentos/mercadopago'
import { obterPedidoPorToken } from '@/lib/pedidos/service'
import { SITE_URL } from '@/lib/site/config'
import { erro, json } from '@/lib/http'
import { identificarCliente, limitarTaxa } from '@/lib/rateLimit'

export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!limitarTaxa(`pagar:${identificarCliente(request)}`, 10, 60_000)) {
    return erro('Muitas tentativas. Aguarde.', 429)
  }
  const { token } = await params
  const pedido = await obterPedidoPorToken(token)
  if (!pedido) return erro('Pedido não encontrado', 404)
  if (pedido.provider !== 'mercadopago') return erro('Este pedido usa Pix manual.', 400)
  if (pedido.status === 'pago') return json({ url: `/relatorio/${token}` })
  if (pedido.status === 'cancelado') return erro('Pedido cancelado.', 409)

  const mpToken = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!mpToken) return erro('Pagamento indisponível no momento.', 503)

  try {
    const pref = await criarPreferencia(pedido, SITE_URL, mpToken)
    await prisma.pedidoRelatorio.update({ where: { id: pedido.id }, data: { providerRef: pref.id } })
    return json({ url: pref.urlPagamento })
  } catch (e) {
    console.error('pagar: falha ao criar preferência', (e as Error).message)
    return erro('Não foi possível iniciar o pagamento agora. Tente novamente.', 502)
  }
}
