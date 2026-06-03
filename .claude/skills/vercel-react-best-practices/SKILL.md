---
name: vercel-react-best-practices
description: Applies React and Next.js performance and architecture best practices. Use when writing React components, hooks, or Next.js pages. Enforces 57 performance rules prioritized by impact.
trigger: proactive
---

# Vercel React Best Practices Skill

Source: github.com/vercel-labs/agent-skills

Enforce production-quality React patterns. No half-measures, no anti-patterns.

## Component Architecture

### Naming & Structure
- PascalCase for components, camelCase for hooks
- One component per file (exceptions: tiny helper components)
- Colocate styles, tests, and stories with the component
- Named exports over default exports for better refactoring

### Component Types
```typescript
// Server Component (default in Next.js App Router)
export function UserProfile({ userId }: { userId: string }) {
  const user = await fetchUser(userId); // Direct async fetch
  return <div>{user.name}</div>;
}

// Client Component (only when needed)
'use client';
export function Counter() {
  const [count, setCount] = useState(0);
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

## State Management

### Rules
- Prefer Server Components + server actions over client state
- `useState` for local UI state only
- `useReducer` when state has multiple sub-values
- Lift state only as high as necessary
- Never store derived data in state — compute it

### Avoid These Anti-patterns
```typescript
// ❌ Derived state in useState
const [filteredItems, setFilteredItems] = useState(items.filter(...));

// ✅ Computed directly
const filteredItems = useMemo(() => items.filter(...), [items]);
```

## Data Fetching (Next.js App Router)

```typescript
// ✅ Server Component — fetch in component
async function PostList() {
  const posts = await fetch('/api/posts', { next: { revalidate: 60 } });
  return posts.map(p => <PostCard key={p.id} post={p} />);
}

// ✅ Parallel fetching
const [user, posts] = await Promise.all([fetchUser(id), fetchPosts(id)]);

// ❌ Waterfall fetching
const user = await fetchUser(id);
const posts = await fetchPosts(user.id); // Only do this if posts depends on user
```

## Performance Rules (Top 10)

1. **Avoid unnecessary re-renders** — use `React.memo` for pure components
2. **Stable references** — wrap callbacks in `useCallback`, objects in `useMemo`
3. **Virtualize long lists** — use `react-window` for 100+ items
4. **Code split** — `dynamic()` import for heavy components
5. **Optimize images** — always use `next/image`
6. **Prefetch routes** — `next/link` prefetches by default
7. **Suspense boundaries** — wrap async data with `<Suspense>`
8. **Error boundaries** — wrap risky sections with `<ErrorBoundary>`
9. **Avoid layout in render** — never read `offsetWidth` during render
10. **Bundle analysis** — run `next build --analyze` before shipping

## Hooks Guidelines

```typescript
// ✅ Custom hook — extract logic, not JSX
function useMonitorStatus(url: string) {
  const [status, setStatus] = useState<'up' | 'down' | 'checking'>('checking');
  
  useEffect(() => {
    const check = async () => {
      const ok = await ping(url);
      setStatus(ok ? 'up' : 'down');
    };
    
    check();
    const interval = setInterval(check, 30_000);
    return () => clearInterval(interval);
  }, [url]);
  
  return status;
}
```

## TypeScript Rules

- Strict mode enabled (`"strict": true` in tsconfig)
- No `any` — use `unknown` + type guards
- Props interfaces over inline types for reusability
- Return types explicit on utility functions
- Discriminated unions for complex state

## File Structure (Next.js App Router)

```
app/
  (auth)/
    login/page.tsx
    register/page.tsx
  dashboard/
    page.tsx
    layout.tsx
    loading.tsx
    error.tsx
components/
  ui/           # Primitive components (shadcn)
  features/     # Feature-specific components
  layouts/      # Layout components
lib/
  actions/      # Server actions
  api/          # API utilities
  hooks/        # Shared custom hooks
```
