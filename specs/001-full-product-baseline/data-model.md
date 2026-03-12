# Data Model: Full Product Baseline

## Scope
This model documents the current baseline entities and behavior boundaries used for parity verification.

## Entities

### UserAccount
- Fields: `id`, `email`, `name`, `image`, `role`, `emailVerified`, `createdAt`, `updatedAt`
- Validation:
  - `email` unique and required.
  - `role` in `individual | professional | admin`.
- Relationships:
  - One-to-many with `Session`, `Account`, `NutritionGoal`, `FoodLogMeal`, `SecurityEvent`.

### Session
- Fields: `id`, `userId`, `token`, `expiresAt`, `ipAddress`, `userAgent`, timestamps
- Validation:
  - `token` unique and required.
  - `userId` required and cascades on user delete.
- Relationships:
  - Belongs to `UserAccount`.

### AuthCodeFlowBoundary
- Boundary:
  - Email verification challenge data and password reset verification data are intentionally out of scope for this baseline model.
  - See `specs/002-email-verification-reset/data-model.md` for those entities and transitions.

### FoodCatalogItem
- Fields: food identity/source fields + nutrient and serving fields (`foods` table)
- Validation:
  - `name` required.
  - Nutrient snapshots are numeric/decimal where present.
- Relationships:
  - One-to-many with `FoodAltMeasure`.
  - Optional one-to-one with `FoodPhoto`.

### FoodLogMeal
- Fields: `id`, `userId`, `mealType`, `consumedAt`, optional `sourceDietPlanMealGroupId`, timestamps
- Validation:
  - `mealType` in supported enum.
  - `userId` required.
- Relationships:
  - One-to-many with `FoodLogItem`.

### FoodLogItem
- Fields: `id`, `mealId`, `foodId`, `quantity`, `servingUnit`, nutrient snapshot columns, timestamps
- Validation:
  - `quantity > 0` and bounded by API validation.
- Relationships:
  - Belongs to `FoodLogMeal`; optional link to canonical `FoodCatalogItem`.

### NutritionGoal
- Fields: `id`, `userId`, `goalType`, `targetCalories`, `targetProtein`, `targetCarbs`, `targetFat`, `targetFiber`, `targetSodium`, `activityLevel`, `isActive`, date window, timestamps
- Validation:
  - User-level numeric bounds validated in API layer.
  - If no active row exists, defaults returned by API.
- Relationships:
  - Belongs to `UserAccount`.

### DietPlan (Partial)
- Fields: owner/client linkage and macro targets (plus meal groups/items)
- Validation:
  - User ownership enforced in route handlers.
- Boundary:
  - Current baseline exposes restricted meal-group operations only; no complete end-user plan lifecycle.

### BodyCheckIn (Not Implemented User Flow)
- Fields: data structures exist in DB layer.
- Boundary:
  - No user-facing create/read/update workflow in baseline scope.

## Relationship Summary
- `UserAccount` is the root aggregate for auth, logs, goals, and security auditing.
- `FoodLogMeal` groups `FoodLogItem` entries by date/time and meal type.
- `NutritionGoal` affects dashboard progress calculations but remains independently mutable.
- Partial/not-implemented entities are documented for scope clarity and planning boundaries.
- Email verification and password reset entity behavior is intentionally documented in the dedicated auth-code-flow spec.
