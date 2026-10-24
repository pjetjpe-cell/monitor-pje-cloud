// Importação do IPCA (número-índice, base dez/1993 = 100) a partir da API pública de
// agregados do IBGE (SIDRA tabela 1737, variável 2266, índice geral).

export interface PontoIpca {
  competencia: Date
  numeroIndice: number
}

export const MESES_IMPORTACAO = 360

export function urlIpcaIbge(meses = MESES_IMPORTACAO): string {
  return (
    'https://servicodados.ibge.gov.br/api/v3/agregados/1737' +
    `/periodos/-${meses}/variaveis/2266?localidades=N1[all]&classificacao=315[7169]`
  )
}

export class ErroImportacaoIndices extends Error {
  constructor(mensagem: string) {
    super(mensagem)
    this.name = 'ErroImportacaoIndices'
  }
}

function extrairSerie(json: unknown): Record<string, unknown> {
  const serie = (json as any)?.[0]?.resultados?.[0]?.series?.[0]?.serie
  if (!serie || typeof serie !== 'object') {
    throw new ErroImportacaoIndices('Resposta do IBGE em formato inesperado (série não encontrada).')
  }
  return serie as Record<string, unknown>
}

/**
 * Converte e valida a resposta da API. Qualquer inconsistência (buracos, saltos mensais
 * implausíveis, valores fora de faixa) rejeita a importação inteira — melhor não atualizar
 * do que gravar um índice errado numa ferramenta que gera valores para consumidores.
 */
export function parseIpcaIbge(json: unknown): PontoIpca[] {
  const bruta = extrairSerie(json)

  const pontos: PontoIpca[] = []
  for (const [chave, valor] of Object.entries(bruta)) {
    if (!/^\d{6}$/.test(chave)) continue
    const numero = typeof valor === 'string' ? Number(valor.replace(',', '.')) : Number(valor)
    if (!Number.isFinite(numero)) continue // meses ainda não divulgados vêm como "-" ou "..."
    const ano = Number(chave.slice(0, 4))
    const mes = Number(chave.slice(4, 6))
    if (mes < 1 || mes > 12) throw new ErroImportacaoIndices(`Competência inválida na resposta do IBGE: ${chave}`)
    pontos.push({ competencia: new Date(Date.UTC(ano, mes - 1, 1)), numeroIndice: numero })
  }

  if (pontos.length < 240) {
    throw new ErroImportacaoIndices(`Série do IBGE curta demais (${pontos.length} meses) — importação cancelada.`)
  }

  pontos.sort((a, b) => a.competencia.getTime() - b.competencia.getTime())

  for (let i = 1; i < pontos.length; i++) {
    const anterior = pontos[i - 1]
    const atual = pontos[i]
    const mesesEntre =
      (atual.competencia.getUTCFullYear() - anterior.competencia.getUTCFullYear()) * 12 +
      (atual.competencia.getUTCMonth() - anterior.competencia.getUTCMonth())
    if (mesesEntre !== 1) {
      throw new ErroImportacaoIndices('A série do IBGE tem meses faltando — importação cancelada.')
    }
    const razao = atual.numeroIndice / anterior.numeroIndice
    if (razao < 0.985 || razao > 1.05) {
      throw new ErroImportacaoIndices('Variação mensal implausível na série do IBGE — importação cancelada.')
    }
  }

  const ultimo = pontos[pontos.length - 1].numeroIndice
  if (ultimo < 1000 || ultimo > 100000) {
    throw new ErroImportacaoIndices('Valor do último índice fora da faixa esperada — importação cancelada.')
  }

  return pontos
}

export async function buscarIpcaIbge(fetchImpl: typeof fetch = fetch): Promise<PontoIpca[]> {
  const controle = new AbortController()
  const timer = setTimeout(() => controle.abort(), 25_000)
  try {
    const res = await fetchImpl(urlIpcaIbge(), { signal: controle.signal, cache: 'no-store' })
    if (!res.ok) throw new ErroImportacaoIndices(`IBGE respondeu HTTP ${res.status}.`)
    return parseIpcaIbge(await res.json())
  } catch (e) {
    if (e instanceof ErroImportacaoIndices) throw e
    throw new ErroImportacaoIndices(`Não foi possível consultar o IBGE: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}
