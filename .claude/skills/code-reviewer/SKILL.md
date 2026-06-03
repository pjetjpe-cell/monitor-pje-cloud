---
name: code-reviewer
description: Structured code review with prioritized findings across correctness, performance, security, and maintainability. Use before merging any PR or after completing a feature. Runs quality gates and reports issues by severity.
trigger: explicit
---

# Code Reviewer Skill

Source: Anthropic official + community patterns

Systematic code review that catches real bugs — not just style issues. Reviews diff or specified files and produces prioritized findings.

## How to Invoke

```
/code-reviewer                    # Review current git diff
/code-reviewer src/components/    # Review specific path
/code-reviewer --fix              # Review + apply safe fixes
/code-reviewer --comment          # Review + post as PR comments
```

## Review Categories

### 1. Correctness (Critical — fix before merge)

- Logic errors: off-by-one, wrong comparison operators
- Unhandled edge cases: null/undefined, empty arrays, empty strings
- Race conditions: concurrent state mutations
- Wrong async handling: missing await, unhandled promise rejections
- Type errors that TypeScript missed (any casts, type assertions)
- Incorrect error propagation

### 2. Security (Critical — fix before merge)

- Input validation missing at system boundaries
- SQL injection potential (raw string interpolation in queries)
- XSS: unescaped user content rendered as HTML
- CSRF: state-changing operations without CSRF protection
- Sensitive data in logs, errors, or URLs
- Overly permissive CORS
- Hardcoded secrets or credentials

### 3. Performance (High — fix when significant)

- N+1 query patterns (fetching in loops)
- Missing database indexes for frequent queries
- Unbounded data fetching (no pagination, no limit)
- Memory leaks: event listeners not cleaned up, timers not cleared
- Unnecessary re-renders in React components
- Large bundle imports (importing full library for one function)

### 4. Maintainability (Medium — fix when easy)

- Functions over 40 lines (split them)
- Functions with more than 4 parameters (use object param)
- Deeply nested conditionals (extract to functions)
- Magic numbers without named constants
- Duplicated logic that should be extracted
- Misleading variable or function names

### 5. Tests (Medium — ensure coverage)

- Happy path not tested
- Error cases not tested
- Edge cases identified but not tested
- Mocks not cleaned up between tests
- Tests that test implementation details instead of behavior

## Report Format

```markdown
## Code Review: <filename or diff description>

### 🔴 Critical (must fix)
**[Correctness] src/api/auth.ts:42** — `userId` can be undefined if JWT decode fails but it's used without null check.
```typescript
// Current
const userId = jwt.decode(token).sub;

// Fix
const decoded = jwt.decode(token);
if (!decoded || typeof decoded === 'string') throw new Error('Invalid token');
const userId = decoded.sub;
```

### 🟡 High (fix soon)
**[Performance] src/services/processos.ts:87** — Fetching processo details inside a loop creates N+1 queries.
```typescript
// Fix: batch fetch
const processoIds = list.map(p => p.id);
const detalhes = await db.processo.findMany({ where: { id: { in: processoIds } } });
```

### 🟢 Suggestion (consider)
**[Maintainability] src/utils/format.ts:15** — `formatDate` and `formatDateShort` share 80% logic, consider parameterizing.
```

## Quality Gates

Before finishing, verify:
- [ ] No `console.log` left in production code
- [ ] No commented-out code blocks
- [ ] No TODO without a linked issue
- [ ] No `@ts-ignore` or `// eslint-disable` without explanation
- [ ] Environment variables accessed only via config module (not `process.env` directly)
- [ ] Error messages don't expose internal details to users
