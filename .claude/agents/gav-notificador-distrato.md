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

## Caminhos alternativos
Formato: caminho · quem executa · como conferir. "(não testado)" = não validado.

**1. Conector do Gmail indisponível.** B: entregue destinatários, assunto e corpo
prontos; o usuário cola no Gmail web de dipallacio@gmail.com e envia · usuário.
C: Desktop Commander abre o Gmail no Chrome do escritório e o usuário confere e
envia (não testado). Nunca envie por outra conta. Conferir: quando o conector
voltar, `search_threads` `to:contato@gavresorts.com.br in:sent "<NOME>"`.

**2. Voltou ou sem resposta da GAV.** A GAV costuma mandar confirmação automática
num thread separado ("Confirmação de recebimento da sua solicitação: <assunto>",
ex. Yasmym, 22/09) e responder com "RE:" no mesmo thread (ex. Henrique, 6 dias
depois). Busque `from:gavresorts.com.br "<NOME>"` e `from:mailer-daemon "<NOME>"`
· agente lê. Devolução: confira o endereço e peça "pode enviar" de novo. Sem
confirmação após ~5 dias úteis: item 6. Resposta negativa (ex. "cotas quitadas"):
não responda; leve ao usuário · usuário decide.

**3. PDF sem o Gmail na tela.** B (padrão): o usuário faz Enviados → Imprimir tudo
→ Salvar como PDF · usuário. C: Desktop Commander + Chrome 9222 logado em
dipallacio@: abrir o `viewUrl` e `Page.printToPDF` (não testado; numa janela
não-headless pode falhar ou sair sem o cabeçalho do "Imprimir tudo") · agente.
D: não existe; PDF reconstruído com o texto do `get_thread` não vale como 08.
Conferir: o PDF mostra dipallacio@gmail.com, contato@ (e cc), data e assunto;
depois `gav.pasta --para compartilhar`.

**4. Falta dado do Modelo B.** Busque no contrato/extrato; senão, pergunte · agente.
Alternativa já usada pelo escritório (DANIELE KROLHING, 16/10, thread
`1a14594276f9eab3`): "registro administrativo" com lista de empreendimento,
empresa contratada, venda e data, bloco/apto/cota, titulares e RECEBIDO do
demonstrativo — dispensa nº do contrato e valor contratado, mas não traz CPF.
Só com o aval do usuário, e cada dado continua com fonte. Conferir: zero `{`.

**5. Co-titulares.** Os dois com nome e CPF, "procuradora dos Srs. X, CPF ..., e Y,
CPF ...", plural "Os Notificantes" (ex. Henrique/Franciele, 23/10); os dois
precisam estar na procuração assinada, senão o rascunho espera · agente.
Conferir com `get_draft`: os dois CPFs no corpo, nomes no assunto, cc
controladoria@ se cota quitada (o caso Henrique, quitado, saiu sem o cc).

**6. Reiteração (Modelo A).** Antes, busque no Enviados para não duplicar (a YANA
tem dois envios idênticos). Responda no mesmo thread com o Modelo A citando data
e assunto do primeiro envio; só com "pode enviar" · agente prepara, usuário
autoriza. Conferir: `get_thread` com 2+ mensagens SENT; reimprimir o thread
inteiro e substituir o 08 (não testado).

**7. Provar o envio sem o PDF.** Registre na etapa: threadId, messageId, `date`
(UTC; Recife = UTC−3), `labelIds` com SENT, destinatários, assunto e `viewUrl`
(só abre logado em dipallacio@), mais o thread de confirmação da GAV, se houver
· agente. É evidência, não substituto: a etapa fica `pendente` até o 08 existir.
