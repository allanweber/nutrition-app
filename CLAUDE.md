# nutrition-app-claude Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-03-16

## Active Technologies

- TypeScript 5.x, Node.js 20 + Next.js 16 (App Router), Drizzle ORM, TanStack Query, (003-fatsecret-food-retrieval)

## Project Structure

```text
src/
tests/
```

## Commands

npm test && npm run lint

## Code Style

TypeScript 5.x, Node.js 20: Follow standard conventions

## Recent Changes

- 003-fatsecret-food-retrieval: Added TypeScript 5.x, Node.js 20 + Next.js 16 (App Router), Drizzle ORM, TanStack Query,

<!-- MANUAL ADDITIONS START -->
## Feature 003: FatSecret Food Retrieval (active branch)

- FatSecret auth: OAuth 2.0 Client Credentials (token POST to `oauth.fatsecret.com/connect/token`, no extra packages)
- FatSecret client: `src/lib/fatsecret.ts` (replaces `src/lib/nutritionix.ts`)
- FatSecret types: `src/types/fatsecret.ts` (replaces `src/types/nutritionix.ts`)
- Orchestration service: `src/server/services/food-search.service.ts`
- New API routes: `GET /api/foods/search` (replaced), `GET /api/foods/detail` (new)
- Retired routes: `/api/foods/nutrients`, `/api/foods/upc` (no FatSecret equivalent)
- DB migration needed: add `medium` column to `food_photos` table
- Feature flag: `FATSECRET_ENABLED` env var (default: enabled)
- See `specs/003-fatsecret-food-retrieval/` for full plan, data-model, and contracts
<!-- MANUAL ADDITIONS END -->
