# Research: FatSecret Food Retrieval

**Branch**: `003-fatsecret-food-retrieval` | **Date**: 2026-03-16

## 1. FatSecret REST API v5

### Decision
Use FatSecret REST API v5 search endpoint (`https://platform.fatsecret.com/rest/foods/search/v5`)
with OAuth 2.0 Client Credentials server-side authentication.

### Rationale
FatSecret uses OAuth 2.0 (Client Credentials grant) for server-side REST API access.
A short-lived Bearer token is obtained from `https://oauth.fatsecret.com/connect/token`
and included in each API request. No user tokens needed for public food search.
Tokens are valid for 24 hours (`expires_in: 86400`) and cached in-process.

The v5 search endpoint returns `food_attributes.macros` (per-serving nutrition) and
`food_images` directly in the search result when `include_food_images=true`. This
eliminates the need for a separate food detail API call.

### Key API Endpoint

| Endpoint | Purpose | Params |
|---|---|---|
| `GET /rest/foods/search/v5` | Keyword search with nutrition + images | `search_expression`, `include_food_images=true`, `page_number` (0-based), `max_results` (≤50), `format=json` |

### Search Response Shape (v5)

```json
{
  "foods_search": {
    "max_results": "10",
    "total_results": "2003",
    "page_number": "0",
    "results": {
      "food": [
        {
          "food_id": "35718",
          "food_name": "Apples",
          "food_type": "Generic",
          "food_url": "https://foods.fatsecret.com/calories-nutrition/usda/apples",
          "food_images": {
            "food_image": [
              { "image_url": "https://www.foodimagedb.com/food-images/abc_1024x1024.png", "image_type": "0" },
              { "image_url": "https://www.foodimagedb.com/food-images/abc_400x400.png", "image_type": "0" },
              { "image_url": "https://www.foodimagedb.com/food-images/abc_72x72.png", "image_type": "0" }
            ]
          },
          "servings": {
            "serving": [
              {
                "serving_id": "58449",
                "serving_description": "100 g",
                "metric_serving_amount": "100.000",
                "metric_serving_unit": "g",
                "calories": "52",
                "carbohydrate": "13.81",
                "protein": "0.26",
                "fat": "0.17",
                "saturated_fat": "0.028",
                "sodium": "1",
                "potassium": "107",
                "fiber": "2.4",
                "sugar": "10.39",
                "vitamin_a": "3",
                "vitamin_c": "4.6",
                "calcium": "6",
                "iron": "0.12"
              }
            ]
          }
        }
      ]
    }
  }
}
```

Key structural notes:
- Root key is `foods_search` (not `foods`)
- Pagination fields (`max_results`, `total_results`, `page_number`) are at the `foods_search` level
- Foods are under `foods_search.results.food`
- Each food includes full `servings.serving[]` with complete nutrition — **no separate detail API call needed**
- When there is only one result, `food` or `serving` is a plain object, not an array — always normalize
- `food_images` is optional; `food_image` may be a single object or array — always normalize

### Image URLs

FatSecret returns image URLs where the filename encodes the resolution using `_WxH` suffixes.
Three sizes are returned per food (when images are available):

- **Thumbnail** (72×72): URL contains `_72x72`
- **Medium** (400×400): URL contains `_400x400`
- **High-res** (1024×1024): URL contains `_1024x1024`

Map all three from `food_images.food_image[]` by checking `image_url` for these substrings.
Fall back gracefully when fewer than three are returned.

---

## 2. OAuth 2.0 Token Acquisition

### Decision
Fetch a Bearer token via a single POST to `https://oauth.fatsecret.com/connect/token`,
passing `client_id` and `client_secret` in the request body. Cache the token
in-process until 60 seconds before expiry.

### Rationale
FatSecret's token endpoint accepts credentials directly in the form body — no
Basic auth header or signature generation is needed. The response includes
`expires_in` (seconds), enabling simple in-process caching.

### Implementation Sketch

```typescript
const response = await fetch('https://oauth.fatsecret.com/connect/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'client_credentials',
    scope: 'basic',
    client_id: process.env.FATSECRET_CONSUMER_KEY!,
    client_secret: process.env.FATSECRET_CONSUMER_SECRET!,
  }),
  cache: 'no-store',
});
// Response: { access_token: string, token_type: "Bearer", expires_in: 86400 }
```

API calls then use `Authorization: Bearer <token>` with no additional signing.

### Alternatives Considered
- Basic auth header (`Authorization: Basic base64(id:secret)`): not required by
  FatSecret — body credentials are sufficient and simpler.

---

## 3. 100g Base Serving Identification

### Decision
Identify the 100g base serving by checking (in order):
1. `metric_serving_amount === "100.000"` AND `metric_serving_unit === "g"`
2. `serving_description === "100 g"` (exact match, case-insensitive)

When no 100g serving is found, use the **first** serving in the array as the base.

### Rationale
Directly derived from spec FR-003 and the clarification session. Using the first
serving as fallback prevents rejecting valid foods that lack a 100g entry.

---

## 5. Local Food Search Strategy

### Decision
`SELECT * FROM foods WHERE source = 'fatsecret' AND name ILIKE '%{keyword}%'`
using Drizzle ORM `ilike` operator. Returns up to 20 local matches.

### Rationale
- Existing `foods_name_idx` index will be used by Postgres for ILIKE prefix
  scans (with trigram extension for full-text, but basic ILIKE is sufficient at
  this scale).
- Local results appear first in the unified result list (FR-002, FR-008).

---

## 6. Async Background Save Pattern

### Decision
Fire-and-forget: the search service calls
`saveFatSecretFoodsAsync(foods).catch(err => console.error(err))` and
immediately returns results to the user. No retry logic; the next search
re-triggers the save.

### Rationale
Derived from clarification session Q4. Simple, zero additional infrastructure,
matches the app's current scale and constitution's External API rule.

---

## 7. Nutritionix Removal Scope

### Files to Delete
| File | Reason |
|---|---|
| `src/lib/nutritionix.ts` | Replaced by `src/lib/fatsecret.ts` |
| `src/types/nutritionix.ts` | Replaced by `src/types/fatsecret.ts` |
| `src/lib/__tests__/mock-nutritionix.ts` (if exists) | Replaced by mock-fatsecret |

### API Routes to Retire
| Route | Reason |
|---|---|
| `src/app/api/foods/nutrients/route.ts` | Nutritionix natural-language parsing; no FatSecret equivalent; no active callers |
| `src/app/api/foods/upc/route.ts` | Nutritionix UPC lookup; no FatSecret equivalent; no active callers |

Verified: neither route is called from any client code in `src/`.

### Files to Update
| File | Change |
|---|---|
| `src/types/food.ts` | Remove 'nutritionix' from FoodSource; add 'fatsecret'; add `medium` to FoodPhoto |
| `src/queries/foods.ts` | New response shape + pagination type |
| `src/components/food-search.tsx` | New unified result list + pagination |
| `.env.example` | Replace Nutritionix vars with FatSecret vars |

---

## 8. Feature Flag Implementation

### Decision
Read `process.env.FATSECRET_ENABLED` server-side. Treat any value other than the
string `'false'` as enabled (default ON when var is absent).

```typescript
function isFatSecretEnabled(): boolean {
  return process.env.FATSECRET_ENABLED !== 'false';
}
```

### Rationale
Simple env-var check, no DB config needed, zero additional infrastructure.
When disabled, all FatSecret API calls are skipped; local-only results returned.
