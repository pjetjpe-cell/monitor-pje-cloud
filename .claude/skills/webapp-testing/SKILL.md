---
name: webapp-testing
description: End-to-end web application testing with Playwright. Use when testing UI flows, writing E2E tests, or validating features in a real browser. Handles setup, navigation, assertions, and screenshot capture.
trigger: explicit
---

# Webapp Testing Skill

Source: github.com/anthropics/skills (Playwright-based E2E testing)

Automate real browser testing for web applications. Spins up Playwright, navigates flows, captures screenshots, and reports failures with structured output.

## Setup

```bash
# Install Playwright if not present
npm install -D @playwright/test
npx playwright install chromium
```

## Test Structure

Always write tests using this structure:

```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature: <feature name>', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000');
  });

  test('should <expected behavior>', async ({ page }) => {
    // Arrange
    await page.goto('/target-page');
    
    // Act
    await page.getByRole('button', { name: 'Submit' }).click();
    
    // Assert
    await expect(page.getByText('Success')).toBeVisible();
  });
});
```

## Locator Priority

Use in this order (most to least preferred):
1. `getByRole()` — semantic, accessibility-friendly
2. `getByLabel()` — for form fields
3. `getByText()` — for visible text
4. `getByTestId()` — for dedicated test attributes
5. CSS/XPath — last resort only

## Common Patterns

### Navigation
```typescript
await page.goto('/path');
await page.waitForURL('/expected-path');
```

### Form Interaction
```typescript
await page.getByLabel('Email').fill('user@example.com');
await page.getByLabel('Password').fill('secret');
await page.getByRole('button', { name: 'Login' }).click();
```

### Screenshots on Failure
```typescript
test.afterEach(async ({ page }, testInfo) => {
  if (testInfo.status !== 'passed') {
    await page.screenshot({ path: `screenshots/${testInfo.title}.png` });
  }
});
```

### Wait for Network
```typescript
await page.waitForLoadState('networkidle');
await page.waitForResponse(resp => resp.url().includes('/api/'));
```

## Running Tests

```bash
# Run all E2E tests
npx playwright test

# Run specific file
npx playwright test tests/login.spec.ts

# Run with UI (debug mode)
npx playwright test --ui

# Generate HTML report
npx playwright test --reporter=html
```

## Playwright Config (playwright.config.ts)

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30_000,
  retries: process.env.CI ? 2 : 0,
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    { name: 'chromium', use: { browserName: 'chromium' } },
  ],
});
```

## Testing Checklist

- [ ] Happy path tested
- [ ] Error states tested
- [ ] Form validation tested
- [ ] Navigation flow tested
- [ ] Loading states tested
- [ ] Screenshots on failure configured
