import { PDFDocument, PDFFont, PDFPage, StandardFonts, rgb, type RGB } from 'pdf-lib'
import type { EstimativaPublica } from '@/lib/calculadora/publica'
import { EMAIL_PRINCIPAL, NOME_ESCRITORIO, WHATSAPP_DISPLAY } from '@/lib/site/config'
import { competenciaCurta, dataBr, dataHoraBr, formatarWhatsapp, moeda, numero, percentual } from './formato'

// pdf-lib usa fontes padrão em WinAnsi: qualquer caractere fora dele derrubaria a geração.
const EXTRAS_CP1252 = new Set([
  0x20ac, 0x201a, 0x0192, 0x201e, 0x2026, 0x2020, 0x2021, 0x02c6, 0x2030, 0x0160, 0x2039, 0x0152, 0x017d, 0x2018, 0x2019,
  0x201c, 0x201d, 0x2022, 0x2013, 0x2014, 0x02dc, 0x2122, 0x0161, 0x203a, 0x0153, 0x017e, 0x0178,
])

export function sanitizarWinAnsi(texto: string): string {
  return Array.from(texto.normalize('NFC'))
    .map(ch => {
      const c = ch.codePointAt(0)!
      if (c === 0x09 || c === 0x0a || c === 0x0d || c === 0x202f || (c >= 0x2000 && c <= 0x200b)) return ' '
      if (c >= 0x20 && c <= 0x7e) return ch
      if (c >= 0xa0 && c <= 0xff) return ch
      if (EXTRAS_CP1252.has(c)) return ch
      return '?'
    })
    .join('')
}

const NAVY: RGB = rgb(0.043, 0.094, 0.165)
const MINT: RGB = rgb(0.31, 0.76, 0.65)
const MINT_ESCURO: RGB = rgb(0.09, 0.44, 0.37)
const TEXTO: RGB = rgb(0.1, 0.13, 0.19)
const SUAVE: RGB = rgb(0.4, 0.44, 0.5)
const LINHA: RGB = rgb(0.85, 0.86, 0.88)
const FUNDO: RGB = rgb(0.965, 0.955, 0.93)
const BRANCO: RGB = rgb(1, 1, 1)

const A4: [number, number] = [595.28, 841.89]
const MARGEM = 46
const LARGURA = A4[0] - MARGEM * 2

export interface DadosRelatorio {
  protocolo: string
  emitidoEm: Date
  pagoEm: Date | null
  valorCentavos: number
  nome: string
  email: string
  whatsapp: string
  empreendimento: string
  numeroCota: string | null
  estimativa: EstimativaPublica
}

interface Coluna {
  titulo: string
  largura: number
  alinhar?: 'esq' | 'dir'
}

class Escritor {
  doc!: PDFDocument
  page!: PDFPage
  y = 0
  sans!: PDFFont
  sansBold!: PDFFont
  serifBold!: PDFFont

  static async criar(): Promise<Escritor> {
    const e = new Escritor()
    e.doc = await PDFDocument.create()
    e.sans = await e.doc.embedFont(StandardFonts.Helvetica)
    e.sansBold = await e.doc.embedFont(StandardFonts.HelveticaBold)
    e.serifBold = await e.doc.embedFont(StandardFonts.TimesRomanBold)
    e.novaPagina()
    return e
  }

  novaPagina() {
    this.page = this.doc.addPage(A4)
    this.y = A4[1] - MARGEM
  }

  garantirEspaco(altura: number) {
    if (this.y - altura < MARGEM + 28) this.novaPagina()
  }

  largura(texto: string, fonte: PDFFont, tamanho: number) {
    return fonte.widthOfTextAtSize(sanitizarWinAnsi(texto), tamanho)
  }

  quebrar(texto: string, fonte: PDFFont, tamanho: number, larguraMax: number): string[] {
    const palavras = sanitizarWinAnsi(texto).split(' ').filter(Boolean)
    const linhas: string[] = []
    let atual = ''
    for (const palavra of palavras) {
      const tentativa = atual ? `${atual} ${palavra}` : palavra
      if (fonte.widthOfTextAtSize(tentativa, tamanho) <= larguraMax) {
        atual = tentativa
      } else {
        if (atual) linhas.push(atual)
        atual = palavra
      }
    }
    if (atual) linhas.push(atual)
    return linhas.length ? linhas : ['']
  }

