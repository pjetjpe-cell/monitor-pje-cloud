---
description: Missão GAV completa de um cliente (WhatsApp → pasta → procuração → petição → distrato → upload → compartilhar), sem pular etapa.
---

# /gav-missao

Antes: leia `.agent/rules/gav-esteira.md` e o arquivo do agente indicado abaixo,
inteiro, incluindo `## Caminhos alternativos`. Rode as ferramentas a partir de
`ferramentas/` (no Windows: `python` ou `py -3`, que precisa de PyMuPDF; OCR
precisa do Tesseract com o idioma `por`).
Agente de referência: `.claude/agents/gav-orquestrador.md`.

1. Pergunte o cliente se não foi dito; localize-o **só** em PROCESSOS DISTRATO → CLIENTES.
2. `python -m gav.esteira status --dossie %USERPROFILE%\.gav\dossies\<NNN>.json` (sem dossiê: `iniciar`).
3. Para cada etapa liberada, rode o fluxo correspondente: /gav-coletar, /gav-preparar,
   /gav-procuracao, /gav-peticao, /gav-notificar, /gav-publicar.
4. Só registre `ok` com a prova da etapa (tabela em `.claude/agents/gav-orquestrador.md`).
5. Pare e peça "pode" antes de enviar e-mail, compartilhar, renomear pasta existente ou apagar.
6. Termine com: pronto (com prova) · falta · não feito e por quê · próxima ação.
