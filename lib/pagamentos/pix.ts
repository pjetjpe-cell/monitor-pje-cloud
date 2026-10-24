import QRCode from 'qrcode'

/** CRC16-CCITT (poly 0x1021, init 0xFFFF), como exigido pelo BR Code do Pix. */
export function crc16(texto: string): string {
  let crc = 0xffff
  for (let i = 0; i < texto.length; i++) {
    crc ^= texto.charCodeAt(i) << 8
    for (let b = 0; b < 8; b++) {
      crc = crc & 0x8000 ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0')
}

function campo(id: string, valor: string): string {
  return `${id}${String(valor.length).padStart(2, '0')}${valor}`
}

function semAcentos(texto: string): string {
  return texto.normalize('NFD').replace(/[̀-ͯ]/g, '')
}

/** Nome/cidade do BR Code: maiúsculas, sem acentos, só caracteres simples, tamanho limitado. */
export function limparTextoPix(texto: string, max: number): string {
  return semAcentos(texto).toUpperCase().replace(/[^A-Z0-9 ]/g, '').replace(/\s+/g, ' ').trim().slice(0, max)
}

export function limparTxid(texto: string): string {
  const limpo = texto.replace(/[^A-Za-z0-9]/g, '').slice(0, 25)
  return limpo || '***'
}

export interface DadosPix {
  chave: string
  nomeRecebedor: string
  cidade: string
  valorCentavos: number
  txid?: string
  descricao?: string
}

/** Gera o "Pix copia e cola" estático com valor definido. */
export function gerarPayloadPix(d: DadosPix): string {
  if (!Number.isInteger(d.valorCentavos) || d.valorCentavos <= 0) {
    throw new Error('Valor do Pix inválido')
  }
  const chave = d.chave.trim()
  if (!chave || chave.length > 77) throw new Error('Chave Pix inválida')

  let conta = campo('00', 'br.gov.bcb.pix') + campo('01', chave)
  if (d.descricao) {
    const desc = limparTextoPix(d.descricao, 40)
    if (desc && conta.length + 4 + desc.length <= 99) conta += campo('02', desc)
  }

  const semCrc =
    campo('00', '01') +
    campo('01', '11') +
    campo('26', conta) +
    campo('52', '0000') +
    campo('53', '986') +
    campo('54', (d.valorCentavos / 100).toFixed(2)) +
    campo('58', 'BR') +
    campo('59', limparTextoPix(d.nomeRecebedor, 25) || 'RECEBEDOR') +
    campo('60', limparTextoPix(d.cidade, 15) || 'BRASIL') +
    campo('62', campo('05', limparTxid(d.txid ?? '***'))) +
    '6304'

  return semCrc + crc16(semCrc)
}

export async function gerarQrDataUrl(payload: string): Promise<string> {
  return QRCode.toDataURL(payload, { errorCorrectionLevel: 'M', margin: 1, width: 360 })
}

export function dadosPixDoAmbiente(
  valorCentavos: number,
  txid: string,
  env: Record<string, string | undefined> = process.env
): DadosPix {
  return {
    chave: env.PIX_CHAVE ?? '',
    nomeRecebedor: env.PIX_RECEBEDOR_NOME ?? '',
    cidade: env.PIX_CIDADE ?? '',
    valorCentavos,
    txid,
    descricao: 'Relatorio de estimativa',
  }
}
