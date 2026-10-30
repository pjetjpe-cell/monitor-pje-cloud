---
description: Prepara 01 PROCURAÇÃO, 02 RG, 03 EXTRATO DE PAGAMENTOS e 04 CONTRATO (< 3 MB) com os originais em NAO USAR.
---

# /gav-preparar

Antes: leia `.agent/rules/gav-esteira.md` e o arquivo do agente indicado abaixo,
inteiro, incluindo `## Caminhos alternativos`. Rode as ferramentas a partir de
`ferramentas/` (no Windows: `python` ou `py -3`, que precisa de PyMuPDF; OCR
precisa do Tesseract com o idioma `por`).
Agente de referência: `.claude/agents/gav-preparador-documentos.md`.

1. Copie os originais para `NAO USAR` antes de renomear.
2. Contrato: `python -m gav.compressao "NAO USAR\<contrato>.pdf" "04 CONTRATO.pdf" --dividir-se-nao-couber`.
3. RG: `python -m gav.identidade "02 RG.pdf" --contrato "04 CONTRATO.pdf" --de 33 --ate 36`.
4. Prova: lista dos arquivos com tamanho (todos < 3 MB) e a página do RG.
