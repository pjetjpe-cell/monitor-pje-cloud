import { describe, expect, it } from 'vitest'
import {
  calcularEstimativaPublica,
  entradaPublicaSchema,
  ErroEstimativa,
  parseDataIso,
  type ConfigCalculo,
  type EntradaPublica,
} from './publica'
import { detalharCorrecao, corrigirPagamento, verificarCobertura } from './correcaoMonetaria'
import type { PontoIndice } from './types'

// Série SINTÉTICA de teste (crescimento de 0,4% a.m.) — não representa o IPCA real.
function serieSintetica(inicio = [2018, 1], fim = [2026, 10]): PontoIndice[] {
  const pontos: PontoIndice[] = []
  let valor = 1000
  let [ano, mes] = inicio
  while (ano < fim[0] || (ano === fim[0] && mes <= fim[1])) {
    pontos.push({ indice: 'IPCA', competencia: new Date(Date.UTC(ano, mes - 1, 1)), numeroIndice: valor })
    valor *= 1.004
    mes++
    if (mes > 12) {
      mes = 1
      ano++
    }
  }
  return pontos
}

const config: ConfigCalculo = {
  percentualConservador: 0.5,
  percentualIntermediario: 0.75,
  percentualOtimista: 0.9,
  mesesEstimadosPadrao: 18,
  taxaSelicMensal: 0.01,
  taxaIpcaMensalEmbutida: 0.004,
  taxaJurosMensalSimples: 0.01,
}

const hoje = new Date('2026-10-15T12:00:00Z')

function entrada(parcial: Partial<EntradaPublica> = {}): EntradaPublica {
  return entradaPublicaSchema.parse({
    empreendimento: 'Resort Teste',
    modo: 'rapido',
    dataCompra: '2021-03-10',
    totalPago: 20000,
    ...parcial,
  })
}

describe('detalharCorrecao / verificarCobertura', () => {
  const serie = serieSintetica()
  const params = {
    dataHabiteSe: null,
    indicePreHabiteSe: 'IPCA' as const,
    indicePosHabiteSe: 'IPCA' as const,
    serieIndices: serie,
    dataReferencia: new Date('2026-10-15T00:00:00Z'),
  }

  it('o detalhe bate com corrigirPagamento e expõe as competências usadas', () => {
    const pagamento = { data: new Date('2022-05-20T00:00:00Z'), valor: 1000 }
    const detalhe = detalharCorrecao(pagamento, params)
    expect(detalhe.valorCorrigido).toBeCloseTo(corrigirPagamento(pagamento, params), 8)
    expect(detalhe.etapas).toHaveLength(1)
    expect(detalhe.etapas[0].competenciaInicial.toISOString().slice(0, 7)).toBe('2022-05')
    expect(detalhe.etapas[0].competenciaFinal.toISOString().slice(0, 7)).toBe('2026-10')
    // 53 meses de 0,4% entre 2022-05 e 2026-10
    expect(detalhe.fatorTotal).toBeCloseTo(Math.pow(1.004, 53), 10)
  })

  it('aceita série que cobre o período', () => {
    expect(verificarCobertura(serie, 'IPCA', new Date('2021-03-10T00:00:00Z'), params.dataReferencia).ok).toBe(true)
  })

  it('rejeita quando a série começa depois da data do pagamento', () => {
    const curta = serieSintetica([2022, 1])
    const r = verificarCobertura(curta, 'IPCA', new Date('2021-03-10T00:00:00Z'), params.dataReferencia)
    expect(r.ok).toBe(false)
    expect(r.motivo).toMatch(/começa em 2022-01/)
  })

  it('rejeita série defasada em mais de 3 meses', () => {
    const velha = serieSintetica([2018, 1], [2026, 5])
    const r = verificarCobertura(velha, 'IPCA', new Date('2021-03-10T00:00:00Z'), params.dataReferencia)
    expect(r.ok).toBe(false)
    expect(r.motivo).toMatch(/desatualizada/)
  })

  it('rejeita quando não há série', () => {
    expect(verificarCobertura([], 'IPCA', new Date('2021-03-10T00:00:00Z'), params.dataReferencia).ok).toBe(false)
  })
})

describe('parseDataIso e schema', () => {
  it('aceita datas reais e rejeita dias inexistentes ou formatos errados', () => {
    expect(parseDataIso('2024-02-29')).not.toBeNull()
    expect(parseDataIso('2023-02-29')).toBeNull()
    expect(parseDataIso('2023-02-31')).toBeNull()
    expect(parseDataIso('10/03/2021')).toBeNull()
  })

  it('exige total pago no modo rápido e parcelas no detalhado', () => {
    expect(entradaPublicaSchema.safeParse({ empreendimento: 'X1', modo: 'rapido', dataCompra: '2021-03-10' }).success).toBe(false)
    expect(entradaPublicaSchema.safeParse({ empreendimento: 'X1', modo: 'detalhado', dataCompra: '2021-03-10' }).success).toBe(false)
  })

  it('rejeita valores negativos, zero e acima do limite', () => {
    const base = { empreendimento: 'X1', modo: 'rapido', dataCompra: '2021-03-10' }
    expect(entradaPublicaSchema.safeParse({ ...base, totalPago: -5 }).success).toBe(false)
    expect(entradaPublicaSchema.safeParse({ ...base, totalPago: 0 }).success).toBe(false)
    expect(entradaPublicaSchema.safeParse({ ...base, totalPago: 99_000_000 }).success).toBe(false)
  })
})

