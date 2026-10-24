-- CreateEnum
CREATE TYPE "StatusPedido" AS ENUM ('aguardando_pagamento', 'aguardando_conferencia', 'pago', 'cancelado');

-- AlterTable
ALTER TABLE "CalculadoraConfig" ADD COLUMN     "inccAtualizadoEm" TIMESTAMP(3),
ADD COLUMN     "ipcaAtualizadoEm" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "PedidoRelatorio" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "StatusPedido" NOT NULL DEFAULT 'aguardando_pagamento',
    "valorCentavos" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "providerRef" TEXT,
    "paymentId" TEXT,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "empreendimento" TEXT NOT NULL,
    "numeroCota" TEXT,
    "contratoUrl" TEXT,
    "entrada" JSONB NOT NULL,
    "resultado" JSONB NOT NULL,
    "leadId" TEXT,
    "consentimentoEm" TIMESTAMP(3) NOT NULL,
    "pagoEm" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PedidoRelatorio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PedidoRelatorio_token_key" ON "PedidoRelatorio"("token");

-- CreateIndex
CREATE UNIQUE INDEX "PedidoRelatorio_paymentId_key" ON "PedidoRelatorio"("paymentId");

-- CreateIndex
CREATE INDEX "PedidoRelatorio_status_createdAt_idx" ON "PedidoRelatorio"("status", "createdAt");
