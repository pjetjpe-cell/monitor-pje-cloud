import { describe, expect, it } from 'vitest'
import { buscarIpcaIbge, ErroImportacaoIndices, parseIpcaIbge, urlIpcaIbge } from './ibge'

// Resposta SINTÉTICA no formato da API de agregados do IBGE (valores de teste, não oficiais).
function respostaIbge(meses = 360, crescimento = 1.005, transform?: (serie: Record<string, string>) => void) {
  const serie: Record<string, string> = {}
  let valor = 1500
  let ano = 1996
  let mes = 11
  for (let i = 0; i < meses; i++) {
    serie[`${ano}${String(mes).padStart(2, '0')}`] = valor.toFixed(2)
    valor *= crescimento
    mes++
    if (mes > 12) {
      mes = 1
      ano++
    }
  }
  transform?.(serie)
  return [{ id: '2266', variavel: 'IPCA - Número-índice', resultados: [{ series: [{ serie }] }] }]
}

describe('parseIpcaIbge', () => {
  it('converte a série e ordena por competência', () => {
    const pontos = parseIpcaIbge(respostaIbge())
    expect(pontos).toHaveLength(360)
    expect(pontos[0].competencia.toISOString().slice(0, 10)).toBe('1996-11-01')
    expect(pontos[0].numeroIndice).toBeCloseTo(1500, 2)
    expect(pontos[359].competencia.getTime()).toBeGreaterThan(pontos[0].competencia.getTime())
  })

  it('ignora meses ainda não divulgados ("-" ou "...") no fim da série', () => {
    const resp = respostaIbge(360, 1.005, serie => {
      const ultimas = Object.keys(serie).slice(-1)
      serie[ultimas[0]] = '...'
    })
    expect(parseIpcaIbge(resp)).toHaveLength(359)
  })

  it('rejeita formato inesperado', () => {
    expect(() => parseIpcaIbge({})).toThrow(ErroImportacaoIndices)
    expect(() => parseIpcaIbge([{ resultados: [] }])).toThrow(ErroImportacaoIndices)
  })

  it('rejeita série curta', () => {
    expect(() => parseIpcaIbge(respostaIbge(100))).toThrowError(/curta demais/)
  })

  it('rejeita buracos na série', () => {
    const resp = respostaIbge(360, 1.005, serie => {
      delete serie[Object.keys(serie)[100]]
    })
    expect(() => parseIpcaIbge(resp)).toThrowError(/meses faltando/)
  })

  it('rejeita saltos mensais implausíveis', () => {
    const resp = respostaIbge(360, 1.005, serie => {
      const chave = Object.keys(serie)[200]
      serie[chave] = String(Number(serie[chave]) * 1.2)
    })
    expect(() => parseIpcaIbge(resp)).toThrowError(/implausível/)
  })

  it('rejeita último valor fora da faixa esperada', () => {
    expect(() => parseIpcaIbge(respostaIbge(360, 1.03))).toThrow(ErroImportacaoIndices)
  })
})

describe('buscarIpcaIbge', () => {
  it('usa a URL do agregado 1737/variável 2266 e devolve os pontos', async () => {
    let urlChamada = ''
    const fakeFetch = (async (url: string) => {
      urlChamada = String(url)
      return new Response(JSON.stringify(respostaIbge()), { status: 200 })
    }) as unknown as typeof fetch
    const pontos = await buscarIpcaIbge(fakeFetch)
    expect(pontos).toHaveLength(360)
    expect(urlChamada).toBe(urlIpcaIbge())
    expect(urlChamada).toContain('agregados/1737')
    expect(urlChamada).toContain('variaveis/2266')
  })

  it('traduz HTTP de erro e falha de rede em ErroImportacaoIndices', async () => {
    const http500 = (async () => new Response('x', { status: 500 })) as unknown as typeof fetch
    await expect(buscarIpcaIbge(http500)).rejects.toThrowError(/HTTP 500/)
    const rede = (async () => {
      throw new Error('ECONNRESET')
    }) as unknown as typeof fetch
    await expect(buscarIpcaIbge(rede)).rejects.toThrow(ErroImportacaoIndices)
  })
})
