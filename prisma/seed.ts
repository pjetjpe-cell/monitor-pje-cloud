// Seed com dados 100% fictícios — nenhum nome, CPF, número de processo ou
// valor de caso real. Ver seção 12 do briefing do produto.
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

function mesRef(ano: number, mes: number): Date {
  return new Date(Date.UTC(ano, mes - 1, 1))
}

async function main() {
  const senhaAdmin = await bcrypt.hash('admin123', 10)
  const senhaCliente = await bcrypt.hash('cliente123', 10)

  const admin = await prisma.user.upsert({
    where: { email: 'admin@dipallacio.example' },
    update: {},
    create: {
      name: 'Administrador Di Pallacio',
      email: 'admin@dipallacio.example',
      passwordHash: senhaAdmin,
      role: 'admin',
    },
  })

  const cliente = await prisma.user.upsert({
    where: { email: 'cliente@dipallacio.example' },
    update: {},
    create: {
      name: 'Cliente Exemplo',
      email: 'cliente@dipallacio.example',
      phone: '11999990000',
      passwordHash: senhaCliente,
      role: 'cliente',
    },
  })

  const existentes = await prisma.empreendimento.findMany()
  const [emp1, emp2, emp3] =
    existentes.length >= 3
      ? existentes
      : await Promise.all(
          [
            {
              nome: 'Costa Serena Resort Multipropriedade',
              cidade: 'Guarujá',
              uf: 'SP',
              dataHabiteSePrevista: new Date('2019-12-01'),
              dataHabiteSeReal: new Date('2020-06-01'),
            },
            {
              nome: 'Vale Encantado Clube de Férias',
              cidade: 'Gramado',
              uf: 'RS',
              dataHabiteSePrevista: new Date('2021-03-01'),
              dataHabiteSeReal: new Date('2021-09-01'),
            },
            {
              nome: 'Recanto das Águas Timeshare',
              cidade: 'Caldas Novas',
              uf: 'GO',
              dataHabiteSePrevista: new Date('2022-01-01'),
              dataHabiteSeReal: null,
            },
          ].map(dados => prisma.empreendimento.create({ data: dados }))
        )

  // Série fictícia de índices — apenas para exercitar a calculadora, não são valores reais de mercado.
  const pontosIndices: { indice: 'INCC_DI_FGV' | 'IPCA'; competencia: Date; numeroIndice: number }[] = []
  let incc = 1000
  let ipca = 1000
  for (let ano = 2019; ano <= 2026; ano++) {
    for (let mes = 1; mes <= 12; mes++) {
      if (ano === 2026 && mes > 7) break
      incc *= 1.005
      ipca *= 1.004
      pontosIndices.push({ indice: 'INCC_DI_FGV', competencia: mesRef(ano, mes), numeroIndice: Number(incc.toFixed(4)) })
      pontosIndices.push({ indice: 'IPCA', competencia: mesRef(ano, mes), numeroIndice: Number(ipca.toFixed(4)) })
    }
  }
  for (const ponto of pontosIndices) {
    await prisma.indiceEconomico.upsert({
      where: { indice_competencia: { indice: ponto.indice, competencia: ponto.competencia } },
      update: { numeroIndice: ponto.numeroIndice },
      create: ponto,
    })
  }

  await prisma.calculadoraConfig.upsert({
    where: { id: 'default' },
    update: {},
    create: { id: 'default' },
  })

  const cotaExistente = await prisma.cota.findFirst({ where: { userId: cliente.id } })
  const cota =
    cotaExistente ??
    (await prisma.cota.create({
      data: {
        userId: cliente.id,
        empreendimentoId: emp1.id,
        unidade: '204',
        bloco: 'B',
        fracaoTempo: '1 semana - temporada alta',
        dataContrato: new Date('2019-08-10'),
        valorTotalContrato: 42000,
        valorComissaoCorretagem: 4200,
        percentualMultaContratual: 0.5,
      },
    }))

  const pagamentosExistentes = await prisma.pagamento.count({ where: { cotaId: cota.id } })
  if (pagamentosExistentes === 0) {
    await prisma.pagamento.createMany({
      data: [
        { cotaId: cota.id, data: new Date('2019-08-10'), valor: 8400, tipo: 'sinal' },
        { cotaId: cota.id, data: new Date('2019-09-10'), valor: 2800, tipo: 'parcela' },
        { cotaId: cota.id, data: new Date('2019-10-10'), valor: 2800, tipo: 'parcela' },
        { cotaId: cota.id, data: new Date('2019-11-10'), valor: 2800, tipo: 'parcela' },
        { cotaId: cota.id, data: new Date('2020-08-10'), valor: 2800, tipo: 'parcela' },
      ],
    })
  }

  const anunciosExistentes = await prisma.anuncio.count()
  if (anunciosExistentes === 0) {
    await prisma.anuncio.createMany({
      data: [
        {
          userId: cliente.id,
          cotaId: cota.id,
          titulo: 'Cota semana alta — Costa Serena Resort',
          descricao: 'Fração de tempo com vista para o mar, mobiliada, ideal para férias de família.',
          fotos: [],
          precoPedido: 15000,
          status: 'aprovado',
        },
        {
          userId: cliente.id,
          titulo: 'Semana intermediária — Vale Encantado',
          descricao: 'Cota com boa localização, próxima ao centro de eventos.',
          fotos: [],
          precoPedido: 9000,
          status: 'pendente',
        },
      ],
    })
  }

  const videosExistentes = await prisma.video.count()
  if (videosExistentes === 0) {
    await prisma.video.createMany({
      data: [
        {
          titulo: 'Entenda seus direitos na multipropriedade',
          descricao: 'Visão geral sobre a Lei 13.786/2018 e o direito ao distrato.',
          urlEmbed: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          categoria: 'Entenda seus direitos',
          ordem: 1,
        },
        {
          titulo: 'Como funciona o processo de distrato',
          descricao: 'Passo a passo, da consulta inicial até a sentença.',
          urlEmbed: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          categoria: 'Como funciona o processo',
          ordem: 2,
        },
        {
          titulo: 'Depoimento fictício de cliente',
          descricao: 'Depoimento ilustrativo (personagem fictício) sobre a experiência do processo.',
          urlEmbed: 'https://www.youtube.com/embed/dQw4w9WgXcQ',
          categoria: 'Depoimentos',
          ordem: 3,
        },
      ],
    })
  }

  const artigosExistentes = await prisma.artigo.count()
  if (artigosExistentes === 0) {
    await prisma.artigo.createMany({
      data: [
        {
          titulo: 'O que é multipropriedade?',
          slug: 'o-que-e-multipropriedade',
          conteudoMarkdown:
            '# O que é multipropriedade?\n\nMultipropriedade (ou *timeshare*) é o regime em que várias pessoas são proprietárias de frações de tempo de uso de um mesmo imóvel...',
          publicadoEm: new Date('2024-01-15'),
          autor: 'Equipe Di Pallacio',
        },
        {
          titulo: 'O que diz a Lei do Distrato',
          slug: 'o-que-diz-a-lei-do-distrato',
          conteudoMarkdown:
            '# Lei 13.786/2018\n\nConhecida como Lei do Distrato, regula a resolução de contratos de incorporação imobiliária e loteamento...',
          publicadoEm: new Date('2024-02-20'),
          autor: 'Equipe Di Pallacio',
        },
        {
          titulo: 'IPCA e juros: como funciona a correção de valores',
          slug: 'ipca-e-juros-correcao-de-valores',
          conteudoMarkdown:
            '# Correção monetária e juros\n\nEntenda a diferença entre correção monetária (IPCA/INCC) e juros de mora, e como cada um impacta o valor a restituir...',
          publicadoEm: new Date('2024-03-05'),
          autor: 'Equipe Di Pallacio',
        },
      ],
    })
  }

  const leadsExistentes = await prisma.lead.count()
  if (leadsExistentes === 0) {
    await prisma.lead.createMany({
      data: [
        {
          nome: 'Lead Exemplo 1',
          contato: '11988887777',
          empreendimento: emp1.nome,
          valorPagoAprox: 18000,
          motivo: 'Não consigo mais arcar com as parcelas.',
          origem: 'form_distrato',
          status: 'novo',
        },
        {
          nome: 'Lead Exemplo 2',
          contato: 'lead2@example.com',
          empreendimento: emp2.nome,
          valorPagoAprox: 9500,
          motivo: 'Comprei por impulso durante viagem, não uso a cota.',
          origem: 'calculadora',
          status: 'em_analise',
        },
      ],
    })
  }

  console.log('Seed concluído:')
  console.log(`  admin: admin@dipallacio.example / admin123`)
  console.log(`  cliente: cliente@dipallacio.example / cliente123`)
  console.log(`  empreendimentos: ${emp1.nome}, ${emp2.nome}, ${emp3.nome}`)
}

main()
  .catch(e => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
