import { describe, expect, it } from 'vitest'
import {
  buscarNumeroIndice,
  fatorCorrecao,
  corrigirPagamento,
  corrigirPagamentos,
  calcularBaseRestituicao,
} from './correcaoMonetaria'
import { calcularCenarios } from './cenarios'
import { calcularJurosTeseA, calcularJurosTeseB } from './juros'
import { calcularDistrato } from './calcularDistrato'
import type { EntradaCalculo, PontoIndice } from './types'

const serieIndices: PontoIndice[] = [
  { indice: 'INCC_DI_FGV', competencia: new Date('2020-01-01'), numeroIndice: 100 },
  { indice: 'INCC_DI_FGV', competencia: new Date('2020-06-01'), numeroIndice: 110 },
  { indice: 'IPCA', competencia: new Date('2020-06-01'), numeroIndice: 200 },
  { indice: 'IPCA', competencia: new Date('2020-07-01'), numeroIndice: 205 },
  { indice: 'IPCA', competencia: new Date('2024-06-01'), numeroIndice: 260 },
]

describe('correção monetária', () => {
  it('busca o número-índice do mês exato quando cadastrado', () => {
    expect(buscarNumeroIndice(serieIndices, 'INCC_DI_FGV', new Date('2020-01-15'))).toBe(100)
    expect(buscarNumeroIndice(serieIndices, 'IPCA', new Date('2024-06-01'))).toBe(260)
  })

  it('usa o último ponto cadastrado igual ou anterior quando o mês exato não existe', () => {
    // não há ponto em 2022-03; deve usar o último anterior (2020-07 = 205)
    expect(buscarNumeroIndice(serieIndices, 'IPCA', new Date('2022-03-01'))).toBe(205)
  })

  it('calcula o fator de correção como razão entre índice final e inicial', () => {
    expect(fatorCorrecao(serieIndices, 'INCC_DI_FGV', new Date('2020-01-01'), new Date('2020-06-01'))).toBeCloseTo(1.1)
    expect(fatorCorrecao(serieIndices, 'IPCA', new Date('2020-06-01'), new Date('2024-06-01'))).toBeCloseTo(1.3)
  })

  it('corrige pagamento pré-habite-se em duas etapas (pré-habite-se depois pós-habite-se)', () => {
    const valor = corrigirPagamento(
      { data: new Date('2020-01-15'), valor: 1000 },
      {
        dataHabiteSe: new Date('2020-06-01'),
        indicePreHabiteSe: 'INCC_DI_FGV',
        indicePosHabiteSe: 'IPCA',
        serieIndices,
        dataReferencia: new Date('2024-06-01'),
      }
    )
    // 1000 * (110/100) * (260/200) = 1430
    expect(valor).toBeCloseTo(1430)
  })

  it('corrige pagamento pós-habite-se direto pelo índice pós-habite-se', () => {
    const valor = corrigirPagamento(
      { data: new Date('2020-07-10'), valor: 1000 },
      {
        dataHabiteSe: new Date('2020-06-01'),
        indicePreHabiteSe: 'INCC_DI_FGV',
        indicePosHabiteSe: 'IPCA',
        serieIndices,
        dataReferencia: new Date('2024-06-01'),
      }
    )
    // 1000 * (260/205)
    expect(valor).toBeCloseTo(1268.2926829268293)
  })

  it('soma os pagamentos corrigidos', () => {
    const total = corrigirPagamentos(
      [
        { data: new Date('2020-01-15'), valor: 1000 },
        { data: new Date('2020-07-10'), valor: 1000 },
      ],
      {
        dataHabiteSe: new Date('2020-06-01'),
        indicePreHabiteSe: 'INCC_DI_FGV',
        indicePosHabiteSe: 'IPCA',
        serieIndices,
        dataReferencia: new Date('2024-06-01'),
      }
    )
    expect(total).toBeCloseTo(1430 + 1268.2926829268293)
  })

  it('exclui a comissão de corretagem da base por padrão', () => {
    expect(calcularBaseRestituicao(10000, 800, false)).toBe(9200)
  })

  it('inclui a comissão de corretagem na base quando o parâmetro é acionado', () => {
    expect(calcularBaseRestituicao(10000, 800, true)).toBe(10000)
  })
})

