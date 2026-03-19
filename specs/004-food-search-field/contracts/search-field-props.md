# Contract: FoodSearchField Component Interface

**Type**: UI Component Props Contract
**File**: `src/components/food-search-field/index.tsx`

## Usage Pattern

The component is a pure UI component — it receives all data and handlers via props. Callers must use the `useFoodSearch()` hook (or equivalent) to produce `FoodSearchState`.

```tsx
// Food log page (authenticated)
const searchState = useFoodSearch({ includeCustom: true });
<FoodSearchField
  state={searchState}
  onQueryChange={searchState.setQuery}
  onLoadMore={searchState.loadMore}
  onSelect={handleSelectFood}       // opens add-to-diary modal
  showCustomTab={true}
/>

// Landing page — inside <SearchSection> client component
const searchState = useFoodSearch({ includeCustom: false });
<FoodSearchField
  state={searchState}
  onQueryChange={searchState.setQuery}
  onLoadMore={searchState.loadMore}
  onSelect={handleSelectFood}       // navigates to /foods/[fatSecretId]
  showCustomTab={false}
  placeholder="Search for a food…"
/>
```

## Props

| Prop | Type | Required | Default | Description |
|------|------|----------|---------|-------------|
| `state` | `FoodSearchState` | Yes | — | All search state from `useFoodSearch()` |
| `onQueryChange` | `(query: string) => void` | Yes | — | Fired on every keystroke |
| `onLoadMore` | `() => void` | Yes | — | Fired when "Load more" clicked |
| `onSelect` | `(item: UnifiedFoodSearchResultItem) => void` | Yes | — | Fired on result selection (click or Enter) |
| `showCustomTab` | `boolean` | No | `true` | `false` hides Custom tab (anonymous users) |
| `placeholder` | `string` | No | `"Search for your favorite food or meal"` | Input placeholder |
| `className` | `string` | No | `""` | Root container class override |

## Keyboard Contract

| Key | State | Behaviour |
|-----|-------|-----------|
| `ArrowDown` | Dropdown open | Move highlight to next result; wraps at bottom |
| `ArrowUp` | Dropdown open | Move highlight to previous result; returns to input at top |
| `Enter` | Result highlighted | Fire `onSelect` with highlighted item |
| `Escape` | Any | Clear input, close dropdown |

## Tab Visibility Rules

| User type | Common | Branded | Custom |
|-----------|--------|---------|--------|
| Authenticated | ✅ | ✅ | ✅ (when `showCustomTab=true`) |
| Anonymous | ✅ | ✅ | ❌ (hidden when `showCustomTab=false`) |

## Dropdown State Machine

| Query length | Has history | Dropdown content |
|---|---|---|
| 0 | Yes | History list (up to 5 entries) |
| 0 | No | Closed |
| 1–2 chars | — | "Type at least 3 characters" prompt |
| ≥ 3 chars, loading | — | Loading skeleton (after 500ms) |
| ≥ 3 chars, results | — | Tabbed results + Load more |
| ≥ 3 chars, empty | — | Empty state with refine suggestions |
| ≥ 3 chars, error | — | Error state with retry button |