describe('calcularEstimativaPublica', () => {
  const serie = serieSintetica()

  it('modo rápido: considera o total na data média e gera memória auditável', () => {
    const r = calcularEstimativaPublica(entrada(), { serie, config, hoje })

    const meio = new Date((Date.UTC(2021, 2, 10) + Date.UTC(2026, 9, 15)) / 2)
    const mesesAteHoje = (2026 - meio.getUTCFullYear()) * 12 + (9 - meio.getUTCMonth())
    const fatorEsperado = Math.pow(1.004, mesesAteHoje)

    expect(r.memoria).toHaveLength(1)
    expect(r.memoria[0].fator).toBeCloseTo(fatorEsperado, 9)
    expect(r.totais.totalPagoInformado).toBe(20000)
    expect(r.totais.totalAtualizado).toBeCloseTo(20000 * fatorEsperado, 4)
    expect(r.totais.baseRestituicao).toBeCloseTo(r.totais.totalAtualizado, 6)
    expect(r.premissas.indice).toBe('IPCA')
    expect(r.premissas.mesesEstimados).toBe(18)
  })

  it('os três cenários aplicam os percentuais configurados sobre a base', () => {
    const r = calcularEstimativaPublica(entrada({ valorCorretagem: 2000 }), { serie, config, hoje })
    const base = r.totais.baseRestituicao
    expect(base).toBeCloseTo(r.totais.totalAtualizado - 2000, 6)
    const [c, i, o] = ['conservador', 'intermediario', 'otimista'].map(n => r.cenarios.find(x => x.nome === n)!)
    expect(c.valorSemJuros).toBeCloseTo(base * 0.5, 6)
    expect(i.valorSemJuros).toBeCloseTo(base * 0.75, 6)
    expect(o.valorSemJuros).toBeCloseTo(base * 0.9, 6)
    expect(r.faixa.minimo).toBeCloseTo(c.valorSemJuros, 6)
    expect(r.faixa.maximo).toBeCloseTo(Math.max(o.valorComJurosTeseA, o.valorComJurosTeseB), 6)
    expect(r.faixa.maximo).toBeGreaterThan(r.faixa.minimo)
  })

  it('incluir corretagem na base não deduz o valor', () => {
    const r = calcularEstimativaPublica(entrada({ valorCorretagem: 2000, incluirCorretagem: true }), { serie, config, hoje })
    expect(r.totais.baseRestituicao).toBeCloseTo(r.totais.totalAtualizado, 6)
    expect(r.premissas.corretagemDeduzida).toBe(false)
  })

  it('modo detalhado: corrige cada parcela separadamente', () => {
    const r = calcularEstimativaPublica(
      entrada({
        modo: 'detalhado',
        totalPago: undefined,
        parcelas: [
          { data: '2022-05-20', valor: 5000 },
          { data: '2021-03-10', valor: 8000 },
        ],
      }),
      { serie, config, hoje }
    )
    expect(r.memoria).toHaveLength(2)
    expect(r.memoria[0].data).toBe('2021-03-10') // ordenado por data
    expect(r.totais.totalPagoInformado).toBe(13000)
    expect(r.memoria[0].fator).toBeCloseTo(Math.pow(1.004, 67), 9) // 2021-03 → 2026-10
    expect(r.memoria[1].fator).toBeCloseTo(Math.pow(1.004, 53), 9) // 2022-05 → 2026-10
  })

  it('é determinístico', () => {
    const a = calcularEstimativaPublica(entrada(), { serie, config, hoje })
    const b = calcularEstimativaPublica(entrada(), { serie, config, hoje })
    expect(a).toEqual(b)
  })

  it('rejeita corretagem maior que o total pago', () => {
    expect(() => calcularEstimativaPublica(entrada({ valorCorretagem: 25000 }), { serie, config, hoje })).toThrowError(
      expect.objectContaining({ codigo: 'corretagem_invalida' })
    )
  })

  it('rejeita data de compra futura, anterior a 1996 ou depois do último pagamento', () => {
    const casos: Partial<EntradaPublica>[] = [
      { dataCompra: '2026-12-01' },
      { dataCompra: '1990-01-01' },
      { dataCompra: '2021-03-10', dataUltimoPagamento: '2020-01-01' },
    ]
    for (const caso of casos) {
      expect(() => calcularEstimativaPublica(entrada(caso), { serie, config, hoje })).toThrowError(
        expect.objectContaining({ codigo: 'data_invalida' })
      )
    }
  })

  it('não calcula quando a série não cobre o período (nunca extrapola em silêncio)', () => {
    // data média da compra (2021-03) ao presente cai em ~2024-01; série iniciando depois não cobre
    const curta = serieSintetica([2024, 6])
    expect(() => calcularEstimativaPublica(entrada(), { serie: curta, config, hoje })).toThrow(ErroEstimativa)
    expect(() => calcularEstimativaPublica(entrada(), { serie: curta, config, hoje })).toThrowError(
      expect.objectContaining({ codigo: 'indices_indisponiveis' })
    )
  })
})
