/**
 * Interpreta valores digitados no padrão brasileiro: "1.234,56", "R$ 1234,5", "1234.56", "12.000".
 * Devolve null quando não for um número positivo válido.
 */
export function parseMoeda(texto: string): number | null {
  let s = texto.replace(/R\$|\s/g, '')
  if (!s || !/^[\d.,]+$/.test(s)) return null

  if (s.includes(',')) {
    // vírgula é o separador decimal; pontos são milhar
    if ((s.match(/,/g) ?? []).length > 1) return null
    s = s.replace(/\./g, '').replace(',', '.')
  } else if (/^\d{1,3}(\.\d{3})+$/.test(s)) {
    // "12.000" → milhar
    s = s.replace(/\./g, '')
  } else if ((s.match(/\./g) ?? []).length > 1) {
    return null
  }

  const n = Number(s)
  return Number.isFinite(n) && n > 0 ? Math.round(n * 100) / 100 : null
}

export function formatarReais(valor: number): string {
  return valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}
