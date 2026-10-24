import { ErroEstimativa } from '@/lib/calculadora/publica'
import { estimarPublicamente } from '@/lib/calculadora/publicaServidor'
import { modoPagamento, precoRelatorioCentavos } from '@/lib/pagamentos/config'
import { pedidoSchema } from '@/lib/pedidos/schema'
import { criarPedido } from '@/lib/pedidos/service'
import { erro, json } from '@/lib/http'
import { identificarCliente, limitarTaxa } from '@/lib/rateLimit'

export async function POST(request: Request) {
  const modo = modoPagamento()
  if (modo === 'desabilitado') {
    return erro('O pagamento do relatório ainda não está disponível. Fale com o escritório pelo WhatsApp.', 503)
  }

  if (!limitarTaxa(`pedido:${identificarCliente(request)}`, 6, 10 * 60_000)) {
    return erro('Muitos pedidos em pouco tempo. Tente novamente em alguns minutos.', 429)
  }

  const corpo = await request.json().catch(() => null)
  const parsed = pedidoSchema.safeParse(corpo)
  if (!parsed.success) {
    return erro(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400)
  }

  try {
    // O resultado é recalculado aqui: nada vindo do navegador (valores, faixa, preço) é confiado.
    const estimativa = await estimarPublicamente(parsed.data.entrada)
    const pedido = await criarPedido(parsed.data, estimativa, modo, precoRelatorioCentavos())
    return json({ token: pedido.token, url: `/relatorio/${pedido.token}` }, 201)
  } catch (e) {
    if (e instanceof ErroEstimativa) {
      return erro(e.message, e.codigo === 'indices_nao_oficiais' ? 503 : 422, { codigo: e.codigo })
    }
    console.error('pedido: erro inesperado', (e as Error).message)
    return erro('Não foi possível registrar o pedido agora. Tente novamente.', 500)
  }
}
