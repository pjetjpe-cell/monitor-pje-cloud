import { informarPagamentoManual } from '@/lib/pedidos/service'
import { erro, json } from '@/lib/http'
import { identificarCliente, limitarTaxa } from '@/lib/rateLimit'

// Pix manual: o cliente avisa que pagou; o relatório só é liberado quando o escritório confere.
export async function POST(request: Request, { params }: { params: Promise<{ token: string }> }) {
  if (!limitarTaxa(`informar:${identificarCliente(request)}`, 10, 60_000)) {
    return erro('Muitas tentativas. Aguarde.', 429)
  }
  const { token } = await params
  const r = await informarPagamentoManual(token)
  if (r === 'nao_encontrado') return erro('Pedido não encontrado', 404)
  if (r === 'estado_invalido') return erro('Este pedido não está aguardando pagamento.', 409)
  return json({ ok: true })
}
