---
name: web-design-guidelines
description: Reviews interface code against web design guidelines for accessibility, performance, hierarchy, and UX. Use when auditing existing UI code or before shipping any interface change.
trigger: proactive
---

# Web Design Guidelines Skill

Source: github.com/vercel-labs/agent-skills

Audits UI code against production-quality guidelines. Catches 100+ interface issues before users see them.

## How to Use

When invoked, I will:
1. Read the component/page files you specify
2. Check against each category below
3. Report issues with severity: Critical / Warning / Suggestion
4. Provide specific fixes for each finding

## Accessibility (WCAG 2.1 AA)

- [ ] All images have descriptive `alt` text
- [ ] Color contrast ratio ≥ 4.5:1 for normal text, ≥ 3:1 for large text
- [ ] Focus indicators visible on all interactive elements
- [ ] Keyboard navigation works without mouse
- [ ] ARIA roles applied correctly
- [ ] Forms have associated `<label>` elements
- [ ] Error messages linked to inputs via `aria-describedby`
- [ ] Skip-to-content link present on pages with nav

## Visual Hierarchy

- [ ] Clear heading structure (h1 → h2 → h3, not skipped)
- [ ] Primary action is visually dominant
- [ ] Secondary actions are visually subordinate
- [ ] Related elements grouped with proximity
- [ ] Whitespace used to create breathing room
- [ ] Text line length ≤ 75 characters for readability

## Performance

- [ ] Images use next-gen formats (WebP, AVIF)
- [ ] Images have explicit `width` and `height` to prevent layout shift
- [ ] Fonts loaded with `font-display: swap`
- [ ] No layout-triggering CSS animations (use `transform`, `opacity`)
- [ ] Critical CSS inlined or loaded first
- [ ] Non-critical scripts use `defer` or `async`

## Component Quality

- [ ] No inline styles (use utility classes or CSS modules)
- [ ] No magic numbers for spacing (use design tokens)
- [ ] Interactive elements have hover, focus, active states
- [ ] Loading states designed and implemented
- [ ] Empty states designed and implemented
- [ ] Error states designed and implemented

## Responsive Design

- [ ] Mobile-first approach (min-width breakpoints)
- [ ] No fixed pixel widths that break on small screens
- [ ] Touch targets ≥ 44×44px on mobile
- [ ] Adequate text size on mobile (≥ 16px for body)
- [ ] Horizontal scroll absent on mobile

## Typography

- [ ] Max 2 font families
- [ ] Consistent type scale applied
- [ ] Line height: 1.4–1.6 for body text
- [ ] Letter spacing appropriate for font size
- [ ] No uppercase body text (caps lock harms readability)

## Color

- [ ] Brand colors defined as CSS custom properties
- [ ] Semantic colors: success / warning / error / info
- [ ] Dark mode implemented if system preference exists
- [ ] Color not used as the sole means of conveying information

## Audit Report Format

```
## Web Design Audit: <ComponentName>

### Critical (must fix before ship)
- [Line X] Missing alt text on <img> — add descriptive alt attribute

### Warnings (fix soon)
- [Line Y] Contrast ratio 3.2:1 fails WCAG AA for body text

### Suggestions (improve when possible)
- Consider adding loading skeleton to async data fetch
```
