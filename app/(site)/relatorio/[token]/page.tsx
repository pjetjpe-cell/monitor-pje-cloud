import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import type { EstimativaPublica } from '@/lib/calculadora/publica'
import RelatorioPedido from '@/components/calculadora/RelatorioPedido'
import { dadosPixDoAmbiente, gerarPayloadPix, gerarQrDataUrl } from '@/lib/pagamentos/pix'
import { formatarCentavos } from '@/lib/pagamentos/config'
import { obterPedidoPorToken, protocoloDe } from '@/lib/pedidos/service'
import { moeda } from '@/lib/relatorio/formato'
import { whatsappEscritorio } from '@/lib/site/config'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Seu relatório de estimativa', robots: { index: false, follow: false } }

export default async function RelatorioPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const pedido = await obterPedidoPorToken(token)
  if (!pedido) notFound()

  const estimativa = pedido.resultado as unknown as EstimativaPublica
  const protocolo = protocoloDe(pedido.id)

  let pix: { payload: string; qr: string } | null = null
  if (pedido.provider === 'pix_manual' && pedido.status === 'aguardando_pagamento') {
    try {
      const payload = gerarPayloadPix(dadosPixDoAmbiente(pedido.valorCentavos, protocolo.replace('-', '')))
      pix = { payload, qr: await gerarQrDataUrl(payload) }
    } catch {
      pix = null
    }
  }

  const texto = `Olá! Meu protocolo é ${protocolo}. ${
    pedido.numeroCota ? `O número da minha cota/venda é ${pedido.numeroCota}.` : 'Vou enviar o número da minha cota.'
  }`

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <h1 className="font-serif text-3xl text-dipallacio-navy-900 sm:text-4xl">Seu relatório de estimativa</h1>
      <p className="mt-2 text-sm text-dipallacio-navy-800/70">{pedido.empreendimento}</p>
      <div className="mt-8">
        <RelatorioPedido
          token={token}
          protocolo={protocolo}
          statusInicial={pedido.status}
          provider={pedido.provider === 'mercadopago' ? 'mercadopago' : 'pix_manual'}
          valorLabel={formatarCentavos(pedido.valorCentavos)}
          faixaLabel={`${moeda(estimativa.faixa.minimo)} a ${moeda(estimativa.faixa.maximo)}`}
          pix={pix}
          whatsappHref={whatsappEscritorio(texto)}
        />
      </div>
    </div>
  )
}
