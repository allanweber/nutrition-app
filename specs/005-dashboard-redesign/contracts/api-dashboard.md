# API Contracts: Dashboard Endpoints (005)

**Phase**: 1 — Design
**Date**: 2026-03-21
**Base path**: `/api/dashboard`
**Auth**: All endpoints require an authenticated session. Returns `401` if not authenticated.
**Error format**: `{ "success": false, "error": "<message>" }`

---

## GET /api/dashboard/daily-summary

Returns aggregated nutrition data for a given date.

### Query Parameters

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `date` | ISO date string `YYYY-MM-DD` | No | Today (server time) | Must be a valid calendar date |

### Success Response — 200

```json
{
  "summary": {
    "date": "2026-03-21",
    "caloriesConsumed": 1482,
    "calorieGoal": 2200,
    "caloriesBurned": 0,
    "netBalance": 1482,
    "percentConsumed": 67,
    "remaining": 718,
    "protein": { "consumed": 92, "goal": 140 },
    "carbs":   { "consumed": 185, "goal": 250 },
    "fat":     { "consumed": 42,  "goal": 65  },
    "hasGoal": true
  }
}
```

### Notes
- When `hasGoal: false`, goal fields use system defaults (calories: 2000, protein: 150g, carbs: 250g, fat: 65g).
- `caloriesBurned` is always `0` in this version (exercise logging not yet implemented).
- `percentConsumed` is not clamped — it can exceed 100 when goal is exceeded.

### Error Responses
| Status | Condition |
|--------|-----------|
| 400 | Invalid `date` format |
| 401 | Unauthenticated |
| 500 | Server error |

---

## GET /api/dashboard/hydration

Returns today's water intake record. Creates a row for today with `total_ml = 0` if none exists yet.

### Query Parameters

None.

### Success Response — 200

```json
{
  "hydration": {
    "date": "2026-03-21",
    "totalMl": 1800,
    "totalLiters": 1.8,
    "goalMl": 2500,
    "percentConsumed": 72,
    "hasGoal": true
  }
}
```

### Notes
- `percentConsumed` is clamped to 0–100 for display purposes (progress bar).
- `totalLiters` is rounded to 1 decimal place.
- A row is always returned — the endpoint upserts a zero-intake row if today has no log.

### Error Responses
| Status | Condition |
|--------|-----------|
| 401 | Unauthenticated |
| 500 | Server error |

---

## POST /api/dashboard/hydration/add

Increments today's water intake by one glass (250 ml). Upserts the `hydration_logs` row for today.

### Request Body

None. The increment amount (250 ml) is fixed server-side.

### Success Response — 200

```json
{
  "success": true,
  "hydration": {
    "date": "2026-03-21",
    "totalMl": 2050,
    "totalLiters": 2.1,
    "goalMl": 2500,
    "percentConsumed": 82,
    "hasGoal": true
  }
}
```

### Notes
- Returns the full updated hydration record so the client can update the UI immediately without a separate GET.
- `totalMl` can exceed `goalMl` — no server-side cap.

### Error Responses
| Status | Condition |
|--------|-----------|
| 401 | Unauthenticated |
| 500 | Server error |

---

## GET /api/dashboard/weekly-snapshot

Returns exactly 7 daily adherence entries for the current calendar week (Monday–Sunday).

### Query Parameters

None. The week is always the current calendar week (server date).

### Success Response — 200

```json
{
  "snapshot": {
    "weekStart": "2026-03-16",
    "days": [
      {
        "date": "2026-03-16",
        "dayLabel": "MON",
        "caloriesConsumed": 1800,
        "calorieGoal": 2200,
        "adherenceRatio": 0.82,
        "isCurrentDay": false,
        "hasData": true
      },
      {
        "date": "2026-03-17",
        "dayLabel": "TUE",
        "caloriesConsumed": 2100,
        "calorieGoal": 2200,
        "adherenceRatio": 0.95,
        "isCurrentDay": false,
        "hasData": true
      },
      {
        "date": "2026-03-18",
        "dayLabel": "WED",
        "caloriesConsumed": 950,
        "calorieGoal": 2200,
        "adherenceRatio": 0.43,
        "isCurrentDay": false,
        "hasData": true
      },
      {
        "date": "2026-03-19",
        "dayLabel": "THU",
        "caloriesConsumed": 2090,
        "calorieGoal": 2200,
        "adherenceRatio": 0.95,
        "isCurrentDay": false,
        "hasData": true
      },
      {
        "date": "2026-03-20",
        "dayLabel": "FRI",
        "caloriesConsumed": 300,
        "calorieGoal": 2200,
        "adherenceRatio": 0.14,
        "isCurrentDay": false,
        "hasData": true
      },
      {
        "date": "2026-03-21",
        "dayLabel": "SAT",
        "caloriesConsumed": 1482,
        "calorieGoal": 2200,
        "adherenceRatio": 0.67,
        "isCurrentDay": true,
        "hasData": true
      },
      {
        "date": "2026-03-22",
        "dayLabel": "SUN",
        "caloriesConsumed": 0,
        "calorieGoal": 2200,
        "adherenceRatio": 0,
        "isCurrentDay": false,
        "hasData": false
      }
    ]
  }
}
```

### Notes
- Always returns exactly 7 entries, one per day, Mon–Sun.
- Future days have `caloriesConsumed: 0`, `hasData: false`.
- `adherenceRatio` is unclamped — values > 1.0 indicate over-goal days.
- Bar chart height in the UI = `Math.min(adherenceRatio, 1) × 100%`.

### Error Responses
| Status | Condition |
|--------|-----------|
| 401 | Unauthenticated |
| 500 | Server error |

---

## GET /api/dashboard/schedule

Returns today's logged meals grouped by time-of-day.

### Query Parameters

| Parameter | Type | Required | Default | Validation |
|-----------|------|----------|---------|------------|
| `date` | ISO date string `YYYY-MM-DD` | No | Today | Must be a valid calendar date |

### Success Response — 200

```json
{
  "schedule": {
    "morning": [
      {
        "id": 101,
        "name": "Protein Oats",
        "time": "08:00 AM",
        "timeGroup": "morning",
        "calories": 450,
        "iconType": "meal",
        "mealType": "breakfast"
      }
    ],
    "midday": [
      {
        "id": 102,
        "name": "HIIT Session",
        "time": "12:30 PM",
        "timeGroup": "midday",
        "calories": 0,
        "iconType": "snack",
        "mealType": "lunch"
      }
    ],
    "evening": []
  }
}
```

### Notes
- All three groups (`morning`, `midday`, `evening`) are always present — never omitted.
- Empty groups return `[]`.
- `name` is derived from the first food item's name in the meal. If the meal has no items, falls back to the `mealType` label (e.g., "Breakfast").
- `time` is formatted in 12-hour format matching the user's locale (server uses `en-US`).
- `iconType` is `"meal"` for breakfast/lunch/dinner/snack types, `"snack"` for snack variants.

### Time Group Mapping

| Hour Range | Group |
|------------|-------|
| 00:00 – 10:59 | `morning` |
| 11:00 – 16:59 | `midday` |
| 17:00 – 23:59 | `evening` |

### Error Responses
| Status | Condition |
|--------|-----------|
| 400 | Invalid `date` format |
| 401 | Unauthenticated |
| 500 | Server error |

---

## Shared Error Format

All endpoints use the existing project error contract:

```json
{ "success": false, "error": "<human-readable message>" }
```

Server errors do not expose internal details, stack traces, or database error codes.
