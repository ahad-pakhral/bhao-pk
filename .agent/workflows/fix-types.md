# Fix Common Type Issues

Reference for resolving TypeScript type errors across the project.

## Shared Types Live in Two Places

Mobile and webapp have SEPARATE type files that must stay in sync:
- `mobile/src/types/models.ts`
- `webapp/types/models.ts`

API types:
- `mobile/src/types/api.ts`
- `webapp/types/api.ts`

When adding/changing a type, update BOTH files.

## Common Type Errors and Fixes

### 1. `rankByRelevance` type mismatch

The generic constraint requires:
```typescript
T extends {
  rating?: number;
  reviewsCount?: number;
  price?: string;       // Must be STRING (e.g., "Rs. 345,000")
  store?: string;
  originalPrice?: string; // Must be STRING
}
```

**Fix**: If your type uses `originalPrice?: number`, change it to `string` and format as `Rs. X,XXX`.

If you can't change the type, use explicit generic:
```typescript
filtered = rankByRelevance<MyType>(filtered);
```

### 2. `Property X does not exist on type ProductCardData`

The `ProductCardData` type in mobile might not have all fields. Check:
```
mobile/src/types/models.ts → ProductCardData interface
```

Add the missing property with `?` (optional) to avoid breaking existing code.

### 3. `Type 'string | undefined' is not assignable to type 'string'`

Use nullish coalescing:
```typescript
const value = maybeMissing ?? 'default';
```

Or non-null assertion (only if you're sure):
```typescript
const value = maybeMissing!;
```

### 4. Next.js `useSearchParams` requires Suspense

Any component using `useSearchParams()` must be wrapped:
```tsx
export default function Page() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ActualContent />
    </Suspense>
  );
}
```

### 5. Backend route handler return type

Express route handlers need explicit `return` before `res.json()` in conditional branches:
```typescript
// BAD — TypeScript thinks execution continues
if (!keyword) {
  res.status(400).json({ error: 'Missing' });
}

// GOOD
if (!keyword) {
  return res.status(400).json({ error: 'Missing' });
}
```

### 6. `pg` Pool query result type

```typescript
const result = await query('SELECT * FROM users WHERE id = $1', [id]);
const user = result.rows[0]; // type: any
```

For type safety, define row interfaces:
```typescript
interface UserRow {
  id: string;
  name: string;
  email: string;
}
const result = await query('SELECT * FROM users WHERE id = $1', [id]);
const user: UserRow = result.rows[0];
```

## Quick Type Check Commands

```bash
# Backend
cd /Users/ahad/Documents/Clawd/Bhao.pk/backend && npx tsc --noEmit

# Webapp (full build including type check)
cd /Users/ahad/Documents/Clawd/Bhao.pk/webapp && npx next build
```
