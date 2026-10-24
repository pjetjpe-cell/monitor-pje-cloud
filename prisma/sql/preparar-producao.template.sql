-- Di Pallacio Enterprise — limpeza dos dados de DEMONSTRAÇÃO antes de abrir o site ao público.
-- Execute UMA vez no SQL Editor do Neon, DEPOIS do seed/migrations.
-- Substitua __HASH_BCRYPT_DA_SENHA__ pelo hash bcrypt da nova senha de administrador
-- (gere com: node -e "console.log(require('bcryptjs').hashSync(process.argv[1], 12))" 'SUA_SENHA_FORTE').

BEGIN;

-- 1) Administrador: troca o e-mail/senha de demonstração (admin123) por credenciais reais.
UPDATE "User"
   SET email = 'pjetjpe@gmail.com',
       name = 'Administrador Di Pallacio',
       "passwordHash" = '__HASH_BCRYPT_DA_SENHA__'
 WHERE email = 'admin@dipallacio.example';

-- 2) Cliente de demonstração e tudo que depende dele (cotas, pagamentos, anúncios, propostas, cálculos).
DELETE FROM "User" WHERE email = 'cliente@dipallacio.example';

-- 3) Empreendimentos fictícios do seed.
DELETE FROM "Empreendimento"
 WHERE nome IN ('Costa Serena Resort Multipropriedade', 'Vale Encantado Clube de Férias', 'Recanto das Águas Timeshare')
   AND NOT EXISTS (SELECT 1 FROM "Cota" c WHERE c."empreendimentoId" = "Empreendimento".id);

-- 4) Leads de exemplo e vídeos de exemplo.
DELETE FROM "Lead" WHERE nome LIKE 'Lead Exemplo %';
DELETE FROM "Video"
 WHERE titulo IN ('Entenda seus direitos na multipropriedade', 'Como funciona o processo de distrato', 'Depoimento fictício de cliente');

-- 5) Índices FICTÍCIOS: remove tudo e zera os carimbos. A série oficial do IPCA entra pelo botão
--    "Importar IPCA do IBGE" em /admin/indices (a calculadora pública só abre depois disso).
DELETE FROM "IndiceEconomico";
UPDATE "CalculadoraConfig" SET "ipcaAtualizadoEm" = NULL, "inccAtualizadoEm" = NULL;

COMMIT;