  texto(
    conteudo: string,
    opcoes: { x?: number; tamanho?: number; fonte?: PDFFont; cor?: RGB; largura?: number; espaco?: number } = {}
  ) {
    const tamanho = opcoes.tamanho ?? 9.5
    const fonte = opcoes.fonte ?? this.sans
    const x = opcoes.x ?? MARGEM
    const larguraMax = opcoes.largura ?? LARGURA - (x - MARGEM)
    const entrelinha = tamanho * 1.38
    for (const linha of this.quebrar(conteudo, fonte, tamanho, larguraMax)) {
      this.garantirEspaco(entrelinha)
      this.page.drawText(linha, { x, y: this.y - tamanho, size: tamanho, font: fonte, color: opcoes.cor ?? TEXTO })
      this.y -= entrelinha
    }
    this.y -= opcoes.espaco ?? 0
  }

  titulo(conteudo: string) {
    this.garantirEspaco(46)
    this.y -= 10
    this.page.drawText(sanitizarWinAnsi(conteudo), { x: MARGEM, y: this.y - 14, size: 14, font: this.serifBold, color: NAVY })
    this.y -= 20
    this.page.drawRectangle({ x: MARGEM, y: this.y, width: 28, height: 2, color: MINT })
    this.y -= 10
  }

  campo(rotulo: string, valor: string) {
    this.garantirEspaco(26)
    this.page.drawText(sanitizarWinAnsi(rotulo.toUpperCase()), {
      x: MARGEM,
      y: this.y - 7,
      size: 7,
      font: this.sansBold,
      color: SUAVE,
    })
    this.y -= 10
    this.texto(valor, { tamanho: 10, fonte: this.sansBold, espaco: 4 })
  }

  tabela(colunas: Coluna[], linhas: string[][], opcoes: { totalUltimaLinha?: boolean } = {}) {
    const alturaLinha = 20
    const desenharCabecalho = () => {
      this.garantirEspaco(alturaLinha * 2)
      this.page.drawRectangle({ x: MARGEM, y: this.y - alturaLinha, width: LARGURA, height: alturaLinha, color: NAVY })
      let x = MARGEM
      for (const c of colunas) {
        const t = sanitizarWinAnsi(c.titulo)
        const w = this.sansBold.widthOfTextAtSize(t, 7.5)
        const px = c.alinhar === 'dir' ? x + c.largura - 6 - w : x + 6
        this.page.drawText(t, { x: px, y: this.y - 13.5, size: 7.5, font: this.sansBold, color: BRANCO })
        x += c.largura
      }
      this.y -= alturaLinha
    }

    desenharCabecalho()
    linhas.forEach((linha, i) => {
      if (this.y - alturaLinha < MARGEM + 28) {
        this.novaPagina()
        desenharCabecalho()
      }
      const total = opcoes.totalUltimaLinha && i === linhas.length - 1
      if (total) {
        this.page.drawRectangle({ x: MARGEM, y: this.y - alturaLinha, width: LARGURA, height: alturaLinha, color: FUNDO })
      } else if (i % 2 === 1) {
        this.page.drawRectangle({ x: MARGEM, y: this.y - alturaLinha, width: LARGURA, height: alturaLinha, color: rgb(0.985, 0.98, 0.97) })
      }
      this.page.drawLine({
        start: { x: MARGEM, y: this.y - alturaLinha },
        end: { x: MARGEM + LARGURA, y: this.y - alturaLinha },
        thickness: 0.5,
        color: LINHA,
      })
      let x = MARGEM
      colunas.forEach((c, j) => {
        const t = sanitizarWinAnsi(linha[j] ?? '')
        const fonte = total ? this.sansBold : this.sans
        const w = fonte.widthOfTextAtSize(t, 8.5)
        const px = c.alinhar === 'dir' ? x + c.largura - 6 - w : x + 6
        this.page.drawText(t, { x: px, y: this.y - 13.5, size: 8.5, font: fonte, color: TEXTO })
        x += c.largura
      })
      this.y -= alturaLinha
    })
    this.y -= 8
  }
}

