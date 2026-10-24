// Formatação pt-BR independente de ICU/locale do servidor (o relatório precisa sair igual em qualquer ambiente).

export function numero(valor: number, casas = 2): string {
  const negativo = valor < 0
  const fixo = Math.abs(valor).toFixed(casas)
  const [inteiro, decimal] = fixo.split('.')
  const comMilhar = inteiro.replace(/\B(?=(\d{3})+(?!\d))/g, '.')
  return `${negativo ? '-' : ''}${comMilhar}${decimal ? ',' + decimal : ''}`
}

export function moeda(valor: number): string {
  return `R$ ${numero(valor, 2)}`
}

export function percentual(fracao: number, casas = 0): string {
  return `${numero(fracao * 100, casas)}%`
}

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']

/** '2024-03' → 'mar/2024' */
export function competenciaCurta(competencia: string): string {
  const [ano, mes] = competencia.split('-')
  return `${MESES[Number(mes) - 1] ?? mes}/${ano}`
}

/** '2024-03-15' → '15/03/2024' */
export function dataBr(iso: string): string {
  const [ano, mes, dia] = iso.slice(0, 10).split('-')
  return `${dia}/${mes}/${ano}`
}

export function dataHoraBr(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0')
  // Fuso de Brasília (UTC-3, sem horário de verão desde 2019)
  const b = new Date(d.getTime() - 3 * 3600_000)
  return `${p(b.getUTCDate())}/${p(b.getUTCMonth() + 1)}/${b.getUTCFullYear()} ${p(b.getUTCHours())}:${p(b.getUTCMinutes())}`
}

export function formatarWhatsapp(digitos: string): string {
  const d = digitos.replace(/\D/g, '')
  const local = d.startsWith('55') && d.length > 11 ? d.slice(2) : d
  if (local.length === 11) return `(${local.slice(0, 2)}) ${local.slice(2, 7)}-${local.slice(7)}`
  if (local.length === 10) return `(${local.slice(0, 2)}) ${local.slice(2, 6)}-${local.slice(6)}`
  return digitos
}
