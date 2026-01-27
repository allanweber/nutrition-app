# Analysis: Multi-Source Nutrition Data Aggregation

**Created**: 2026-01-26
**Status**: Pre-Implementation Review

## Executive Summary

The spec, plan, and tasks are well-structured and comprehensive.

**Updates (2026-01-27)**:
- USDA moved to server-side (protects API key)
- Barcode scanning: manual entry only (camera deferred)
- Database search: ILIKE with lowercase index
- Browse USDA by category: removed (search by name only)

**Status**: All critical gaps resolved. Ready for implementation.

---

## Critical Gaps (All Resolved)

### GAP-1: ~~User Story 4 (Browse USDA Foods) Not Implemented~~ RESOLVED

**Resolution**: Removed from scope. Foods are searched by name only, no category browsing needed.

---

### GAP-2: Database Search Query Not Defined

**Issue**: The aggregator checks "database first" but there's no specification of:
- What database query to use (ILIKE on name? Full-text search?)
- How to index the foods table for search performance
- Whether to search brand_name as well

**Spec Reference**: FR-008 (< 100ms database query)

**Impact**: Without proper indexing, database searches may exceed 100ms latency target.

**Recommendation**: Add to Task 2.4:
- Define database search query (e.g., `WHERE name ILIKE '%query%' OR brand_name ILIKE '%query%'`)
- Add GIN index migration for full-text search, or document simple ILIKE approach
- Consider pg_trgm extension for fuzzy matching

---

### GAP-3: Immediate Database Persistence May Cause Duplicates

**Issue**: FR-019 requires saving ALL foods immediately on retrieval. When the same food is returned from multiple sources, this could create duplicate records.

**Current Design**: Save all foods immediately, deduplicate in UI.

**Problem**:
- User searches "apple" → USDA returns "Apple, raw" → saved to DB
- Same search → OpenFoodFacts returns "Apple, raw" → saved again as duplicate
- Database accumulates duplicates over time

**Recommendation**: Add deduplication logic to `getOrCreateFood()`:
- Check for existing food by `sourceId + source` (current)
- ALSO check for existing food by `name + brandName` (normalized)
- If match found, update instead of insert (or skip)

---

## Medium Risks

### RISK-1: Client-Side USDA Results Not Persisted to Database

**Issue**: USDA runs client-side, but the plan shows results being merged only in the frontend. USDA results may not be saved to the database.

**Current Flow**:
```
Client USDA → Frontend merge → Display
Server API → DB + OFF + FS → Save to DB → Display
```

**Problem**: USDA foods won't be cached in database unless explicitly sent to server.

**Recommendation**: Add mechanism to persist client-side USDA results:
- Option A: POST selected USDA food to server when user logs it
- Option B: Background sync of USDA results to server (adds complexity)
- Option C: Accept that USDA results are client-only cache (document this)

**Suggested**: Option A is simplest and aligns with current food-logs flow.

---

### RISK-2: FatSecret OAuth Token Refresh During Request

**Issue**: OAuth tokens typically expire in 24 hours. If a token expires mid-request:
- First request fails with 401
- Need to refresh token and retry

**Current Plan**: Token caching mentioned but retry logic not detailed.

**Recommendation**: Add to Task 2.3:
- Implement token refresh on 401 response
- Add mutex/lock to prevent concurrent token refreshes
- Consider proactive refresh when token is near expiry (e.g., < 5 min)

---

### RISK-3: Progressive Loading UX Complexity

**Issue**: Showing results as they arrive from different sources is complex:
- USDA (client) may return before server response
- Server response contains DB + OFF + FS results
- Need to merge incrementally without UI flicker

**Current Plan**: "React Query streaming pattern" mentioned but not detailed.

**Recommendation**: Clarify the UX pattern in Task 2.8:
- Use React state to accumulate results from multiple queries
- Show loading indicator per-source or single "searching..." state?
- Define behavior when new results push existing results down
- Consider optimistic UI with placeholder cards

---

### RISK-4: Deduplication Algorithm Edge Cases

**Issue**: Deduplication by "name + brand matching" is underspecified:
- Case sensitivity? ("Apple" vs "apple")
- Whitespace/punctuation? ("Chicken Breast" vs "Chicken  Breast")
- Brand variations? ("Coca-Cola" vs "Coca Cola" vs "CocaCola")

**Impact**: Poor deduplication = duplicate results shown to users.

