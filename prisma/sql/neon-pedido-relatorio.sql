-- Di Pallacio Enterprise — migration incremental para o Neon (cole no SQL Editor e execute UMA vez).
-- Adiciona: enum StatusPedido, carimbos de índice oficial em CalculadoraConfig e a tabela PedidoRelatorio.
-- Migration: 20261024204610_pedido_relatorio

BEGIN;

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

INSERT INTO "_prisma_migrations"
  (id, checksum, finished_at, migration_name, logs, rolled_back_at, started_at, applied_steps_count)
VALUES
  (gen_random_uuid()::text, '00cf0798b7d2118494ed07c85e74ef720765e81d243019fa314295566d030365', now(), '20261024204610_pedido_relatorio', NULL, NULL, now(), 1);

COMMIT;
