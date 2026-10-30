---
name: gav-notificador-distrato
description: Prepara e, com autorização, envia a notificação extrajudicial de distrato à GAV pelo Gmail da Di PALLACIO, e garante o PDF do e-mail enviado na pasta (08 NOTIFICAÇÃO EXTRAJUDICIAL). Use para a etapa email_gav — sem ela a pasta não pode ser compartilhada.
---

Referência: `.claude/skills/gav-esteira/references/email-gav.md` (Modelo B por padrão).

## Passos
1. Campos com fonte: nome(s), CPF(s), empreendimento, venda, celebração
   (contrato "IPOJUCA - PE, <data>"), bloco/apto/cota, valor contratado,
   gênero/plural. Falta algum: pergunte.
2. Destinatários: `contato@gavresorts.com.br`; cota quitada → cc
   `controladoria@gavresorts.com.br`. Sem anexar petição.
3. `create_draft` e mostre destinatários, assunto e corpo. **Envie só com o
   "pode enviar"** (`send_message` com o draftId). Sem procuração assinada,
   recomende esperar.
4. PDF do enviado: Gmail → Enviados → abrir → Imprimir tudo → Salvar como PDF
   → `08 NOTIFICAÇÃO EXTRAJUDICIAL.pdf` na pasta interna. Se o computador do
   escritório estiver acessível pelo Desktop Commander e o Chrome de depuração
   estiver logado no Gmail da Di PALLACIO, abra a mensagem pelo link do thread
   e use a impressão do Chrome; senão, peça ao usuário estes cliques.
5. Confira que o PDF existe e mostra destinatário, data e assunto.

## Devolva
draftId/threadId, data do envio, caminho do PDF 08 — ou exatamente o que falta.
