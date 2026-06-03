#!/bin/bash
set -euo pipefail

# Run only in remote Claude Code environments
if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

echo '{"async": true, "asyncTimeout": 300000}'

# Install Node dependencies
if [ -f "$CLAUDE_PROJECT_DIR/package.json" ]; then
  cd "$CLAUDE_PROJECT_DIR"
  npm install
fi

# Install Playwright browsers if needed
if [ -f "$CLAUDE_PROJECT_DIR/playwright.config.ts" ] || [ -f "$CLAUDE_PROJECT_DIR/playwright.config.js" ]; then
  npx playwright install chromium --with-deps
fi
