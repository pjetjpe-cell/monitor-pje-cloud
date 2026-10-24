import { describe, expect, it } from 'vitest'
import { crc16, gerarPayloadPix, limparTextoPix, limparTxid } from './pix'
import { modoPagamento, precoRelatorioCentavos, formatarCentavos } from './config'
import { buscarPagamento, criarPreferencia, pagamentoConfirmaPedido, type PagamentoMp } from './mercadopago'

// Decodifica o TLV do BR Code para conferir a estrutura gerada.
function lerTlv(payload: string): Record<string, string> {
  const campos: Record<string, string> = {}
  let i = 0
  while (i < payload.length) {
    const id = payload.slice(i, i + 2)
    const len = Number(payload.slice(i + 2, i + 4))
    campos[id] = payload.slice(i + 4, i + 4 + len)
    i += 4 + len
  }
  return campos
}

describe('Pix BR Code', () => {
  it('CRC16-CCITT bate com o vetor de teste padrão ("123456789" = 29B1)', () => {
    expect(crc16('123456789')).toBe('29B1')
  })

  it('gera payload válido com valor, nome/cidade normalizados e CRC correto', () => {
    const payload = gerarPayloadPix({
      chave: '+5581996232353',
      nomeRecebedor: 'Di Pallacio Enterprise — Família',
      cidade: 'Recife',
      valorCentavos: 990,
      txid: 'DP-ABC123',
    })
    const tlv = lerTlv(payload)
    expect(tlv['00']).toBe('01')
    expect(tlv['53']).toBe('986')
    expect(tlv['54']).toBe('9.90')
    expect(tlv['58']).toBe('BR')
    expect(tlv['59']).toBe('DI PALLACIO ENTERPRISE FA') // 25 chars, sem acento nem travessão
    expect(tlv['60']).toBe('RECIFE')
    expect(lerTlv(tlv['26'])['00']).toBe('br.gov.bcb.pix')
    expect(lerTlv(tlv['26'])['01']).toBe('+5581996232353')
    expect(lerTlv(tlv['62'])['05']).toBe('DPABC123')

    const semCrc = payload.slice(0, -4)
    expect(tlv['63']).toBe(crc16(semCrc))
    expect(payload.endsWith(crc16(semCrc))).toBe(true)
  })

  it('rejeita valor e chave inválidos', () => {
    const base = { chave: 'x@y.com', nomeRecebedor: 'A', cidade: 'B' }
    expect(() => gerarPayloadPix({ ...base, valorCentavos: 0 })).toThrow()
    expect(() => gerarPayloadPix({ ...base, valorCentavos: 9.9 })).toThrow()
    expect(() => gerarPayloadPix({ ...base, chave: '', valorCentavos: 990 })).toThrow()
  })

  it('normaliza textos', () => {
    expect(limparTextoPix('São João & Cia.', 25)).toBe('SAO JOAO CIA')
    expect(limparTxid('dp-12 34')).toBe('dp1234')
    expect(limparTxid('---')).toBe('***')
  })
})

describe('configuração de pagamento', () => {
  it('escolhe o modo conforme as variáveis presentes', () => {
    expect(modoPagamento({})).toBe('desabilitado')
    expect(modoPagamento({ PIX_CHAVE: 'k', PIX_RECEBEDOR_NOME: 'n' })).toBe('desabilitado')
    expect(modoPagamento({ PIX_CHAVE: 'k', PIX_RECEBEDOR_NOME: 'n', PIX_CIDADE: 'c' })).toBe('pix_manual')
    expect(modoPagamento({ MERCADOPAGO_ACCESS_TOKEN: 't', PIX_CHAVE: 'k', PIX_RECEBEDOR_NOME: 'n', PIX_CIDADE: 'c' })).toBe(
      'mercadopago'
    )
  })

  it('preço padrão R$ 9,90 e override apenas dentro de limites sãos', () => {
    expect(precoRelatorioCentavos({})).toBe(990)
    expect(precoRelatorioCentavos({ PRECO_RELATORIO_CENTAVOS: '1990' })).toBe(1990)
    expect(precoRelatorioCentavos({ PRECO_RELATORIO_CENTAVOS: '1' })).toBe(990)
    expect(precoRelatorioCentavos({ PRECO_RELATORIO_CENTAVOS: 'abc' })).toBe(990)
    expect(formatarCentavos(990).replace(/\s/g, ' ')).toMatch(/R\$\s?9,90/)
  })
})

