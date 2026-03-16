# Research: FatSecret Food Retrieval

**Branch**: `003-fatsecret-food-retrieval` | **Date**: 2026-03-16

## 1. FatSecret REST API v4

### Decision
Use FatSecret REST API v4 (`https://platform.fatsecret.com/rest/server.api`) with
OAuth 1.0a server-side authentication.

### Rationale
FatSecret does not support OAuth 2.0 for the server-side REST API. OAuth 1.0a
consumer key + secret is the required authentication flow. No user tokens needed
for public food search.

### Key API Methods

| Method | Purpose | Params |
|---|---|---|
| `foods.search` | Keyword search, paginated | `search_expression`, `page_number` (0-based), `max_results` (≤50), `format=json` |
| `food.get.v4` | Full food detail, servings, images | `food_id`, `format=json` |

### Search Response Shape

```json
{
  "foods": {
    "food": [
      {
        "food_id": "2210",
        "food_name": "Apple",
        "food_type": "Generic",
        "food_url": "https://www.fatsecret.com/..."
      }
    ],
    "max_results": "20",
    "page_number": "0",
    "total_results": "9"
  }
}
```

Note: when there is only one result, `food` is a single object, not an array.
Always `Array.isArray()` or force to array.

### Food Detail Response Shape (food.get.v4)

```json
{
  "food": {
    "food_id": "2210",
    "food_name": "Apple",
    "food_type": "Generic",
    "food_url": "...",
    "servings": {
      "serving": [
        {
          "serving_id": "...",
          "serving_description": "1 medium (2-3/4\" dia) (approx 3 per lb)",
          "serving_url": "...",
          "metric_serving_amount": "138.000",
          "metric_serving_unit": "g",
          "number_of_units": "1.000",
          "measurement_description": "medium (2-3/4\" dia) (approx 3 per lb)",
          "calories": "72",
          "carbohydrate": "19.06",
          "protein": "0.36",
          "fat": "0.23",
          "saturated_fat": "0.039",
          "polyunsaturated_fat": "0.070",
          "monounsaturated_fat": "0.010",
          "cholesterol": "0",
          "sodium": "1",
          "potassium": "148",
          "fiber": "3.3",
          "sugar": "14.34",
          "vitamin_a": "1",
          "vitamin_c": "10",
          "calcium": "1",
          "iron": "1"
        }
      ]
    },
    "images": {
      "image": [
        {
          "image_id": "...",
          "image_url": "https://m.ftscrt.com/static/recipe/..._200.jpg",
          "image_type": "...",
          "caption": "Apple"
        }
      ]
    }
  }
}
```

Note: `servings.serving` may be an object when only one serving exists; always
normalize to array. Same for `images.image`.

### Image URLs

FatSecret returns image URLs where the filename encodes the resolution. The three
required sizes come from separate `image` entries in the response:

- **Thumbnail** (72×72): URL contains `_tb` or `_72` suffix
- **Medium** (400×400): URL contains `_200` or `_400` suffix
- **High-res** (1024×1024): URL without size suffix or `_1024`

Map all three from the `images.image[]` array by inspecting `image_url` patterns.
Fall back gracefully when fewer than three are returned.

---

## 2. OAuth 1.0a Signature Generation

### Decision
Implement OAuth 1.0a signing inline using Node.js built-in `crypto` module.
No external package required.

### Rationale
OAuth 1.0a for FatSecret requires exactly:
1. Percent-encode parameters (RFC 3986)
2. Sort all parameters alphabetically
3. Build base string: `METHOD&encoded_url&encoded_sorted_params`
4. Sign with `HMAC-SHA1` using `consumerSecret&` as key (no token secret needed for app-level calls)
5. Base64-encode the signature

All of this is straightforward with Node.js `crypto.createHmac`. No external
dependency needed. The signing helper is ~40 lines of TypeScript.

### Implementation Sketch

```typescript
import crypto from 'node:crypto';

function percentEncode(str: string): string {
  return encodeURIComponent(str)
    .replace(/!/g, '%21').replace(/'/g, '%27')
    .replace(/\(/g, '%28').replace(/\)/g, '%29').replace(/\*/g, '%2A');
}

function buildOAuthHeader(method: string, url: string, params: Record<string, string>): string {
  const consumerKey = process.env.FATSECRET_CONSUMER_KEY!;
  const consumerSecret = process.env.FATSECRET_CONSUMER_SECRET!;
  const nonce = crypto.randomBytes(16).toString('hex');
  const timestamp = String(Math.floor(Date.now() / 1000));

  const oauthParams: Record<string, string> = {
    oauth_consumer_key: consumerKey,
    oauth_nonce: nonce,
    oauth_signature_method: 'HMAC-SHA1',
    oauth_timestamp: timestamp,
    oauth_version: '1.0',
  };

  const allParams = { ...params, ...oauthParams };
  const sortedPairs = Object.entries(allParams)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${percentEncode(k)}=${percentEncode(v)}`)
    .join('&');

  const baseString = [method, percentEncode(url), percentEncode(sortedPairs)].join('&');
  const signingKey = `${percentEncode(consumerSecret)}&`;
  const signature = crypto.createHmac('sha1', signingKey).update(baseString).digest('base64');

  const headerParams = { ...oauthParams, oauth_signature: signature };
  const headerValue = 'OAuth ' + Object.entries(headerParams)
    .map(([k, v]) => `${k}="${percentEncode(v)}"`)
    .join(', ');

  return headerValue;
}
```

### Alternatives Considered
- `oauth-1.0a` npm package: unnecessary dependency for ~40 lines of code already
  covered by Node.js built-ins; removed from plan per user feedback.

---

## 3. Search Result Caching

### Decision
Use Next.js `unstable_cache` to cache FatSecret search API responses, keyed by
`['fatsecret', 'search', keyword, String(page)]`, with a 600-second (10 min) TTL.

### Rationale
- `unstable_cache` is idiomatic in Next.js App Router and requires no external
  infrastructure.
- Works for both long-running dev server and Vercel Data Cache in production.
- Fulfils FR-009 (search result page caching) without adding Redis/BullMQ.

### Cache Key Strategy
```
fatsecret:search:{normalizedKeyword}:{pageNumber}
```
Keywords are lowercased and trimmed before use as cache keys.

### Alternatives Considered
- Redis + BullMQ: too much infrastructure for this scale
- `React.cache()`: per-request only; does not persist across requests
- Simple in-memory Map with TTL: breaks in serverless/multiple workers

---

## 4. 100g Base Serving Identification

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
