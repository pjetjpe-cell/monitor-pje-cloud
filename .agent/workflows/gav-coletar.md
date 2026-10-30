---
description: Baixa do WhatsApp Web os documentos do cliente para Downloads\CLIENTE XXX\NAO USAR, sem escrever na conversa.
---

# /gav-coletar

Antes: leia `.agent/rules/gav-esteira.md` e o arquivo do agente indicado abaixo,
inteiro, incluindo `## Caminhos alternativos`. Rode as ferramentas a partir de
`ferramentas/` (no Windows: `python` ou `py -3`, que precisa de PyMuPDF; OCR
precisa do Tesseract com o idioma `por`).
Agente de referência: `.claude/agents/gav-coletor-whatsapp.md`.

1. Chrome com WhatsApp Web logado e porta 9222 (ver `.claude/skills/gav-whatsapp/SKILL.md`).
   Se preferir o browser agent do Antigravity: só leitura e download — nunca digite na conversa.
2. `node ferramentas/whatsapp/conversas.mjs "<termo>"` → título exato da conversa.
3. `node ferramentas/whatsapp/baixar.mjs --contato "<título>" --destino "C:\Users\gigica\Downloads\CLIENTE XXX\NAO USAR"`.
4. Prova: o manifesto (arquivos + sha256) e a lista do que ficou indisponível.
