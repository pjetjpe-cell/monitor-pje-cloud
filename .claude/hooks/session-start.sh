#!/bin/bash
set -euo pipefail

# Roda só em ambiente remoto do Claude Code, onde o contêiner é novo a cada sessão.
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 600000}'

cd "$CLAUDE_PROJECT_DIR"

# Dependências Node do projeto Next.js.
if [ -f package.json ]; then
  npm install
fi

# Navegadores do Playwright, se o projeto tiver testes E2E.
if [ -f playwright.config.ts ] || [ -f playwright.config.js ]; then
  npx playwright install chromium --with-deps
fi

# --- Esteira GAV ---------------------------------------------------------
# Sem isto a esteira não roda numa sessão nova: o contêiner vem limpo e as
# ferramentas de PDF não fazem parte da imagem.

if [ -f ferramentas/requirements.txt ]; then
  pip install --quiet --disable-pip-version-check -r ferramentas/requirements.txt || \
    echo "AVISO: PyMuPDF não instalou — a esteira GAV não vai rodar." >&2
fi

# OCR do RG escaneado. É binário, não pacote Python. Sem ele a extração do
# documento de identificação empata entre as páginas 33-35 e recusa escolher.
if ! command -v tesseract >/dev/null 2>&1; then
  if command -v apt-get >/dev/null 2>&1; then
    (apt-get install -y -q tesseract-ocr tesseract-ocr-por >/dev/null 2>&1) || \
      echo "AVISO: Tesseract não instalou — a extração do RG vai pedir conferência visual." >&2
  fi
fi