const NOMES_CENARIO: Record<string, string> = {
  conservador: 'Conservador',
  intermediario: 'Intermediário',
  otimista: 'Otimista',
}

export async function gerarPdfRelatorio(d: DadosRelatorio): Promise<Uint8Array> {
  const w = await Escritor.criar()
  const { estimativa: e } = d

  w.doc.setTitle(`Relatório de estimativa — ${d.protocolo}`)
  w.doc.setAuthor(NOME_ESCRITORIO)
  w.doc.setSubject('Estimativa educacional de restituição — distrato de multipropriedade')
  w.doc.setProducer('Di Pallacio Enterprise')
  w.doc.setCreator('Di Pallacio Enterprise')
  w.doc.setCreationDate(d.emitidoEm)

  // Faixa de abertura
  w.page.drawRectangle({ x: 0, y: A4[1] - 118, width: A4[0], height: 118, color: NAVY })
  w.page.drawText('DI PALLACIO ENTERPRISE  -  FAMÍLIA & ASSOCIADOS', {
    x: MARGEM,
    y: A4[1] - 38,
    size: 8,
    font: w.sansBold,
    color: MINT,
  })
  w.page.drawText(sanitizarWinAnsi('Relatório de estimativa de restituição'), {
    x: MARGEM,
    y: A4[1] - 68,
    size: 24,
    font: w.serifBold,
    color: BRANCO,
  })
  w.page.drawText(sanitizarWinAnsi('Distrato de multipropriedade — cálculo médio educacional'), {
    x: MARGEM,
    y: A4[1] - 90,
    size: 10,
    font: w.sans,
    color: rgb(0.8, 0.85, 0.9),
  })
  w.y = A4[1] - 118 - 22

  // Identificação
  const larguraCol = LARGURA / 3
  const topo = w.y
  const meta: [string, string][] = [
    ['Protocolo', d.protocolo],
    ['Emitido em', dataHoraBr(d.emitidoEm)],
    ['Referência do cálculo', dataBr(e.premissas.dataReferencia)],
  ]
  meta.forEach(([rotulo, valor], i) => {
    const x = MARGEM + i * larguraCol
    w.page.drawText(sanitizarWinAnsi(rotulo.toUpperCase()), { x, y: topo - 7, size: 7, font: w.sansBold, color: SUAVE })
    w.page.drawText(sanitizarWinAnsi(valor), { x, y: topo - 21, size: 11, font: w.sansBold, color: TEXTO })
  })
  w.y = topo - 36

  w.titulo('Solicitante e cota')
  w.campo('Nome', d.nome)
  w.campo('E-mail', d.email)
  w.campo('WhatsApp', formatarWhatsapp(d.whatsapp))
  w.campo('Empreendimento', d.empreendimento)
  w.campo('Número da cota / venda', d.numeroCota ?? 'A informar pelo WhatsApp do escritório, citando o protocolo')

  // Resumo
  w.titulo('Resumo da estimativa')
  w.garantirEspaco(86)
  w.page.drawRectangle({ x: MARGEM, y: w.y - 74, width: LARGURA, height: 74, color: FUNDO })
  w.page.drawRectangle({ x: MARGEM, y: w.y - 74, width: 3, height: 74, color: MINT_ESCURO })
  w.page.drawText('FAIXA ESTIMADA DE RESTITUIÇÃO'.replace('Ç', 'C').replace('Ã', 'A'), {
    x: MARGEM + 16,
    y: w.y - 17,
    size: 7.5,
    font: w.sansBold,
    color: SUAVE,
  })
  w.page.drawText(sanitizarWinAnsi(`${moeda(e.faixa.minimo)}  a  ${moeda(e.faixa.maximo)}`), {
    x: MARGEM + 16,
    y: w.y - 42,
    size: 21,
    font: w.serifBold,
    color: NAVY,
  })
  w.page.drawText(
    sanitizarWinAnsi('Do cenário conservador (sem juros) ao otimista (com juros, tese mais favorável).'),
    { x: MARGEM + 16, y: w.y - 60, size: 8.5, font: w.sans, color: SUAVE }
  )
  w.y -= 90

  w.tabela(
    [
      { titulo: 'Item', largura: 330 },
      { titulo: 'Valor', largura: LARGURA - 330, alinhar: 'dir' },
    ],
    [
      ['Total pago informado', moeda(e.totais.totalPagoInformado)],
      ['Total atualizado pelo IPCA até a data de referência', moeda(e.totais.totalAtualizado)],
      [
        e.premissas.corretagemDeduzida
          ? 'Comissão de corretagem deduzida (valor nominal informado)'
          : 'Comissão de corretagem (incluída na base)',
        moeda(e.totais.corretagem),
      ],
      ['Base de restituição', moeda(e.totais.baseRestituicao)],
    ],
    { totalUltimaLinha: true }
  )

  // Cenários
  w.titulo('Cenários de restituição')
  w.texto(
    'Os três cenários são apresentados sempre em conjunto: nenhum deles é uma previsão do resultado do seu caso. ' +
      'A Tese A aplica juros pela SELIC líquida do IPCA sobre o período estimado até o trânsito em julgado; ' +
      'a Tese B aplica 1% ao mês, em juros simples, da data-base até o mesmo marco.',
    { tamanho: 9, cor: SUAVE, espaco: 8 }
  )
  w.tabela(
    [
      { titulo: 'Cenário', largura: 82 },
      { titulo: 'Retenção', largura: 52, alinhar: 'dir' },
      { titulo: 'Restituição', largura: 62, alinhar: 'dir' },
      { titulo: 'Sem juros', largura: 96, alinhar: 'dir' },
      { titulo: 'Com juros (Tese A)', largura: 105, alinhar: 'dir' },
      { titulo: 'Com juros (Tese B)', largura: LARGURA - 82 - 52 - 62 - 96 - 105, alinhar: 'dir' },
    ],
    e.cenarios.map(c => [
      NOMES_CENARIO[c.nome] ?? c.nome,
      percentual(c.percentualRetencao),
      percentual(c.percentualRestituicao),
      moeda(c.valorSemJuros),
      moeda(c.valorComJurosTeseA),
      moeda(c.valorComJurosTeseB),
    ])
  )

  // Memória de cálculo
  w.titulo('Memória de cálculo')
  w.texto(
    `Cada pagamento é corrigido pelo ${e.premissas.indice} (IBGE): valor × (número-índice da competência final ÷ ` +
      'número-índice da competência do pagamento). Valores arredondados para centavos na exibição.',
    { tamanho: 9, cor: SUAVE, espaco: 8 }
  )
  w.tabela(
    [
      { titulo: 'Pagamento', largura: 60 },
      { titulo: 'Data', largura: 58 },
      { titulo: 'Valor original', largura: 78, alinhar: 'dir' },
      { titulo: 'Índice inicial', largura: 92, alinhar: 'dir' },
      { titulo: 'Índice final', largura: 92, alinhar: 'dir' },
      { titulo: 'Fator', largura: 52, alinhar: 'dir' },
      { titulo: 'Valor corrigido', largura: LARGURA - 60 - 58 - 78 - 92 - 92 - 52, alinhar: 'dir' },
    ],
    [
      ...e.memoria.map((m, i) => [
        e.entrada.modo === 'rapido' ? 'Total' : `Pgto ${i + 1}`,
        dataBr(m.data),
        moeda(m.valorOriginal),
        `${numero(m.indiceInicial, 2)} (${competenciaCurta(m.competenciaInicial)})`,
        `${numero(m.indiceFinal, 2)} (${competenciaCurta(m.competenciaFinal)})`,
        numero(m.fator, 6),
        moeda(m.valorCorrigido),
      ]),
      ['Total', '', moeda(e.totais.totalPagoInformado), '', '', '', moeda(e.totais.totalAtualizado)],
    ],
    { totalUltimaLinha: true }
  )
  if (e.entrada.modo === 'rapido') {
    w.texto(
      `Estimativa em modo rápido: o total pago foi considerado em uma única data, a data média entre a compra ` +
        `(${dataBr(e.entrada.dataCompra)}) e o último pagamento (${
          e.entrada.dataUltimoPagamento ? dataBr(e.entrada.dataUltimoPagamento) : 'data de referência'
        }). Com a lista real de parcelas, o valor tende a ser mais preciso.`,
      { tamanho: 9, cor: SUAVE, espaco: 4 }
    )
  }

  // Premissas
  w.titulo('Premissas e método')
  const p = e.premissas
  const premissas = [
    `Índice: ${p.fonteIndice}. Série utilizada: ${competenciaCurta(p.serieDe)} a ${competenciaCurta(p.serieAte)}. Quando o mês de referência ainda não foi divulgado, usa-se o último índice disponível.`,
    `Data de referência da atualização: ${dataBr(p.dataReferencia)}.`,
    `Percentuais de restituição dos cenários: conservador ${percentual(p.percentuaisRestituicao.conservador)}, intermediário ${percentual(p.percentuaisRestituicao.intermediario)} e otimista ${percentual(p.percentuaisRestituicao.otimista)} da base de restituição.`,
    `Tese A: SELIC mensal de ${numero(p.taxaSelicMensal * 100, 2)}% menos IPCA embutido de ${numero(p.taxaIpcaMensalEmbutida * 100, 2)}% ao mês, por ${p.mesesEstimados} meses estimados até o trânsito em julgado.`,
    `Tese B: juros simples de ${numero(p.taxaJurosMensalSimples * 100, 2)}% ao mês, por ${p.mesesEstimados} meses estimados.`,
    'O prazo de tramitação (meses estimados) é uma premissa administrativa: varia conforme a comarca, a vara e o caso.',
    'Pagamentos anteriores à data de referência são corrigidos pelo índice do mês; não há aplicação de multa, honorários ou custas.',
  ]
  for (const item of premissas) {
    w.texto(`•  ${item}`, { tamanho: 9, espaco: 3, x: MARGEM + 6, largura: LARGURA - 12 })
  }

  // Avisos
  w.titulo('Limitações e avisos importantes')
  w.garantirEspaco(120)
  const avisos = [
    'Este documento é uma estimativa educacional, calculada automaticamente com base nas informações prestadas pelo próprio solicitante e em parâmetros gerais. ' +
      'Não constitui parecer jurídico, consultoria individualizada, garantia de resultado nem promessa de valor ou de prazo.',
    'A restituição efetivamente devida depende do contrato, das provas, das circunstâncias do caso concreto e da decisão do juízo competente. ' +
      'Os percentuais dos cenários são referências genéricas e podem divergir do que for decidido judicialmente.',
    `O valor de ${moeda(d.valorCentavos / 100)} pago por este relatório refere-se exclusivamente à sua emissão e não representa contratação de serviços advocatícios nem pagamento de honorários.`,
    'Recomenda-se a análise do seu caso por advogado. Os dados informados são tratados conforme a Lei Geral de Proteção de Dados (Lei 13.709/2018), para a emissão deste relatório e para o retorno do escritório.',
  ]
  for (const aviso of avisos) {
    w.texto(aviso, { tamanho: 9, espaco: 5 })
  }

  w.y -= 4
  w.texto(`Dúvidas: WhatsApp ${WHATSAPP_DISPLAY}  |  ${EMAIL_PRINCIPAL}  |  cite o protocolo ${d.protocolo}.`, {
    tamanho: 9,
    fonte: w.sansBold,
    cor: MINT_ESCURO,
  })

  // Rodapé em todas as páginas
  const paginas = w.doc.getPages()
  paginas.forEach((pagina, i) => {
    pagina.drawLine({ start: { x: MARGEM, y: 34 }, end: { x: MARGEM + LARGURA, y: 34 }, thickness: 0.5, color: LINHA })
    pagina.drawText(sanitizarWinAnsi(`${NOME_ESCRITORIO}  |  Protocolo ${d.protocolo}`), {
      x: MARGEM,
      y: 22,
      size: 7.5,
      font: w.sans,
      color: SUAVE,
    })
    const rotulo = `Página ${i + 1} de ${paginas.length}`
    pagina.drawText(sanitizarWinAnsi(rotulo), {
      x: MARGEM + LARGURA - w.sans.widthOfTextAtSize(sanitizarWinAnsi(rotulo), 7.5),
      y: 22,
      size: 7.5,
      font: w.sans,
      color: SUAVE,
    })
  })

  return w.doc.save()
}
