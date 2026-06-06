// Cliente para a API Pública do DataJud / CNJ
// Documentação: https://datajud-wiki.cnj.jus.br/api-publica/

const DATAJUD_BASE = 'https://api-publica.datajud.cnj.jus.br'
// Chave pública — rotacionada pelo CNJ periodicamente
const API_KEY = process.env.DATAJUD_API_KEY ?? 'cDZHYzlZa0JadVREZDJCendQbXY6SkJlTzNjLV9TRENyQk1RdnFKZGRQdw=='

// Mapeamento tribunal → alias DataJud
export const TRIBUNAIS: Record<string, string> = {
  // Estaduais
  TJAC: 'api_publica_tjac', TJAL: 'api_publica_tjal', TJAM: 'api_publica_tjam',
  TJAP: 'api_publica_tjap', TJBA: 'api_publica_tjba', TJCE: 'api_publica_tjce',
  TJDF: 'api_publica_tjdft', TJES: 'api_publica_tjes', TJGO: 'api_publica_tjgo',
  TJMA: 'api_publica_tjma', TJMG: 'api_publica_tjmg', TJMS: 'api_publica_tjms',
  TJMT: 'api_publica_tjmt', TJPA: 'api_publica_tjpa', TJPB: 'api_publica_tjpb',
  TJPE: 'api_publica_tjpe', TJPI: 'api_publica_tjpi', TJPR: 'api_publica_tjpr',
  TJRJ: 'api_publica_tjrj', TJRN: 'api_publica_tjrn', TJRO: 'api_publica_tjro',
  TJRR: 'api_publica_tjrr', TJRS: 'api_publica_tjrs', TJSC: 'api_publica_tjsc',
  TJSE: 'api_publica_tjse', TJSP: 'api_publica_tjsp', TJTO: 'api_publica_tjto',
  // Federais
  TRF1: 'api_publica_trf1', TRF2: 'api_publica_trf2', TRF3: 'api_publica_trf3',
  TRF4: 'api_publica_trf4', TRF5: 'api_publica_trf5', TRF6: 'api_publica_trf6',
  // Trabalhistas
  TST: 'api_publica_tst',   STJ: 'api_publica_stj',   STF: 'api_publica_stf',
}

export interface Movimentacao {
  dataHora: string
  complemento?: string
  tipoMovimento?: { codigo: number; nome: string }
}

export interface ProcessoDataJud {
  numeroProcesso: string
  tribunal: string
  classe?: { codigo: number; nome: string }
  assuntos?: Array<{ codigo: number; nome: string }>
  orgaoJulgador?: { nome: string; codigoMunicipioIBGE?: number }
  dataAjuizamento?: string
  movimentos?: Movimentacao[]
  ultimaMovimentacao?: Movimentacao
}

function detectarTribunal(numeroProcesso: string): string | null {
  // Número único CNJ: NNNNNNN-DD.AAAA.J.TT.OOOO
  // J=6 → Federal, J=5 → Estadual, J=4 → Trabalhista, etc.
  const match = numeroProcesso.replace(/\D/g, '')
  if (match.length < 20) return null

  const segmento = match[13]
  const tribunal = match.slice(14, 16)

  const mapa: Record<string, Record<string, string>> = {
    '8': { '01': 'TJAC','02': 'TJAL','03': 'TJAM','04': 'TJAP','05': 'TJBA',
           '06': 'TJCE','07': 'TJDF','08': 'TJES','09': 'TJGO','10': 'TJMA',
           '11': 'TJMT','12': 'TJMS','13': 'TJMG','14': 'TJPA','15': 'TJPB',
           '16': 'TJPR','17': 'TJPE','18': 'TJPI','19': 'TJRJ','20': 'TJRN',
           '21': 'TJRS','22': 'TJRO','23': 'TJRR','24': 'TJSC','25': 'TJSE',
           '26': 'TJSP','27': 'TJTO' },
    '4': { '01': 'TRT1','02': 'TRT2','03': 'TRT3','04': 'TRT4','05': 'TRT5',
           '06': 'TRT6','07': 'TRT7','08': 'TRT8','09': 'TRT9','10': 'TRT10',
           '11': 'TRT11','12': 'TRT12','13': 'TRT13','14': 'TRT14','15': 'TRT15',
           '16': 'TRT16','17': 'TRT17','18': 'TRT18','19': 'TRT19','20': 'TRT20',
           '21': 'TRT21','22': 'TRT22','23': 'TRT23','24': 'TRT24' },
    '6': { '01': 'TRF1','02': 'TRF2','03': 'TRF3','04': 'TRF4','05': 'TRF5','06': 'TRF6' },
  }

  return mapa[segmento]?.[tribunal.padStart(2, '0')] ?? null
}

export async function consultarProcesso(
  numeroProcesso: string,
  tribunalCodigo?: string
): Promise<ProcessoDataJud | null> {
  const tribunal = tribunalCodigo ?? detectarTribunal(numeroProcesso)
  if (!tribunal) throw new Error(`Não foi possível detectar o tribunal para ${numeroProcesso}`)

  const alias = TRIBUNAIS[tribunal]
  if (!alias) throw new Error(`Tribunal ${tribunal} não suportado`)

  const url = `${DATAJUD_BASE}/${alias}/_search`

  const body = {
    query: { match: { numeroProcesso: numeroProcesso.replace(/\D/g, '').replace(
      /^(\d{7})(\d{2})(\d{4})(\d{1})(\d{2})(\d{4})$/,
      '$1-$2.$3.$4.$5.$6'
    ) } },
    size: 1,
    _source: ['numeroProcesso', 'tribunal', 'classe', 'assuntos', 'orgaoJulgador',
               'dataAjuizamento', 'movimentos'],
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `APIKey ${API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    next: { revalidate: 0 },
  })

  if (!res.ok) {
    console.error(`DataJud ${res.status}:`, await res.text())
    return null
  }

  const json = await res.json()
  const hit = json?.hits?.hits?.[0]?._source as ProcessoDataJud | undefined
  if (!hit) return null

  const movimentos = hit.movimentos ?? []
  movimentos.sort((a, b) => new Date(b.dataHora).getTime() - new Date(a.dataHora).getTime())

  return { ...hit, movimentos, ultimaMovimentacao: movimentos[0] }
}