**Recommendation**: Define normalization rules:
```typescript
function normalizeForDedup(name: string, brand?: string): string {
  return [name, brand]
    .filter(Boolean)
    .join('|')
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '') // Remove non-alphanumeric
}
```

---

### RISK-5: Barcode Scanning UI Not Specified

**Issue**: User Story 3 mentions "tap Scan Barcode" but no UI component is planned:
- Camera access/permissions
- Barcode scanning library (or native?)
- Mobile vs desktop experience

**Current Tasks**: Task 2.7 updates `/api/foods/upc` but no frontend barcode task.

**Recommendation**: Either:
- Add Task 2.8b for barcode scanning UI component
- OR clarify that barcode is API-only (manual UPC entry) for phase 1
- If camera scanning needed, evaluate libraries (e.g., `quagga2`, `zxing-js`)

---

## Minor Considerations

### CONSIDER-1: USDA API Key in Client Bundle

**Status**: Documented as acceptable per USDA terms.

**Consideration**: While USDA allows public keys, the key will be visible in browser dev tools. Ensure:
- Key is rate-limited by IP (which it is)
- Key can be rotated easily if abused
- Document in README how to obtain new key

---

### CONSIDER-2: OpenFoodFacts Rate Limit (100/min) May Be Hit

**Status**: Mentioned in spec but not actively mitigated.

**Consideration**: 100 req/min is shared across all users on the server. With 10 concurrent users searching, this could be exhausted quickly.

**Recommendation**: Add to Task 2.2:
- Implement request queue with rate limiting
- Or accept graceful degradation (OFF returns error, continue with other sources)

---

### CONSIDER-3: In-Memory Cache Lost on Server Restart

**Status**: LRU cache is in-memory only.

**Consideration**: Server restart clears all cached search results. This is acceptable for search caching (database is the durable cache), but document this behavior.

---

### CONSIDER-4: No Retry Logic for Individual Sources

**Issue**: FR-029 requires "retry logic with exponential backoff" but tasks don't detail this.

**Recommendation**: Add to aggregator:
- Max 1-2 retries per source within the 3-second timeout
- Exponential backoff: 100ms, then 300ms
- Don't retry on 4xx errors (client error, won't succeed)

---

### CONSIDER-5: Nutrient ID Mapping Not Detailed

**Issue**: USDA uses `attr_id` numbers (e.g., 203 = protein). OpenFoodFacts uses field names. FatSecret uses different names.

**Current Plan**: "Document nutrient ID mappings" in Phase 0 research.

**Recommendation**: Create mapping file early (Task 1.1 or separate task):
```typescript
const NUTRIENT_MAPPING = {
  protein: { usda: 203, off: 'proteins_100g', fatsecret: 'protein' },
  carbs: { usda: 205, off: 'carbohydrates_100g', fatsecret: 'carbohydrate' },
  // ...
}
```

---

### CONSIDER-6: No Logging/Metrics Task

**Issue**: FR-031 requires "log API errors and latency metrics" but no task covers this.

**Recommendation**: Add acceptance criteria to Task 2.4:
- Log source response times
- Log source errors with status codes
- Consider structured logging for easier analysis

---

### CONSIDER-7: Cache Expiration (30 days) Implementation

**Issue**: FR-024 mentions 30-day cache expiration as SHOULD, but no implementation specified.

**Recommendation**: Decide:
- Implement via `updatedAt` column check in database query
- Or defer to future phase (simpler for now)

---

### CONSIDER-8: Existing Nutritionix Data in Database

**Issue**: Database contains foods with `source='nutritionix'`. What happens to them?

**Current Plan**: "No references to nutritionix in codebase (except historical data in DB)"

**Recommendation**: Document clearly:
- Existing nutritionix foods remain in database
- They will be returned from database searches
- Consider migration to update `source='database'` or leave as-is for auditing

---

## Architecture Diagram (Updated - All Server-Side)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                              BROWSER                                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                     Food Search Component                         │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                      │   │
│  │  │ Search Input    │    │ Barcode Input   │ (manual entry)       │   │
│  │  └────────┬────────┘    └────────┬────────┘                      │   │
│  │           │                      │                                │   │
│  │           ▼                      ▼                                │   │
│  │  ┌─────────────────┐    ┌─────────────────┐                      │   │
│  │  │ useFoodSearch() │    │ useBarcodeQuery │                      │   │
│  │  │ (React Query)   │    │ (React Query)   │                      │   │
│  │  └────────┬────────┘    └────────┬────────┘                      │   │
│  └───────────┼──────────────────────┼───────────────────────────────┘   │
│              │                      │                                    │
└──────────────┼──────────────────────┼────────────────────────────────────┘
               │                      │
               ▼                      ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                              SERVER                                      │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌────────────────────────┐    ┌────────────────────────┐              │
