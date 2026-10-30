# Computador do escritório (DESKTOP-TO80D26)

Windows 11, usuário `gigica`. Acesso dos agentes: **Desktop Commander**
(`npx @wonderwhy-er/desktop-commander@latest remote`, janela aberta). Sem ele,
os agentes entregam comandos para o usuário colar.

| Item | Onde | Estado (30/10/2026) |
|---|---|---|
| Node + playwright | `C:\Users\gigica\gav-whatsapp` | instalado; baixar.mjs e conversas.mjs |
| Chrome com depuração | porta 9222, `--user-data-dir=%USERPROFILE%\.chrome-whatsapp` | WhatsApp Business logado nele |
| Pasta de trabalho | `C:\Users\gigica\Downloads\CLIENTE XXX` | criada a cada cliente |
| Firefox | PDFs (RG pp. 33-36, alterar procuração) | instalado |
| Google Drive (G:) | conta leodecs14estudar — **não** é a CLIENTES | não usar para subir |
| Python + PyMuPDF + Tesseract | — | **não verificado** |

## Compressão — o que a esteira faz hoje

1. `gav.compressao` (Python/PyMuPDF): melhor opção — degrau mínimo para < 3 MB,
   mantém texto, confere páginas; divide sem perda em `04 CONTRATO PARTE 1-N`.
   Roda na nuvem quando o arquivo está aqui; no PC precisa de Python:
   `winget install -e --id Python.Python.3.12` → `py -m pip install pymupdf`
   (+ Tesseract com `por` para RG e conferência por OCR:
   `winget install -e --id UB-Mannheim.TesseractOCR` e `por.traineddata` em
   `C:\Program Files\Tesseract-OCR\tessdata`). Instalar software no PC só com o
   "pode" do usuário.
2. Artefato **Contrato para o PJe** (navegador): divide, comprime, recorta 33-36.
3. **pdf24** (vídeo 3): DPI 100, qualidade 60% — envia o arquivo a terceiros.

A nuvem não recebe arquivo grande do Drive (o MCP devolve base64 no contexto:
inviável acima de ~800 KB) — por isso a compressão de contrato acontece no PC
ou no navegador.
