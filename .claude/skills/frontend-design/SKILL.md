---
name: frontend-design
description: Production-grade UI design with distinctive aesthetics. Use when building UI components, pages, or design systems. Prevents generic AI-default interfaces by enforcing intentional design decisions upfront.
trigger: proactive
---

# Frontend Design Skill

Source: github.com/anthropics/skills (277,000+ installs)

Before writing a single line of UI code, commit to a design direction. Generic is not an option.

## Design Principles

### 1. Choose a Visual Direction First

Pick ONE before starting:
- **Brutalist** — raw, bold, high contrast, exposed structure
- **Minimal** — whitespace-heavy, monochrome, typographic
- **Editorial** — magazine-style, strong grid, oversized typography
- **Technical** — data-dense, monospace, terminal aesthetic
- **Warm** — organic shapes, muted palette, human-centered

### 2. Typography

Select a type system — never use defaults:
- Establish hierarchy: display / heading / body / caption
- Max 2 font families
- Define size scale: 12 / 14 / 16 / 20 / 24 / 32 / 48 / 64
- Line height: 1.4 for body, 1.1 for display

### 3. Color System

Define before coding:
- 1 primary brand color
- 1 semantic palette (success, warning, error, info)
- Background: light / dark / system preference via `prefers-color-scheme`
- Minimum contrast ratio: 4.5:1 (WCAG AA)

### 4. Spacing & Layout

- Base unit: 4px or 8px
- Consistent padding scale: 4 / 8 / 12 / 16 / 24 / 32 / 48
- Grid: 12-column, 16px gutters on desktop
- Responsive breakpoints: 640 / 768 / 1024 / 1280 / 1536

### 5. Animation & Motion

Only add motion with purpose:
- Enter/exit: 150–200ms ease-out
- State changes: 100ms
- No gratuitous animations
- Respect `prefers-reduced-motion`

## Implementation Checklist

Before shipping any component:

- [ ] Follows the chosen visual direction
- [ ] Typography scale applied consistently
- [ ] Color tokens used (no raw hex in components)
- [ ] Mobile-first responsive
- [ ] Keyboard navigable
- [ ] Screen reader accessible (ARIA)
- [ ] Dark mode handled (if applicable)
- [ ] Loading and error states designed

## Tech Stack (default)

- React + TypeScript
- Tailwind CSS for utilities
- shadcn/ui for primitives
- CSS custom properties for tokens

## Anti-patterns to Avoid

- Generic blue buttons with border-radius 4px
- Default gray color palettes
- System fonts without intent
- Centered everything
- Padding-less containers
