# Quickstart: FatSecret Food Retrieval

**Branch**: `003-fatsecret-food-retrieval` | **Date**: 2026-03-16

## Prerequisites

- Node.js 20+, npm
- PostgreSQL running (local Docker or `npm run db:push` target)
- FatSecret developer account at https://platform.fatsecret.com/api/Default.aspx

---

## 1. Environment Variables

Copy `.env.example` to `.env.local` (if not done) and fill in the FatSecret values:

```bash
# FatSecret API (https://platform.fatsecret.com/api/)
FATSECRET_CONSUMER_KEY="your_consumer_key"
FATSECRET_CONSUMER_SECRET="your_consumer_secret"

# Feature flag — set to "false" to disable FatSecret integration (default: enabled)
FATSECRET_ENABLED="true"

# Mock mode for E2E tests
USE_MOCK_FATSECRET="false"
```

To get FatSecret credentials:
1. Register at https://platform.fatsecret.com/api/
2. Create an application under "My Applications"
3. Copy "Consumer Key" and "Consumer Secret" from the app page

---

## 2. Run Database Migration

> **No new npm packages required.** OAuth 1.0a signing uses Node.js built-in `crypto` only.

Add the `medium` column to `food_photos`:

```bash
npm run db:generate  # generates the migration file
npm run db:push      # applies migration to local DB
```

Verify the migration:

```sql
SELECT column_name FROM information_schema.columns
WHERE table_name = 'food_photos'
ORDER BY ordinal_position;
-- Expected: id, food_id, thumb, medium, highres, created_at
```

---

## 4. Verify FatSecret Connection

Start the dev server and test the search endpoint directly:

```bash
npm run dev

# In another terminal (requires a valid session cookie):
curl "http://localhost:3000/api/foods/search?q=apple&page=1" \
  -H "Cookie: better-auth.session_token=<your_session_token>"
```

Expected response shape:
```json
{
  "results": [
    {
      "id": 1,
      "fatSecretId": "2210",
      "name": "Apple",
      "brandName": null,
      "foodType": "Generic",
      "thumbnail": "https://m.ftscrt.com/...",
      "calories": 52,
      "isLocal": false
    }
  ],
  "pagination": {
    "page": 1,
    "totalResults": 9,
    "maxResults": 20
  }
}
```

---

## 5. Verify Feature Flag

Test with flag disabled:

```bash
# In .env.local, set:
FATSECRET_ENABLED="false"

# Restart dev server, search for a food not in local DB:
curl "http://localhost:3000/api/foods/search?q=apple&page=1" ...
# Expected: { "results": [], "pagination": { "page": 1, "totalResults": 0, "maxResults": 20 } }
```

---

## 6. Run E2E Tests

```bash
# Set USE_MOCK_FATSECRET=true in .env.test.local for mock mode
./scripts/run-e2e.sh e2e/003-food-search.spec.ts
```

---

## 7. Verify Nutritionix Removal

Confirm no Nutritionix references remain in source:

```bash
grep -r "nutritionix\|NUTRITIONIX\|nix_item_id\|nf_calories" src/ --include="*.ts" --include="*.tsx"
# Expected: no output
```
