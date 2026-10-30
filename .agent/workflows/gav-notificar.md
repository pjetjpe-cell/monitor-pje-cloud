---
description: Rascunha a notificação de distrato à GAV no Gmail da Di PALLACIO; envia só com 'pode enviar'; salva o PDF na pasta.
---

# /gav-notificar

Antes: leia `.agent/rules/gav-esteira.md` e o arquivo do agente indicado abaixo,
inteiro, incluindo `## Caminhos alternativos`. Rode as ferramentas a partir de
`ferramentas/` (no Windows: `python` ou `py -3`, que precisa de PyMuPDF; OCR
precisa do Tesseract com o idioma `por`).
Agente de referência: `.claude/agents/gav-notificador-distrato.md`.

1. Rascunho em dipallacio@gmail.com para contato@gavresorts.com.br (+ controladoria@ se cota quitada),
   Modelo B de `.claude/skills/gav-esteira/references/email-gav.md`.
2. **Pare.** Mostre o rascunho e espere o "pode enviar" do usuário.
3. Depois de enviado: Enviados → Imprimir tudo → Salvar como PDF → `08 NOTIFICAÇÃO EXTRAJUDICIAL.pdf`.
4. Prova: threadId/data do envio + o PDF na pasta interna.
