import { randomBytes } from 'crypto'
import { Prisma, type PedidoRelatorio } from '@prisma/client'
import { prisma } from '@/lib/prisma/client'
import type { EstimativaPublica } from '@/lib/calculadora/publica'
import { buscarPagamentosPorReferencia, pagamentoConfirmaPedido } from '@/lib/pagamentos/mercadopago'
import { tokenValido, type DadosPedido } from './schema'

export const novoToken = () => randomBytes(24).toString('base64url')

export const protocoloDe = (id: string) => `DP-${id.slice(-8).toUpperCase()}`

export async function criarPedido(
  dados: DadosPedido,
  estimativa: EstimativaPublica,
  provider: string,
  valorCentavos: number
): Promise<PedidoRelatorio> {
  const protocoloLead = `Relatório de estimativa (pedido novo) — ${estimativa.entrada.empreendimento}`

  const lead = await prisma.lead.create({
    data: {
      nome: dados.nome,
      contato: `${dados.whatsapp} / ${dados.email}`,
      empreendimento: estimativa.entrada.empreendimento,
      valorPagoAprox: estimativa.totais.totalPagoInformado,
      motivo: protocoloLead,
      origem: 'calculadora',
      status: 'novo',
      detalhes: {
        tipo: 'pedido_relatorio',
        numeroCota: dados.numeroCota ?? null,
        contratoUrl: dados.contratoUrl ?? null,
        faixa: estimativa.faixa,
      } as Prisma.InputJsonValue,
    },
  })

  return prisma.pedidoRelatorio.create({
    data: {
      token: novoToken(),
      valorCentavos,
      provider,
      nome: dados.nome,
      email: dados.email,
      whatsapp: dados.whatsapp,
      empreendimento: estimativa.entrada.empreendimento,
      numeroCota: dados.numeroCota,
      contratoUrl: dados.contratoUrl,
      entrada: estimativa.entrada as unknown as Prisma.InputJsonValue,
      resultado: estimativa as unknown as Prisma.InputJsonValue,
      leadId: lead.id,
      consentimentoEm: new Date(),
    },
  })
}

export async function obterPedidoPorToken(token: string): Promise<PedidoRelatorio | null> {
  if (!tokenValido(token)) return null
  return prisma.pedidoRelatorio.findUnique({ where: { token } })
}

/** Idempotente: só transiciona pedidos ainda não pagos; devolve true quando houve mudança. */
export async function marcarPago(pedidoId: string, paymentId?: string): Promise<boolean> {
  try {
    const r = await prisma.pedidoRelatorio.updateMany({
      where: { id: pedidoId, status: { in: ['aguardando_pagamento', 'aguardando_conferencia'] } },
      data: { status: 'pago', pagoEm: new Date(), ...(paymentId ? { paymentId } : {}) },
    })
    return r.count === 1
  } catch (e) {
    // paymentId já usado por outro pedido (índice único): nunca liberar dois relatórios com o mesmo pagamento
    if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') return false
    throw e
  }
}

export async function informarPagamentoManual(token: string): Promise<'ok' | 'nao_encontrado' | 'estado_invalido'> {
  if (!tokenValido(token)) return 'nao_encontrado'
  const r = await prisma.pedidoRelatorio.updateMany({
    where: { token, provider: 'pix_manual', status: 'aguardando_pagamento' },
    data: { status: 'aguardando_conferencia' },
  })
  if (r.count === 1) return 'ok'
  const existe = await prisma.pedidoRelatorio.findUnique({ where: { token }, select: { id: true } })
  return existe ? 'estado_invalido' : 'nao_encontrado'
}

export async function cancelarPedido(id: string): Promise<boolean> {
  const r = await prisma.pedidoRelatorio.updateMany({
    where: { id, status: { in: ['aguardando_pagamento', 'aguardando_conferencia'] } },
    data: { status: 'cancelado' },
  })
  return r.count === 1
}

/**
 * Confere no Mercado Pago (server-to-server) se há pagamento aprovado para o pedido.
 * Falhas de rede/API não alteram o pedido — o webhook ou a próxima consulta tentam de novo.
 */
export async function sincronizarMercadoPago(
  pedido: PedidoRelatorio,
  fetchImpl: typeof fetch = fetch
): Promise<PedidoRelatorio> {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token || pedido.provider !== 'mercadopago' || pedido.status === 'pago' || pedido.status === 'cancelado') {
    return pedido
  }
  try {
    const pagamentos = await buscarPagamentosPorReferencia(pedido.id, token, fetchImpl)
    const aprovado = pagamentos.find(p => pagamentoConfirmaPedido(p, pedido).ok)
    if (aprovado) {
      await marcarPago(pedido.id, String(aprovado.id))
      return (await prisma.pedidoRelatorio.findUnique({ where: { id: pedido.id } })) ?? pedido
    }
  } catch {
    // mantém o estado atual
  }
  return pedido
}
