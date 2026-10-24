import { z } from 'zod'
import { exigirAdminApi } from '@/lib/auth/admin'
import { cancelarPedido, marcarPago } from '@/lib/pedidos/service'
import { erro, json } from '@/lib/http'

const schema = z.object({ acao: z.enum(['confirmar', 'cancelar']) })

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { erro: negado } = await exigirAdminApi()
  if (negado) return negado

  const { id } = await params
  const parsed = schema.safeParse(await request.json().catch(() => null))
  if (!parsed.success) return erro('Ação inválida', 400)

  const alterou = parsed.data.acao === 'confirmar' ? await marcarPago(id) : await cancelarPedido(id)
  if (!alterou) return erro('Pedido não encontrado ou já finalizado.', 409)
  return json({ ok: true })
}
