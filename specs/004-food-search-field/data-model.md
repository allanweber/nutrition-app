# Data Model: Unified Food Search Field Component

**Feature**: `004-food-search-field` | **Date**: 2026-03-19

---

## Existing Entities (No Changes)

These entities already exist in the DB schema and are **not modified** by this feature.

### `foods` (existing table)
Relevant fields for this feature:
- `id: string` — internal primary key (UUID7)
- `sourceId: string | null` — FatSecret food ID (used as URL parameter for public page)
- `source: string` — `'fatsecret'` for catalog foods, `'user_custom'` for custom
- `name: string`
- `brandName: string | null`
- `foodType: string | null` — `'Generic'` or `'Brand'` for FatSecret foods
- `userId: string | null` — owner of custom foods; `null` for shared catalog foods (accessible to all users)
- `calories: string | null`
- `thumbnail` — via `foodPhotos` join

### `foodPhotos` (existing table)
- `foodId: string` — FK to `foods.id` (UUID7)
- `thumb: string | null` — 72×72 image URL
- `medium: string | null` — 400×400 image URL
- `highres: string | null` — 1024×1024 image URL

---

## New Client-Side Entity

### `SearchHistoryEntry` (localStorage only — no DB)

Stored as JSON array under key `fsf-search-history` in the browser's `localStorage`.

| Field | Type | Description |
|-------|------|-------------|
| `term` | `string` | Original search term as typed by the user |
| `normalizedTerm` | `string` | Lowercased term used for deduplication comparison |
| `lastAccessedAt` | `number` | Unix timestamp (ms) of the last time this entry was accessed |

**Constraints**:
- Maximum 30 entries at any time; oldest entry removed when limit is exceeded
- Entries with `lastAccessedAt < Date.now() - 30d` are filtered out on read
- Deduplication: if `normalizedTerm` already exists, update `lastAccessedAt` and move to front instead of inserting a new entry
- Array is ordered most-recent-first (index 0 = most recent)

---

## New Shared Types (Frontend Only)

### `UnifiedFoodSearchResultItem`

Merges FatSecret results (Generic/Brand) and user custom foods into a single type consumed by `FoodSearchField`.

| Field | Type | Source |
|-------|------|--------|
| `id` | `string \| null` | Internal DB UUID7; `null` if not yet cached locally |
| `fatSecretId` | `string \| null` | FatSecret food_id; `null` for custom foods |
| `name` | `string` | Food name |
| `brandName` | `string \| null` | Brand name if applicable |
| `foodType` | `'Generic' \| 'Brand' \| 'Custom'` | Maps to tab: Generic→Common, Brand→Branded, Custom→Custom |
| `thumbnail` | `string \| null` | 72×72 image URL |
| `calories` | `number \| null` | Calories per 100g base serving |

### `FoodSearchState`

Returned by the `useFoodSearch()` hook; passed as props to `FoodSearchField`.

| Field | Type | Description |
|-------|------|-------------|
| `query` | `string` | Current raw query string |
| `results` | `UnifiedFoodSearchResultItem[]` | All loaded results (all types combined) |
| `isLoading` | `boolean` | True while any search request is in-flight |
| `error` | `string \| null` | User-friendly error message if search failed |
| `hasMore` | `boolean` | True when more results can be loaded |
| `page` | `number` | Current pagination page |

### `FoodSearchFieldProps`

Props interface for the `FoodSearchField` component.

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `state` | `FoodSearchState` | Yes | All search state from `useFoodSearch()` |
| `onQueryChange` | `(query: string) => void` | Yes | Called when user types |
| `onLoadMore` | `() => void` | Yes | Called when "Load more" is clicked |
| `onSelect` | `(item: UnifiedFoodSearchResultItem) => void` | Yes | Called when a result is selected |
| `showCustomTab` | `boolean` | No (default: `true`) | Pass `false` for anonymous users |
| `placeholder` | `string` | No | Input placeholder text |
| `className` | `string` | No | Container class override |

### `FoodAddModalProps`

Props for the add-to-diary modal (food log page context).

| Prop | Type | Description |
|------|------|-------------|
| `open` | `boolean` | Controls modal visibility |
| `food` | `UnifiedFoodSearchResultItem \| null` | Selected food; `null` = no selection |
| `onClose` | `() => void` | Called when modal is dismissed |
| `onAdded` | `() => void` | Called after successful diary entry creation |

---

## New API Response Shape

### `GET /api/foods/custom/search` Response

```typescript
interface CustomFoodSearchResponse {
  results: Array<{
    id: string;
    name: string;
    brandName: string | null;
    thumbnail: string | null;
    calories: number | null;
  }>;
}
```
