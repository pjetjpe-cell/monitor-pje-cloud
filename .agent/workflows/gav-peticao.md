---
description: Gera a petição (inicial, cota quitada, réplica, avulsa, cumprimento) pelo Peticionador GAV v4 e confere o PDF.
---

# /gav-peticao

Antes: leia `.agent/rules/gav-esteira.md` e o arquivo do agente indicado abaixo,
inteiro, incluindo `## Caminhos alternativos`. Rode as ferramentas a partir de
`ferramentas/` (no Windows: `python` ou `py -3`, que precisa de PyMuPDF; OCR
precisa do Tesseract com o idioma `por`).
Agente de referência: `.claude/agents/gav-peticionador.md`.

1. claude.ai → projeto PROCESSOS MULTIPROPRIEDADE → "2 PREENCHEDOR DE PETIÇÃO INTERATIVA"
   → artefato "Peticionador gav v4" (o browser agent precisa da conta do escritório logada).
2. Preencher com IA a partir do `03 EXTRATO DE PAGAMENTOS`; conferir cada campo contra o extrato/contrato.
3. Baixar HTML → Imprimir → Salvar como PDF → `Petição Inicial — NOME DO CLIENTE.pdf`.
4. Prova: nome e CPF iguais ao contrato, data com mês, valor da causa = RECEBIDO, sem "[___]" além da vara.
