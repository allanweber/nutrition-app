# Contract: /foods/[fatSecretId] — Public Food Detail Page

**Type**: Next.js RSC Page Route (SSR)
**File**: `src/app/foods/[fatSecretId]/page.tsx`
**Auth**: Not required — publicly accessible

## Route

```
/foods/:fatSecretId
```

| Param | Type | Description |
|-------|------|-------------|
| `fatSecretId` | `string` | FatSecret `food_id` (e.g., `"9420"`) |

## Data Resolution Order

1. Query local DB: `SELECT * FROM foods LEFT JOIN foodPhotos WHERE sourceId = :fatSecretId`
2. If found → use DB data (faster, no external call)
3. If not found → call FatSecret API `GET https://platform.fatsecret.com/rest/foods/search/v5` defined in searchFoods method in src/lib/fatsecret.ts
4. If FatSecret API fails → render error page

## Rendered Content

| Field | Source |
|-------|--------|
| Food title (`<h1>`) | `foods.name` |
| Brand name | `foods.brandName` (omitted if null) |
| Food images | `foodPhotos.thumb`, `.medium`, `.highres` |
| Calories | Base serving calories |
| Macros (protein, carbs, fat) | Base serving macros |
| Extended nutrients (fiber, sugar, sodium, etc.) | Base serving fields |
| Serving options | `foodAltMeasures` or FatSecret servings |

## SEO Metadata (`generateMetadata`)

```typescript
return {
  title: `${food.name} — Nutrition Facts`,
  description: `Nutritional information for ${food.name}: calories, protein, carbs, fat, and more.`,
  openGraph: {
    title: food.name,
    images: food.images?.medium ? [food.images.medium] : [],
  },
};
```

## Error States

| Condition | Rendered Output |
|-----------|----------------|
| Food not in DB AND FatSecret fails | Error page: "We couldn't load this food. [Search for a food →]" (links to landing page) |
| Invalid `fatSecretId` format | Same error page |

## Rate Limiting

Covered by `src/proxy.ts` — 60 requests/minute per IP for `/foods/**`.

## Caching

Page is server-rendered per request (`export const dynamic = 'force-dynamic'` not needed — default RSC behavior; add `revalidate` if static caching is desired in future). Food data from local DB is not stale; FatSecret responses are not cached at the page level (caching is handled by the existing fire-and-forget DB persistence in the food search service).
