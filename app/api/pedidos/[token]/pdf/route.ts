import type { EstimativaPublica } from '@/lib/calculadora/publica'
import { obterPedidoPorToken, protocoloDe } from '@/lib/pedidos/service'
import { gerarPdfRelatorio } from '@/lib/relatorio/pdf'
import { erro } from '@/lib/http'
import { identificarCliente, limitarTaxa } from '@/lib/rateLimit'

export const runtime = 'nodejs'

// O PDF só é emitido para pedidos com pagamento confirmado; o token é o único segredo de acesso.
export async function GET(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!limitarTaxa(`pdf:${identificarCliente(request)}`, 20, 60_000)) {
    return erro('Muitas tentativas. Aguarde.', 429)
  }
  const { token } = await params
  const pedido = await obterPedidoPorToken(token)
  if (!pedido) return erro('Pedido não encontrado', 404)
  if (pedido.status !== 'pago') return erro('O relatório é liberado após a confirmação do pagamento.', 402)

  const protocolo = protocoloDe(pedido.id)
  const bytes = await gerarPdfRelatorio({
    protocolo,
    emitidoEm: new Date(),
    pagoEm: pedido.pagoEm,
    valorCentavos: pedido.valorCentavos,
    nome: pedido.nome,
    email: pedido.email,
    whatsapp: pedido.whatsapp,
    empreendimento: pedido.empreendimento,
    numeroCota: pedido.numeroCota,
    estimativa: pedido.resultado as unknown as EstimativaPublica,
  })

  return new Response(Buffer.from(bytes), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `attachment; filename="relatorio-estimativa-${protocolo}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  })
}
