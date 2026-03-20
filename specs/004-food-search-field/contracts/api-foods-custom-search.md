# Contract: GET /api/foods/custom/search

**Type**: REST API Endpoint
**File**: `src/app/api/foods/custom/search/route.ts`
**Auth**: Required (authenticated session)

## Request

```
GET /api/foods/custom/search?q={query}
```

| Parameter | Type | Required | Constraints |
|-----------|------|----------|-------------|
| `q` | `string` | Yes | 3–200 characters |

## Responses

### 200 OK

```json
{
  "results": [
    {
      "id": 42,
      "name": "My Lunch Bowl",
      "brandName": null,
      "thumbnail": "https://...",
      "calories": 450
    }
  ]
}
```

Results are filtered to the authenticated user's custom foods only (`isCustom = true AND userId = currentUser.id`), ordered by name, limited to 20 items.

### 400 Bad Request

```json
{ "success": false, "error": "Query must be at least 3 characters" }
```

### 401 Unauthorized

```json
{ "success": false, "error": "Unauthorized" }
```

### 500 Internal Server Error

```json
{ "success": false, "error": "Search failed" }
```

## Validation (server-side, Zod)

```typescript
const schema = z.object({
  q: z.string().min(3).max(200).transform(s => s.trim()),
});
```

## Notes

- This endpoint does **not** call FatSecret; it queries local DB only
- Custom foods have no `fatSecretId`; the `onSelect` handler in the food log context must use `id` for the detail query
- Rate limiting: not applied (authenticated endpoint; per-user abuse is bounded by session)