describe('cenários de retenção (sempre os três, nunca um número único)', () => {
  it('calcula os três cenários a partir dos percentuais configurados', () => {
    const cenarios = calcularCenarios(10000, {
      percentualConservador: 0.5,
      percentualIntermediario: 0.75,
      percentualOtimista: 0.9,
    })

    expect(cenarios).toHaveLength(3)
    expect(cenarios.find(c => c.nome === 'conservador')).toMatchObject({
      percentualRetencao: 0.5,
      percentualRestituicao: 0.5,
      valor: 5000,
    })
    expect(cenarios.find(c => c.nome === 'intermediario')).toMatchObject({
      percentualRetencao: 0.25,
      percentualRestituicao: 0.75,
      valor: 7500,
    })
    const otimista = cenarios.find(c => c.nome === 'otimista')!
    expect(otimista.percentualRetencao).toBeCloseTo(0.1)
    expect(otimista.percentualRestituicao).toBe(0.9)
    expect(otimista.valor).toBe(9000)
  })
})

describe('juros de mora', () => {
  it('tese A: SELIC líquida de IPCA, apenas sobre os meses estimados até o trânsito em julgado', () => {
    const juros = calcularJurosTeseA(1000, {
      taxaSelicMensal: 0.01,
      taxaIpcaMensalEmbutida: 0.004,
      mesesEstimadosAteReferencia: 18,
    })
    expect(juros).toBeCloseTo(1000 * 0.006 * 18)
  })

  it('tese A nunca gera taxa negativa quando IPCA supera a SELIC', () => {
    const juros = calcularJurosTeseA(1000, {
      taxaSelicMensal: 0.002,
      taxaIpcaMensalEmbutida: 0.01,
      mesesEstimadosAteReferencia: 18,
    })
    expect(juros).toBe(0)
  })

  it('tese B: 1% a.m. simples, da citação/desistência até a data de referência estimada', () => {
    const juros = calcularJurosTeseB(1000, {
      taxaJurosMensalSimples: 0.01,
      dataInicioContagemTeseB: new Date('2023-01-01'),
      dataBase: new Date('2026-07-01'),
      mesesEstimadosAteReferencia: 18,
    })
    // 42 meses decorridos (2023-01 -> 2026-07) + 18 meses estimados = 60
    expect(juros).toBeCloseTo(1000 * 0.01 * 60)
  })
})

describe('calcularDistrato (orquestração determinística)', () => {
  const entrada: EntradaCalculo = {
    pagamentos: [
      { data: new Date('2020-01-15'), valor: 1000 },
      { data: new Date('2020-07-10'), valor: 1000 },
    ],
    correcao: {
      dataHabiteSe: new Date('2020-06-01'),
      indicePreHabiteSe: 'INCC_DI_FGV',
      indicePosHabiteSe: 'IPCA',
      serieIndices,
      dataReferencia: new Date('2024-06-01'),
    },
    comissaoCorretagem: 300,
    incluirCorretagemNaBase: false,
    cenarios: {
      percentualConservador: 0.5,
      percentualIntermediario: 0.75,
      percentualOtimista: 0.9,
    },
    juros: {
      taxaSelicMensal: 0.01,
      taxaIpcaMensalEmbutida: 0.004,
      taxaJurosMensalSimples: 0.01,
      dataInicioContagemTeseB: new Date('2023-01-01'),
      dataBase: new Date('2024-06-01'),
      mesesEstimadosAteReferencia: 18,
    },
  }

  it('sempre retorna os três cenários, cada um com e sem juros nas duas teses', () => {
    const resultado = calcularDistrato(entrada)

    expect(resultado.totalAtualizadoPago).toBeCloseTo(1430 + 1268.2926829268293)
    expect(resultado.baseRestituicao).toBeCloseTo(resultado.totalAtualizadoPago - 300)
    expect(resultado.cenarios).toHaveLength(3)

    for (const cenario of resultado.cenarios) {
      expect(cenario.valorComJurosTeseA).toBeGreaterThanOrEqual(cenario.valorSemJuros)
      expect(cenario.valorComJurosTeseB).toBeGreaterThanOrEqual(cenario.valorSemJuros)
    }
  })

  it('é determinístico: mesma entrada produz sempre a mesma saída', () => {
    const resultado1 = calcularDistrato(entrada)
    const resultado2 = calcularDistrato(entrada)
    expect(resultado1).toEqual(resultado2)
  })

  it('a ordem de valor entre cenários segue sempre otimista > intermediário > conservador', () => {
    const resultado = calcularDistrato(entrada)
    const [conservador, intermediario, otimista] = ['conservador', 'intermediario', 'otimista'].map(
      nome => resultado.cenarios.find(c => c.nome === nome)!
    )
    expect(otimista.valorSemJuros).toBeGreaterThan(intermediario.valorSemJuros)
    expect(intermediario.valorSemJuros).toBeGreaterThan(conservador.valorSemJuros)
  })
})
