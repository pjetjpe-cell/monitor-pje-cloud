import { calculadoraPublicaDisponivel } from '@/lib/calculadora/publicaServidor'
import { modoPagamento, precoRelatorioCentavos } from '@/lib/pagamentos/config'
import { json } from '@/lib/http'

// Estado da calculadora pública (índices oficiais carregados? pagamento habilitado?) — consultado pela página.
export async function GET() {
  const calc = await calculadoraPublicaDisponivel().catch(() => ({ ok: false, motivo: 'Calculadora indisponível no momento.' }))
  return json({
    disponivel: calc.ok,
    motivo: calc.motivo ?? null,
    pagamentoDisponivel: modoPagamento() !== 'desabilitado',
    precoCentavos: precoRelatorioCentavos(),
  })
}
