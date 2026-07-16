-- CreateEnum
CREATE TYPE "Role" AS ENUM ('cliente', 'admin');

-- CreateEnum
CREATE TYPE "TipoPagamento" AS ENUM ('sinal', 'parcela', 'taxa');

-- CreateEnum
CREATE TYPE "OrigemLead" AS ENUM ('form_distrato', 'calculadora', 'whatsapp');

-- CreateEnum
CREATE TYPE "StatusLead" AS ENUM ('novo', 'em_analise', 'contatado', 'convertido', 'perdido');

-- CreateEnum
CREATE TYPE "StatusAnuncio" AS ENUM ('pendente', 'aprovado', 'em_negociacao', 'vendido', 'rejeitado');

-- CreateEnum
CREATE TYPE "StatusProposta" AS ENUM ('aberta', 'em_negociacao', 'concluida', 'cancelada');

-- CreateEnum
CREATE TYPE "TipoIndice" AS ENUM ('INCC_DI_FGV', 'IPCA');

-- CreateEnum
CREATE TYPE "TeseJuros" AS ENUM ('selic_transito_julgado', 'um_por_cento_citacao');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "phone" TEXT,
    "role" "Role" NOT NULL DEFAULT 'cliente',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Empreendimento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "uf" TEXT NOT NULL,
    "dataHabiteSePrevista" TIMESTAMP(3),
    "dataHabiteSeReal" TIMESTAMP(3),
    "indiceCorrecaoPreHabiteSe" "TipoIndice" NOT NULL DEFAULT 'INCC_DI_FGV',
    "indiceCorrecaoPosHabiteSe" "TipoIndice" NOT NULL DEFAULT 'IPCA',
    "percentualMultaPadrao" DECIMAL(5,4) NOT NULL DEFAULT 0.50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Empreendimento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cota" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "empreendimentoId" TEXT NOT NULL,
    "unidade" TEXT,
    "bloco" TEXT,
    "fracaoTempo" TEXT,
    "dataContrato" TIMESTAMP(3) NOT NULL,
    "valorTotalContrato" DECIMAL(12,2) NOT NULL,
    "valorComissaoCorretagem" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "percentualMultaContratual" DECIMAL(5,4) NOT NULL DEFAULT 0.50,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cota_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Pagamento" (
    "id" TEXT NOT NULL,
    "cotaId" TEXT NOT NULL,
    "data" TIMESTAMP(3) NOT NULL,
    "valor" DECIMAL(12,2) NOT NULL,
    "tipo" "TipoPagamento" NOT NULL DEFAULT 'parcela',

    CONSTRAINT "Pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculoResultado" (
    "id" TEXT NOT NULL,
    "cotaId" TEXT NOT NULL,
    "dataCalculo" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "parametrosUsados" JSONB NOT NULL,
    "cenarios" JSONB NOT NULL,

    CONSTRAINT "CalculoResultado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "contato" TEXT NOT NULL,
    "empreendimento" TEXT,
    "valorPagoAprox" DECIMAL(12,2),
    "motivo" TEXT,
    "origem" "OrigemLead" NOT NULL DEFAULT 'form_distrato',
    "status" "StatusLead" NOT NULL DEFAULT 'novo',
    "detalhes" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Anuncio" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cotaId" TEXT,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "fotos" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "precoPedido" DECIMAL(12,2) NOT NULL,
    "status" "StatusAnuncio" NOT NULL DEFAULT 'pendente',
    "disponibilidades" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Anuncio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PropostaTroca" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "cotaOfertadaId" TEXT,
    "periodoDesejado" TEXT NOT NULL,
    "empreendimentoDesejado" TEXT NOT NULL,
    "status" "StatusProposta" NOT NULL DEFAULT 'aberta',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PropostaTroca_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Video" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "urlEmbed" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "ordem" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Video_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Artigo" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "conteudoMarkdown" TEXT NOT NULL,
    "publicadoEm" TIMESTAMP(3),
    "autor" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Artigo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "IndiceEconomico" (
    "id" TEXT NOT NULL,
    "indice" "TipoIndice" NOT NULL,
    "competencia" TIMESTAMP(3) NOT NULL,
    "numeroIndice" DECIMAL(14,6) NOT NULL,

    CONSTRAINT "IndiceEconomico_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CalculadoraConfig" (
    "id" TEXT NOT NULL DEFAULT 'default',
    "percentualConservador" DECIMAL(5,4) NOT NULL DEFAULT 0.50,
    "percentualIntermediario" DECIMAL(5,4) NOT NULL DEFAULT 0.75,
    "percentualOtimista" DECIMAL(5,4) NOT NULL DEFAULT 0.90,
    "teseJurosPadrao" "TeseJuros" NOT NULL DEFAULT 'selic_transito_julgado',
    "mesesEstimadosPadrao" INTEGER NOT NULL DEFAULT 18,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CalculadoraConfig_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "Cota_userId_idx" ON "Cota"("userId");

-- CreateIndex
CREATE INDEX "Pagamento_cotaId_idx" ON "Pagamento"("cotaId");

-- CreateIndex
CREATE INDEX "CalculoResultado_cotaId_idx" ON "CalculoResultado"("cotaId");

-- CreateIndex
CREATE INDEX "Anuncio_userId_idx" ON "Anuncio"("userId");

-- CreateIndex
CREATE INDEX "Anuncio_status_idx" ON "Anuncio"("status");

-- CreateIndex
CREATE INDEX "PropostaTroca_userId_idx" ON "PropostaTroca"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Artigo_slug_key" ON "Artigo"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "IndiceEconomico_indice_competencia_key" ON "IndiceEconomico"("indice", "competencia");

-- AddForeignKey
ALTER TABLE "Cota" ADD CONSTRAINT "Cota_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Cota" ADD CONSTRAINT "Cota_empreendimentoId_fkey" FOREIGN KEY ("empreendimentoId") REFERENCES "Empreendimento"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Pagamento" ADD CONSTRAINT "Pagamento_cotaId_fkey" FOREIGN KEY ("cotaId") REFERENCES "Cota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CalculoResultado" ADD CONSTRAINT "CalculoResultado_cotaId_fkey" FOREIGN KEY ("cotaId") REFERENCES "Cota"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anuncio" ADD CONSTRAINT "Anuncio_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Anuncio" ADD CONSTRAINT "Anuncio_cotaId_fkey" FOREIGN KEY ("cotaId") REFERENCES "Cota"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PropostaTroca" ADD CONSTRAINT "PropostaTroca_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