│  │  /api/foods/search     │    │  /api/foods/upc        │              │
│  └───────────┬────────────┘    └───────────┬────────────┘              │
│              │                              │                            │
│              ▼                              ▼                            │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                      AGGREGATOR                                   │   │
│  │                                                                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────┐ │   │
│  │  │  Database   │  │    USDA     │  │ OpenFood    │  │FatSecret│ │   │
│  │  │  (ILIKE +   │  │  (server)   │  │ Facts       │  │ (OAuth) │ │   │
│  │  │   index)    │  │             │  │             │  │         │ │   │
│  │  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  └────┬────┘ │   │
│  │         │                │                │               │      │   │
│  │         │      Promise.allSettled() + 3s timeout          │      │   │
│  │         │                │                │               │      │   │
│  │         ▼                ▼                ▼               ▼      │   │
│  │  ┌───────────────────────────────────────────────────────────┐  │   │
│  │  │     Merge, Dedupe (normalize name+brand), Save to DB      │  │   │
│  │  └───────────────────────────────────────────────────────────┘  │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  ┌──────────────────┐    ┌──────────────────┐                          │
│  │   LRU Cache      │    │   PostgreSQL     │                          │
│  │   (in-memory)    │    │   (foods table   │                          │
│  │                  │    │    + indexes)    │                          │
│  └──────────────────┘    └──────────────────┘                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Recommendations Summary

### Before Starting Implementation

1. ~~**Decide on GAP-1**: Implement Browse USDA UI or descope to future phase~~ **RESOLVED: Removed from scope**
2. ~~**Define database search query** (GAP-2)~~ **RESOLVED: ILIKE with lowercase index**
3. ~~**Add deduplication to getOrCreateFood** (GAP-3)~~ **RESOLVED: Normalize name+brand in aggregator**

### During Implementation

4. ~~**Task 2.1**: Ensure USDA foods are persisted when logged (RISK-1)~~ **RESOLVED: All server-side**
5. **Task 2.3**: Add OAuth token refresh logic (RISK-2) - still needed
6. ~~**Task 2.4**: Define deduplication normalization (RISK-4)~~ **RESOLVED**
7. ~~**Task 2.8**: Clarify progressive loading UX (RISK-3)~~ **RESOLVED: Simplified architecture**
8. ~~**Decide on barcode UI** (RISK-5)~~ **RESOLVED: Manual entry, camera deferred**

### Documentation Updates

9. ~~Update spec to clarify USDA client-side caching behavior~~ **RESOLVED: Server-side now**
10. Document nutrient ID mappings - during implementation
11. Document handling of existing nutritionix data - during implementation

---

## Risk Matrix

| ID | Risk | Likelihood | Impact | Priority | Status |
|----|------|------------|--------|----------|--------|
| GAP-1 | Browse USDA UI missing | High | Medium | **Critical** | Resolved (removed) |
| GAP-2 | DB search performance | Medium | High | **Critical** | Resolved (ILIKE + index) |
| GAP-3 | Duplicate records | High | Medium | **Critical** | Resolved (dedup logic) |
| RISK-1 | USDA not persisted | Medium | Medium | Medium | Resolved (server-side) |
| RISK-2 | OAuth token expiry | Low | High | Medium | Acknowledged |
| RISK-3 | Progressive loading UX | Medium | Medium | Medium | Resolved (simplified) |
| RISK-4 | Dedup edge cases | Medium | Low | Medium | Resolved (normalization) |
| RISK-5 | Barcode UI missing | High | Medium | Medium | Resolved (manual entry) |

---

## Approval Status

- [x] GAP-1 addressed - **RESOLVED: Removed, search by name only**
- [x] GAP-2 addressed (DB query defined) - **RESOLVED: ILIKE with lowercase index**
- [x] GAP-3 addressed (dedup logic added) - **RESOLVED: Normalize name+brand in aggregator**
- [x] RISK-1 resolved - **All sources server-side now, persisted on retrieval**
- [x] RISK-3 resolved - **Simplified: no client-side merging needed**
- [x] RISK-4 resolved - **Dedup normalization defined**
- [x] RISK-5 resolved - **Manual barcode entry, camera deferred**
- [x] Ready to proceed with implementation