describe('Mercado Pago', () => {
  const pedido = { id: 'ped_1', valorCentavos: 990 }
  const aprovado: PagamentoMp = {
    id: 1,
    status: 'approved',
    external_reference: 'ped_1',
    transaction_amount: 9.9,
    currency_id: 'BRL',
  }

  it('só confirma pagamento aprovado, do pedido, em BRL e com o valor exato', () => {
    expect(pagamentoConfirmaPedido(aprovado, pedido)).toEqual({ ok: true })
    expect(pagamentoConfirmaPedido({ ...aprovado, status: 'pending' }, pedido).ok).toBe(false)
    expect(pagamentoConfirmaPedido({ ...aprovado, status: 'rejected' }, pedido).ok).toBe(false)
    expect(pagamentoConfirmaPedido({ ...aprovado, external_reference: 'outro' }, pedido).ok).toBe(false)
    expect(pagamentoConfirmaPedido({ ...aprovado, external_reference: null }, pedido).ok).toBe(false)
    expect(pagamentoConfirmaPedido({ ...aprovado, transaction_amount: 1 }, pedido).ok).toBe(false)
    expect(pagamentoConfirmaPedido({ ...aprovado, transaction_amount: 9.89 }, pedido).ok).toBe(false)
    expect(pagamentoConfirmaPedido({ ...aprovado, currency_id: 'USD' }, pedido).ok).toBe(false)
  })

  it('cria a preferência com valor do servidor, referência do pedido e URLs de retorno', async () => {
    let corpo: any
    let cabecalho: any
    const fake = (async (_url: string, init: RequestInit) => {
      corpo = JSON.parse(String(init.body))
      cabecalho = init.headers
      return new Response(JSON.stringify({ id: 'pref1', init_point: 'https://mp/pay', sandbox_init_point: 'https://mp/sandbox' }), {
        status: 201,
      })
    }) as unknown as typeof fetch

    const r = await criarPreferencia(
      { id: 'ped_1', token: 'tok', valorCentavos: 990, nome: 'Ana', email: 'a@b.com' },
      'https://site.com.br/',
      'APP_USR-123',
      fake
    )
    expect(r).toEqual({ id: 'pref1', urlPagamento: 'https://mp/pay' })
    expect(corpo.items[0].unit_price).toBe(9.9)
    expect(corpo.external_reference).toBe('ped_1')
    expect(corpo.back_urls.success).toBe('https://site.com.br/relatorio/tok')
    expect(corpo.notification_url).toBe('https://site.com.br/api/pagamentos/mercadopago/webhook')
    expect(corpo.auto_return).toBe('approved')
    expect(cabecalho.Authorization).toBe('Bearer APP_USR-123')
  })

  it('em localhost não envia auto_return e em token de teste usa o sandbox', async () => {
    let corpo: any
    const fake = (async (_u: string, init: RequestInit) => {
      corpo = JSON.parse(String(init.body))
      return new Response(JSON.stringify({ id: 'p', init_point: 'https://mp/pay', sandbox_init_point: 'https://mp/sandbox' }), { status: 201 })
    }) as unknown as typeof fetch
    const r = await criarPreferencia({ id: 'a', token: 't', valorCentavos: 990, nome: 'A', email: 'a@b.c' }, 'http://localhost:3000', 'TEST-1', fake)
    expect(corpo.auto_return).toBeUndefined()
    expect(r.urlPagamento).toBe('https://mp/sandbox')
  })

  it('buscarPagamento valida o id e propaga erro HTTP', async () => {
    await expect(buscarPagamento('abc', 't')).rejects.toThrow('inválido')
    const http404 = (async () => new Response('no', { status: 404 })) as unknown as typeof fetch
    await expect(buscarPagamento('123', 't', http404)).rejects.toMatchObject({ status: 404 })
  })
})
