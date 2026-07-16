-- AlterTable
ALTER TABLE "CalculadoraConfig" ADD COLUMN     "taxaIpcaMensalEmbutida" DECIMAL(6,5) NOT NULL DEFAULT 0.004,
ADD COLUMN     "taxaJurosMensalSimples" DECIMAL(6,5) NOT NULL DEFAULT 0.01,
ADD COLUMN     "taxaSelicMensal" DECIMAL(6,5) NOT NULL DEFAULT 0.01;
