import { entradaPublicaSchema, ErroEstimativa } from '@/lib/calculadora/publica'
import { estimarPublicamente } from '@/lib/calculadora/publicaServidor'
import { modoPagamento, precoRelatorioCentavos } from '@/lib/pagamentos/config'
import { erro, json } from '@/lib/http'
import { identificarCliente, limitarTaxa } from '@/lib/rateLimit'

// Prévia gratuita: devolve apenas a faixa estimada. A memória de cálculo e os cenários
// detalhados só existem no relatório pago.
export async function POST(request: Request) {
  if (!limitarTaxa(`previa:${identificarCliente(request)}`, 30, 60_000)) {
    return erro('Muitas simulações em pouco tempo. Aguarde um instante.', 429)
  }

  const corpo = await request.json().catch(() => null)
  const parsed = entradaPublicaSchema.safeParse(corpo)
  if (!parsed.success) {
    return erro(parsed.error.issues[0]?.message ?? 'Dados inválidos', 400)
  }

  try {
    const e = await estimarPublicamente(parsed.data)
    return json({
      faixa: e.faixa,
      totalPagoInformado: e.totais.totalPagoInformado,
      mesesEstimados: e.premissas.mesesEstimados,
      dataReferencia: e.premissas.dataReferencia,
      pagamentoDisponivel: modoPagamento() !== 'desabilitado',
      precoCentavos: precoRelatorioCentavos(),
    })
  } catch (e) {
    if (e instanceof ErroEstimativa) {
      return erro(e.message, e.codigo === 'indices_nao_oficiais' ? 503 : 422, { codigo: e.codigo })
    }
    console.error('previa: erro inesperado', (e as Error).message)
    return erro('Não foi possível calcular agora. Tente novamente.', 500)
  }
}
