import { describe, expect, it } from 'vitest'
import { parseMoeda } from './moeda'

describe('parseMoeda', () => {
  it.each([
    ['1.234,56', 1234.56],
    ['R$ 1.234,56', 1234.56],
    ['1234,5', 1234.5],
    ['1234.56', 1234.56],
    ['12.000', 12000],
    ['12.000.000', 12000000],
    ['650', 650],
    ['0,99', 0.99],
  ])('interpreta %s', (entrada, esperado) => {
    expect(parseMoeda(entrada)).toBe(esperado)
  })

  it.each(['', 'abc', '0', '-5', '1,2,3', '1.2.3', 'R$'])('rejeita "%s"', entrada => {
    expect(parseMoeda(entrada)).toBeNull()
  })
})
