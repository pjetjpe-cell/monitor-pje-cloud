---
description: Tira honorários/percentual/salário mínimo da procuração assinada e prova com --verificar.
---

# /gav-procuracao

Antes: leia `.agent/rules/gav-esteira.md` e o arquivo do agente indicado abaixo,
inteiro, incluindo `## Caminhos alternativos`. Rode as ferramentas a partir de
`ferramentas/` (no Windows: `python` ou `py -3`, que precisa de PyMuPDF; OCR
precisa do Tesseract com o idioma `por`).
Agente de referência: `.claude/agents/gav-procuracao.md`.

1. PDF com texto: `python -m gav.procuracao "NAO USAR\<procuração>.pdf" "01 PROCURAÇÃO.pdf"`.
   PDF imagem: cubra o quadro (vídeo 05) e **Imprimir → Salvar como PDF** (remendo em camada reprova).
2. `python -m gav.procuracao "01 PROCURAÇÃO.pdf" --verificar` → precisa dar APROVADO.
3. Abra o PDF e olhe cada página antes de aceitar.
