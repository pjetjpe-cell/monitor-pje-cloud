---
name: composition-patterns
description: Replaces boolean prop patterns with compound components and clean APIs. Use when refactoring components that have grown complex with many boolean props, or when designing a new component API.
trigger: explicit
---

# Composition Patterns Skill

Source: github.com/vercel-labs/agent-skills

Replace prop-drilling and boolean flags with composable, readable component APIs.

## The Problem This Solves

```typescript
// ❌ Boolean prop explosion — hard to read, hard to extend
<Card
  hasHeader
  hasFooter
  hasBorder
  isCompact
  isLoading
  showAvatar
  showActions
  headerTitle="User"
  footerText="See more"
/>
```

## Compound Components Pattern

```typescript
// ✅ Composable API — reads like HTML, extensible without API changes

// Usage
<Card>
  <Card.Header>
    <Card.Avatar src={user.avatar} />
    <Card.Title>User Profile</Card.Title>
  </Card.Header>
  <Card.Body>{content}</Card.Body>
  <Card.Footer>
    <Card.Actions>
      <Button>Edit</Button>
    </Card.Actions>
  </Card.Footer>
</Card>

// Implementation
const CardContext = createContext<CardContextValue | null>(null);

function Card({ children, className }: CardProps) {
  return (
    <CardContext.Provider value={{}}>
      <div className={cn('rounded-lg border', className)}>{children}</div>
    </CardContext.Provider>
  );
}

Card.Header = function CardHeader({ children }: { children: ReactNode }) {
  return <div className="border-b p-4">{children}</div>;
};

Card.Body = function CardBody({ children }: { children: ReactNode }) {
  return <div className="p-4">{children}</div>;
};

Card.Footer = function CardFooter({ children }: { children: ReactNode }) {
  return <div className="border-t p-4">{children}</div>;
};
```

## Render Props Pattern

For components that need to share state with children:

```typescript
// ✅ Render prop — consumer controls rendering
<DataTable
  data={rows}
  renderRow={(row) => (
    <tr key={row.id}>
      <td>{row.name}</td>
      <td><StatusBadge status={row.status} /></td>
    </tr>
  )}
  renderEmpty={() => <EmptyState message="No data" />}
/>
```

## Slots Pattern (Modern)

```typescript
// ✅ Explicit slots via props — cleaner than children inspection
<Layout
  header={<Header title="Dashboard" />}
  sidebar={<Sidebar items={navItems} />}
  footer={<Footer />}
>
  <MainContent />
</Layout>
```

## HOC → Hooks Migration

Replace Higher-Order Components with custom hooks:

```typescript
// ❌ Old HOC pattern
const ProtectedComponent = withAuth(MyComponent);

// ✅ Hook pattern
function MyComponent() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Skeleton />;
  if (!user) return <Redirect to="/login" />;
  return <ActualContent user={user} />;
}
```

## When to Apply Each Pattern

| Pattern | Use when |
|---------|----------|
| Compound Components | Component has multiple related sub-parts |
| Render Props | Consumer needs control over rendering |
| Slots | Layout components with named regions |
| Custom Hooks | Logic needs to be shared without UI |
| Context | State needs to reach deep descendants |

## Refactoring Checklist

When you see these, apply composition patterns:
- [ ] Component with 5+ boolean props
- [ ] Props named `isX`, `hasX`, `showX`, `withX`
- [ ] Prop values that control what children are rendered
- [ ] Same component used in 3+ ways that feel different
- [ ] Component file > 200 lines
