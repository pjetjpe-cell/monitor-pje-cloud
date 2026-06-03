---
name: superpowers
description: Structured multi-step development workflow with TDD enforcement. Use when starting a new feature, refactoring, or tackling complex tasks. Guides through brainstorm → spec → plan → execute → review → merge.
trigger: explicit
---

# Superpowers — Structured Development Workflow

Source: github.com/obra/superpowers

Enforce professional development discipline: plan before code, test before ship, review before merge.

## Workflow

Work through each phase in order. Do not skip phases.

### Phase 1 — Clarify

Before writing any code:
- Ask the 3 most important clarifying questions
- Identify ambiguities, edge cases, and constraints
- Confirm scope: what is IN and OUT of this task

### Phase 2 — Spec

Write a short specification:
- What problem are we solving?
- What are the acceptance criteria?
- What are the non-goals?
- What are potential failure modes?

Get user confirmation before proceeding.

### Phase 3 — Architecture Plan

Design the solution:
- List files to create/modify
- Describe data flow
- Identify interfaces and contracts
- Estimate complexity: simple / medium / complex

If complex, break into smaller subtasks.

### Phase 4 — Test-First (TDD)

Write tests BEFORE implementation:
- Unit tests for core logic
- Integration tests for interfaces
- Edge case tests

```bash
# Run tests to confirm they fail (red phase)
npm test  # or pytest, cargo test, etc.
```

### Phase 5 — Implement

Write the minimum code to make tests pass:
- Follow the spec exactly
- Small, focused commits
- No scope creep

```bash
# Run tests after each logical unit
npm test
```

### Phase 6 — Review

Before finishing:
- [ ] All tests pass
- [ ] No TODO/FIXME left
- [ ] Types are correct
- [ ] No dead code
- [ ] Lint passes
- [ ] Changes match the spec

### Phase 7 — Summarize

Provide a summary:
- What was implemented
- What tests cover it
- Any follow-up tasks or known limitations
