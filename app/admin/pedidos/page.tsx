import { prisma } from '@/lib/prisma/client'
import PedidosTable, { type PedidoLinha } from '@/components/admin/PedidosTable'
import type { EstimativaPublica } from '@/lib/calculadora/publica'
import { protocoloDe } from '@/lib/pedidos/service'
import { formatarCentavos, modoPagamento } from '@/lib/pagamentos/config'
import { dataHoraBr, formatarWhatsapp, moeda } from '@/lib/relatorio/formato'
import { whatsappParaCliente } from '@/lib/site/config'

export const dynamic = 'force-dynamic'

const modoRotulo = {
  mercadopago: 'Mercado Pago (confirmação automática)',
  pix_manual: 'Pix manual (você confirma aqui)',
  desabilitado: 'Desabilitado — configure PIX_* ou MERCADOPAGO_ACCESS_TOKEN para abrir a venda',
} as const

export default async function AdminPedidosPage() {
  const pedidos = await prisma.pedidoRelatorio.findMany({ orderBy: { createdAt: 'desc' }, take: 100 })
  const linhas: PedidoLinha[] = pedidos.map(p => {
    const e = p.resultado as unknown as EstimativaPublica
    const protocolo = protocoloDe(p.id)
    return {
      id: p.id,
      protocolo,
      status: p.status,
      provider: p.provider,
      valor: formatarCentavos(p.valorCentavos),
      nome: p.nome,
      email: p.email,
      whatsapp: formatarWhatsapp(p.whatsapp),
      whatsappLink: whatsappParaCliente(p.whatsapp, `Olá, ${p.nome.split(' ')[0]}! Aqui é do escritório Di Pallacio. Sobre o seu relatório ${protocolo}:`),
      empreendimento: p.empreendimento,
      numeroCota: p.numeroCota,
      contratoUrl: p.contratoUrl,
      faixa: `${moeda(e.faixa.minimo)} a ${moeda(e.faixa.maximo)}`,
      criadoEm: dataHoraBr(p.createdAt),
      token: p.token,
    }
  })

  return (
    <div>
      <h1 className="font-serif text-2xl text-slate-900">Pedidos de relatório</h1>
      <p className="mt-1 text-sm text-slate-500">
        Modo de pagamento atual: <strong>{modoRotulo[modoPagamento()]}</strong>
      </p>
      <div className="mt-6">
        <PedidosTable pedidos={linhas} />
      </div>
    </div>
  )
}
