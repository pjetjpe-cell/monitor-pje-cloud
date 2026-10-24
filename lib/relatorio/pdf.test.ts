import { describe, expect, it } from 'vitest'
import { mkdirSync, writeFileSync } from 'fs'
import { calcularEstimativaPublica, entradaPublicaSchema } from '../calculadora/publica'
import type { PontoIndice } from '../calculadora/types'
import { gerarPdfRelatorio, sanitizarWinAnsi } from './pdf'

// Série SINTÉTICA de teste — não representa o IPCA real.
function serie(): PontoIndice[] {
  const out: PontoIndice[] = []
  let v = 1000
  for (let a = 2018, m = 1; a < 2026 || m <= 10; ) {
    out.push({ indice: 'IPCA', competencia: new Date(Date.UTC(a, m - 1, 1)), numeroIndice: v })
    v *= 1.004
    if (++m > 12) {
      m = 1
      a++
    }
    if (a === 2026 && m > 10) break
  }
  return out
}

describe('gerarPdfRelatorio', () => {
  it('gera um PDF válido, multipágina quando há muitos pagamentos, com acentos', async () => {
    const parcelas = Array.from({ length: 60 }, (_, i) => ({
      data: new Date(Date.UTC(2019 + Math.floor(i / 12), i % 12, 10)).toISOString().slice(0, 10),
      valor: 650.5,
    }))
    const entrada = entradaPublicaSchema.parse({
      empreendimento: 'Porto 2 Life — Ação “teste” ✓',
      modo: 'detalhado',
      dataCompra: '2019-01-10',
      parcelas,
      valorCorretagem: 3000,
    })
    const estimativa = calcularEstimativaPublica(entrada, {
      serie: serie(),
      hoje: new Date('2026-10-15T12:00:00Z'),
      config: {
        percentualConservador: 0.5,
        percentualIntermediario: 0.75,
        percentualOtimista: 0.9,
        mesesEstimadosPadrao: 18,
        taxaSelicMensal: 0.01,
        taxaIpcaMensalEmbutida: 0.004,
        taxaJurosMensalSimples: 0.01,
      },
    })
    const bytes = await gerarPdfRelatorio({
      protocolo: 'DP-ABCD1234',
      emitidoEm: new Date('2026-10-15T15:00:00Z'),
      pagoEm: new Date('2026-10-15T14:00:00Z'),
      valorCentavos: 990,
      nome: 'Maria da Conceição Ávila',
      email: 'maria@example.com',
      whatsapp: '5581999990000',
      empreendimento: entrada.empreendimento,
      numeroCota: '123/45',
      estimativa,
    })
    expect(Buffer.from(bytes).subarray(0, 5).toString()).toBe('%PDF-')
    expect(bytes.length).toBeGreaterThan(5000)
    if (process.env.SALVAR_PDF_AMOSTRA) {
      mkdirSync(process.env.SALVAR_PDF_AMOSTRA, { recursive: true })
      writeFileSync(`${process.env.SALVAR_PDF_AMOSTRA}/amostra.pdf`, bytes)
    }
  })

  it('sanitiza caracteres fora do WinAnsi', () => {
    expect(sanitizarWinAnsi('Ação ✓ “x”')).not.toMatch(/✓/)
  })
})
