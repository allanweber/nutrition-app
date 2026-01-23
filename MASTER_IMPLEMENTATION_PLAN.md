# Nutrition App - Consolidated Implementation Plan

> **Last Updated**: 2026-01-21  
> **Version**: 5.0  
> **Status**: Phase 3 Complete - Ready for Phase 4  
> **Database**: Local PostgreSQL (Docker)  
> **Auth**: Email/Password + Google OAuth  
> **API**: Nutritionix (credentials ready)  
> **Testing**: Playwright E2E tests per phase
> **New**: Added Phases 8-12 with advanced features from competitor analysis

---

## 📊 Current Project Status

### ✅ COMPLETED (Already Implemented)

#### 1. Project Foundation

| Feature                 | Status  | Location                              |
| ----------------------- | ------- | ------------------------------------- |
| Next.js 14 + TypeScript | ✅ Done | `package.json`, `tsconfig.json`       |
| Tailwind CSS v4         | ✅ Done | `tailwind.config.ts`                  |
| Shadcn/ui components    | ✅ Done | `src/components/ui/*`                 |
| Project structure       | ✅ Done | `src/app/`, `src/lib/`, `src/server/` |

#### 2. Database Schema (Drizzle ORM)

| Feature                          | Status  | Location                                      |
| -------------------------------- | ------- | --------------------------------------------- |
| Users table (with roles)         | ✅ Done | `src/server/db/schema.ts`                     |
| Foods table (Nutritionix cache)  | ✅ Done | `src/server/db/schema.ts`                     |
| Food logs table                  | ✅ Done | `src/server/db/schema.ts`                     |
| Nutrition goals table            | ✅ Done | `src/server/db/schema.ts`                     |
| Diet plans + meals tables        | ✅ Done | `src/server/db/schema.ts`                     |
| Custom foods table               | ✅ Done | `src/server/db/schema.ts`                     |
| Auth tables (sessions, accounts) | ✅ Done | `src/server/db/schema.ts`                     |
| Professional verification        | ✅ Done | `src/server/db/schema.ts`                     |
| Zod validation schemas           | ✅ Done | `src/server/db/schema.ts`                     |
| Migration files                  | ✅ Done | `drizzle/0000_*.sql`, `drizzle/0001_*.sql`    |
| DB connection config             | ✅ Done | `src/server/db/index.ts`, `drizzle.config.ts` |
| **PostgreSQL Docker container**  | ✅ Done | `docker-compose.yml`                          |
| **Schema pushed to database**    | ✅ Done | 11 tables created                             |

#### 3. Authentication (Full Implementation)

| Feature                       | Status  | Location                             |
| ----------------------------- | ------- | ------------------------------------ |
| Better Auth config with DB    | ✅ Done | `src/lib/auth.ts`                    |
| Drizzle adapter connected     | ✅ Done | `src/lib/auth.ts`                    |
| Google OAuth provider         | ✅ Done | `src/lib/auth.ts`                    |
| Auth API route                | ✅ Done | `src/app/api/auth/[...all]/route.ts` |
| Auth client (frontend)        | ✅ Done | `src/lib/auth-client.ts`             |
| Session utilities             | ✅ Done | `src/lib/session.ts`                 |
| Proxy middleware              | ✅ Done | `src/proxy.ts`                       |
| Login page UI + Google OAuth  | ✅ Done | `src/app/login/page.tsx`             |
| Signup page UI + Google OAuth | ✅ Done | `src/app/signup/page.tsx`            |

#### 4. Nutritionix API Integration

| Feature                    | Status  | Location                               |
| -------------------------- | ------- | -------------------------------------- |
| API client class           | ✅ Done | `src/lib/nutritionix.ts`               |
| TypeScript types           | ✅ Done | `src/types/nutritionix.ts`             |
| Food search endpoint       | ✅ Done | `src/app/api/foods/search/route.ts`    |
| Natural nutrients endpoint | ✅ Done | `src/app/api/foods/nutrients/route.ts` |
| UPC lookup endpoint        | ✅ Done | `src/app/api/foods/upc/route.ts`       |

#### 5. UI Pages (Basic Structure)

| Feature                 | Status  | Location                                    |
| ----------------------- | ------- | ------------------------------------------- |
| Landing page            | ✅ Done | `src/app/page.tsx`                          |
| Dashboard layout        | ✅ Done | `src/app/(dashboard)/layout.tsx`            |
| Dashboard page (static) | ✅ Done | `src/app/(dashboard)/dashboard/page.tsx`    |
| Food search page        | ✅ Done | `src/app/(dashboard)/foods/search/page.tsx` |
| Food log page (basic)   | ✅ Done | `src/app/(dashboard)/food-log/page.tsx`     |
| Goals page (basic)      | ✅ Done | `src/app/(dashboard)/goals/page.tsx`        |
| Food search component   | ✅ Done | `src/components/food-search.tsx`            |

#### 6. Dependencies Installed

| Package                      | Purpose           | Status       |
| ---------------------------- | ----------------- | ------------ |
| `drizzle-orm`, `drizzle-kit` | Database ORM      | ✅ Installed |
| `better-auth`                | Authentication    | ✅ Installed |
| `recharts`                   | Charts library    | ✅ Installed |
| `date-fns`                   | Date utilities    | ✅ Installed |
| `zustand`                    | State management  | ✅ Installed |
| `react-hook-form`, `zod`     | Forms/validation  | ✅ Installed |
| `lucide-react`               | Icons             | ✅ Installed |
| `postgres`                   | PostgreSQL driver | ✅ Installed |
| `@playwright/test`           | E2E testing       | ✅ Installed |

#### 7. Testing Infrastructure

| Feature               | Status  | Location                      |
| --------------------- | ------- | ----------------------------- |
| Playwright config     | ✅ Done | `playwright.config.ts`        |
| Test fixtures         | ✅ Done | `e2e/fixtures/test-data.ts`   |
| Login page object     | ✅ Done | `e2e/pages/login.page.ts`     |
| Signup page object    | ✅ Done | `e2e/pages/signup.page.ts`    |
| Dashboard page object | ✅ Done | `e2e/pages/dashboard.page.ts` |
| Phase 1 auth tests    | ✅ Done | `e2e/phase-1-auth.spec.ts`    |

---

### ✅ COMPLETED (Phases 1-3)

#### 1. Database & Core Infrastructure

**Status**: ✅ COMPLETE

- PostgreSQL running in Docker
- Database schema pushed (11 tables)
- Better Auth configured with email + Google OAuth
- All auth flows working
- E2E tests passing

#### 2. Food Logging System

**Status**: ✅ COMPLETE

- Food CRUD operations with real database
- Daily nutrition totals calculation
- Date filtering and navigation
- Food search with Nutritionix/mock API
- Delete functionality
- All E2E tests passing

#### 3. Dashboard & Charts

**Status**: ✅ COMPLETE

- Real-time nutrition summary cards
- Interactive charts (calories, macros, trends)
- Goal progress visualization
- Recent activity feed
- Mobile responsive design
- All E2E tests passing

---

### ❌ NOT IMPLEMENTED (Remaining Features)

See detailed breakdown in implementation phases below.

---

## 🧪 Testing Strategy

### Playwright E2E Testing (Per Phase)

Each phase includes Playwright integration tests as a **required deliverable**.

**Test Structure**:

```
e2e/
├── fixtures/
│   └── test-data.ts              # ✅ Created
├── pages/
│   ├── login.page.ts             # ✅ Created
│   ├── signup.page.ts            # ✅ Created
│   ├── dashboard.page.ts         # ✅ Created
│   ├── food-log.page.ts          # Pending
│   └── goals.page.ts             # Pending
├── phase-1-auth.spec.ts          # ✅ Created
├── phase-2-food-logging.spec.ts  # Pending
├── phase-3-dashboard.spec.ts     # Pending
├── phase-4-goals.spec.ts         # Pending
├── phase-5-advanced.spec.ts      # Pending
├── phase-6-professional.spec.ts  # Pending
└── global-setup.ts               # Pending
```

**Test Coverage Requirements**:

- Happy path flows
- Error handling scenarios
- Edge cases
- Mobile viewport tests

---

## 🚀 Implementation Phases

### Phase 1: Database & Core Infrastructure (Days 1-3) ✅ COMPLETE

**Priority: 🔴 CRITICAL**
**Status: ✅ DONE**

#### Tasks

| #   | Task                                       | Files Created/Modified                 | Status  |
| --- | ------------------------------------------ | -------------------------------------- | ------- |
| 1.1 | Setup Playwright                           | `playwright.config.ts`, `package.json` | ✅ Done |
| 1.2 | Create Docker Compose for PostgreSQL       | `docker-compose.yml`                   | ✅ Done |
| 1.3 | Start PostgreSQL container                 | Docker running                         | ✅ Done |
| 1.4 | Update .env.local with real DB credentials | `.env.local`                           | ✅ Done |
| 1.5 | Run Drizzle migrations                     | Schema pushed                          | ✅ Done |
| 1.6 | Test database connection                   | Build successful                       | ✅ Done |
| 1.7 | Connect Better Auth to database            | `src/lib/auth.ts`                      | ✅ Done |
| 1.8 | Add Google OAuth provider                  | `src/lib/auth.ts`                      | ✅ Done |
| 1.9 | Write E2E tests for auth flows             | `e2e/phase-1-auth.spec.ts`             | ✅ Done |

#### Deliverables

- [x] Playwright configured and working
- [x] PostgreSQL running in Docker
- [x] Database tables created (11 tables)
- [x] Working user registration
- [x] Working user login (email + Google)
- [x] Session management working
- [x] **E2E Tests**: `e2e/phase-1-auth.spec.ts`
  - [x] User can register with email/password
  - [x] User can login with email/password
  - [x] User can logout
  - [x] Invalid credentials show error
  - [x] Protected routes redirect to login
  - [x] Session persists across page reload

---

### Phase 2: Food Logging System (Days 4-5)

**Priority: 🔴 CRITICAL**
**Status: ✅ DONE**

#### Tasks

| #   | Task                                  | Files to Create/Modify                  | Est. Time |
| --- | ------------------------------------- | --------------------------------------- | --------- |
| 2.1 | Implement food INSERT to database     | `src/app/api/food-logs/route.ts`        | 2 hours   |
| 2.2 | Implement food cache from Nutritionix | `src/app/api/food-logs/route.ts`        | 1 hour    |
| 2.3 | Implement food logs GET (daily)       | `src/app/api/food-logs/route.ts`        | 1 hour    |
| 2.4 | Add date filtering to food logs       | `src/app/api/food-logs/route.ts`        | 30 min    |
| 2.5 | Calculate daily nutrition totals      | `src/app/api/food-logs/route.ts`        | 1 hour    |
| 2.6 | Implement food log DELETE             | `src/app/api/food-logs/[id]/route.ts`   | 30 min    |
| 2.7 | Update food log page with real data   | `src/app/(dashboard)/food-log/page.tsx` | 2 hours   |
| 2.8 | Write E2E tests for food logging      | `e2e/phase-2-food-logging.spec.ts`      | 2 hours   |

#### Deliverables

- [x] Food search → Add to log working
- [x] Food logs displayed by date
- [x] Daily totals calculated correctly
- [x] Delete food log entries
- [x] **E2E Tests**: `e2e/phase-2-food-logging.spec.ts`
  - [x] User can search for food
  - [x] User can add food to log
  - [x] Food log displays correct data
  - [x] User can delete food from log
  - [x] Daily totals update correctly
  - [x] Date filtering works
  - [x] Empty state shows when no logs

---

### Phase 3: Dashboard & Charts (Days 6-9)

**Priority: 🟡 HIGH**
**Status: ✅ DONE**

#### Tasks

| #    | Task                                     | Files to Create/Modify                           | Est. Time |
| ---- | ---------------------------------------- | ------------------------------------------------ | --------- |
| 3.1  | Create nutrition data fetching hook      | `src/hooks/use-nutrition-data.ts`                | 1 hour    |
| 3.2  | Create Zustand store for dashboard       | `src/stores/nutrition-store.ts`                  | 1 hour    |
| 3.3  | Update dashboard with real summary cards | `src/app/(dashboard)/dashboard/page.tsx`         | 2 hours   |
| 3.4  | Create DailyCaloriesChart component      | `src/components/charts/daily-calories-chart.tsx` | 2 hours   |
| 3.5  | Create MacroPieChart component           | `src/components/charts/macro-pie-chart.tsx`      | 2 hours   |
| 3.6  | Create WeeklyTrendChart component        | `src/components/charts/weekly-trend-chart.tsx`   | 3 hours   |
| 3.7  | Create GoalProgressBar component         | `src/components/charts/goal-progress-bar.tsx`    | 1 hour    |
| 3.8  | Create MealBreakdown component           | `src/components/charts/meal-breakdown.tsx`       | 2 hours   |
| 3.9  | Add recent activity feed                 | `src/app/(dashboard)/dashboard/page.tsx`         | 1 hour    |
| 3.10 | Create analytics API endpoints           | `src/app/api/analytics/route.ts`                 | 2 hours   |
| 3.11 | Write E2E tests for dashboard            | `e2e/phase-3-dashboard.spec.ts`                  | 2 hours   |

#### Deliverables

- [x] Dynamic nutrition summary cards
- [x] Daily calories line chart (with goal reference)
- [x] Macro distribution pie chart (with percentages)
- [x] Weekly trend bar charts (for all metrics)
- [x] Goal progress visualization (progress bars with rings)
- [x] Recent activity feed (showing latest food logs)
- [x] **E2E Tests**: `e2e/phase-3-dashboard.spec.ts`
  - [x] Dashboard loads with correct data
  - [x] Summary cards display real values
  - [x] Charts render correctly
  - [x] Charts responsive on mobile
  - [x] Recent activity shows latest logs
  - [x] Dashboard works on mobile viewport

---

### Phase 4: Goals System (Days 10-12)

**Priority: 🟡 HIGH**
**Status: ⏳ PENDING**

#### Tasks

Calculate nutrition goals based on user input (BMR/TDEE) user inputs its data and we calculate their goals based on the selected goal (weight loss, maintenance, gain etc).
All the goal is set via a wizard that helps the user to set up their goals.
The goal wizard must be a multi step form that collects the necessary data from the user to calculate their goals, and a generic component that can be reused in other parts of the app if needed (for professionals to set goals for clients).

| #   | Task                              | Files to Create/Modify                   | Est. Time |
| --- | --------------------------------- | ---------------------------------------- | --------- | --- |
| 4.1 | Create goal calculator (BMR/TDEE) | `src/app/api/goals/calculate/route.ts`   | 2 hours   | \*  |
| 4.2 | Create goals CRUD API             | `src/app/api/goals/route.ts`             | 2 hours   |
| 4.3 | Create goal templates             | `src/lib/goal-templates.ts`              | 1 hour    |
| 4.4 | Update goals page with real CRUD  | `src/app/(dashboard)/goals/page.tsx`     | 3 hours   |
| 4.5 | Add goal selection wizard         | `src/components/goal-wizard.tsx`         | 2 hours   |
| 4.6 | Create progress tracking API      | `src/app/api/goals/progress/route.ts`    | 1 hour    |
| 4.7 | Add weekly/monthly summaries      | `src/app/api/analytics/summary/route.ts` | 2 hours   |
| 4.8 | Write E2E tests for goals         | `e2e/phase-4-goals.spec.ts`              | 2 hours   |

#### Deliverables

- [ ] Create/edit/delete nutrition goals
- [ ] BMR and TDEE calculator
- [ ] Goal templates (weight loss, maintenance, gain)
- [ ] Progress tracking over time
- [ ] Weekly and monthly summaries
- [ ] **E2E Tests**: `e2e/phase-4-goals.spec.ts`
  - [ ] User can create a new goal
  - [ ] User can edit existing goal
  - [ ] User can delete goal
  - [ ] Goal calculator provides accurate results
  - [ ] Goal templates populate correct values
  - [ ] Progress tracking shows history
  - [ ] Weekly/monthly summaries calculate correctly

---

### Phase 5: Advanced Features (Days 13-17)

**Priority: 🟢 MEDIUM**
**Status: ⏳ PENDING**

#### Tasks

| #   | Task                                  | Files to Create/Modify                        | Est. Time |
| --- | ------------------------------------- | --------------------------------------------- | --------- |
| 5.1 | Custom food creation UI               | `src/app/(dashboard)/foods/custom/page.tsx`   | 3 hours   |
| 5.2 | Custom food CRUD API                  | `src/app/api/foods/custom/route.ts`           | 2 hours   |
| 5.3 | Meal template creation                | `src/app/(dashboard)/meal-templates/page.tsx` | 3 hours   |
| 5.4 | Meal template API                     | `src/app/api/meal-templates/route.ts`         | 2 hours   |
| 5.5 | Diet plan creation wizard             | `src/app/(dashboard)/diet-plans/page.tsx`     | 4 hours   |
| 5.6 | Diet plan API                         | `src/app/api/diet-plans/route.ts`             | 2 hours   |
| 5.7 | Water intake tracking                 | `src/components/water-tracker.tsx`            | 2 hours   |
| 5.8 | Water intake API                      | `src/app/api/water/route.ts`                  | 1 hour    |
| 5.9 | Write E2E tests for advanced features | `e2e/phase-5-advanced.spec.ts`                | 3 hours   |

#### Deliverables

- [ ] Custom food creation and management
- [ ] Meal templates (save/load)
- [ ] Diet plan creation
- [ ] Water intake tracking
- [ ] **E2E Tests**: `e2e/phase-5-advanced.spec.ts`
  - [ ] User can create custom food
  - [ ] User can edit/delete custom food
  - [ ] User can create meal template
  - [ ] User can apply meal template to log
  - [ ] User can create diet plan
  - [ ] Water tracker updates correctly
  - [ ] Custom foods appear in search

---

### Phase 6: Professional Features (Days 18-19)

**Priority: 🟢 MEDIUM**
**Status: ⏳ PENDING**

#### Tasks

| #   | Task                                      | Files to Create/Modify                                   | Est. Time |
| --- | ----------------------------------------- | -------------------------------------------------------- | --------- |
| 6.1 | Professional verification flow            | `src/app/(dashboard)/professional/verify/page.tsx`       | 2 hours   |
| 6.2 | Client management dashboard               | `src/app/(dashboard)/professional/clients/page.tsx`      | 3 hours   |
| 6.3 | Client management API                     | `src/app/api/professional/clients/route.ts`              | 2 hours   |
| 6.4 | Assign diet plan to client                | `src/app/api/professional/assign-plan/route.ts`          | 1 hour    |
| 6.5 | Client progress view                      | `src/app/(dashboard)/professional/clients/[id]/page.tsx` | 2 hours   |
| 6.6 | Write E2E tests for professional features | `e2e/phase-6-professional.spec.ts`                       | 2 hours   |

#### Deliverables

- [ ] Professional account verification
- [ ] Client list management
- [ ] Assign diet plans to clients
- [ ] View client progress
- [ ] **E2E Tests**: `e2e/phase-6-professional.spec.ts`
  - [ ] Professional can request verification
  - [ ] Professional can add clients
  - [ ] Professional can view client list
  - [ ] Professional can assign diet plan
  - [ ] Professional can view client progress
  - [ ] Regular user cannot access pro features

---

### Phase 7: Polish & Final Testing (Days 20-21)

**Priority: 🟢 MEDIUM**
**Status: ⏳ PENDING**

#### Tasks

| #   | Task                           | Files to Create/Modify              | Est. Time |
| --- | ------------------------------ | ----------------------------------- | --------- |
| 7.1 | Mobile responsive optimization | Multiple files                      | 3 hours   |
| 7.2 | Add loading states/skeletons   | Multiple files                      | 2 hours   |
| 7.3 | Error boundaries               | `src/components/error-boundary.tsx` | 1 hour    |
| 7.4 | Toast notifications            | Add `sonner` or similar             | 1 hour    |
| 7.5 | Dark/light theme toggle        | `src/components/theme-toggle.tsx`   | 2 hours   |
| 7.6 | Full regression test suite     | `e2e/regression.spec.ts`            | 3 hours   |
| 7.7 | Performance tests              | `e2e/performance.spec.ts`           | 2 hours   |
| 7.8 | Accessibility tests            | `e2e/accessibility.spec.ts`         | 2 hours   |

#### Deliverables

- [ ] Mobile-optimized UI
- [ ] Loading states everywhere
- [ ] Error handling
- [ ] Toast notifications
- [ ] Theme toggle
- [ ] **E2E Tests**: Final test suites
  - [ ] `e2e/regression.spec.ts` - Full app regression
  - [ ] `e2e/performance.spec.ts` - Page load times
  - [ ] `e2e/accessibility.spec.ts` - A11y compliance
  - [ ] All previous tests pass on mobile viewport

---

### Phase 8: Recipe Management & Body Tracking (Days 22-26)

**Priority: 🟡 HIGH (Tier 1 - Recommended)**
**Status: ⏳ PENDING**

#### Tasks

| #    | Task                                 | Files to Create/Modify                         | Est. Time |
| ---- | ------------------------------------ | ---------------------------------------------- | --------- |
| 8.1  | Update database schema for recipes   | `src/server/db/schema.ts`                      | 2 hours   |
| 8.2  | Create recipe CRUD API               | `src/app/api/recipes/route.ts`                 | 3 hours   |
| 8.3  | Create recipe builder UI             | `src/app/(dashboard)/recipes/page.tsx`         | 4 hours   |
| 8.4  | Add recipe ingredients management    | `src/components/recipe-ingredients.tsx`        | 3 hours   |
| 8.5  | Add cooking instructions editor      | `src/components/recipe-instructions.tsx`       | 2 hours   |
| 8.6  | Calculate nutrition per serving      | `src/lib/recipe-nutrition.ts`                  | 2 hours   |
| 8.7  | Add recipe tags and filtering        | `src/components/recipe-filters.tsx`            | 2 hours   |
| 8.8  | Create public recipe sharing         | `src/app/api/recipes/share/route.ts`           | 2 hours   |
| 8.9  | Add recipe to food log functionality | `src/app/api/food-logs/route.ts`               | 1 hour    |
| 8.10 | Add body weight tracking schema      | `src/server/db/schema.ts`                      | 1 hour    |
| 8.11 | Create weight tracking API           | `src/app/api/weight/route.ts`                  | 2 hours   |
| 8.12 | Create weight tracking UI            | `src/app/(dashboard)/weight/page.tsx`          | 3 hours   |
| 8.13 | Add weight trend chart               | `src/components/charts/weight-trend-chart.tsx` | 2 hours   |
| 8.14 | Add body measurements schema         | `src/server/db/schema.ts`                      | 1 hour    |
| 8.15 | Create measurements API              | `src/app/api/measurements/route.ts`            | 2 hours   |
| 8.16 | Create measurements UI               | `src/app/(dashboard)/measurements/page.tsx`    | 3 hours   |
| 8.17 | Add progress photos schema           | `src/server/db/schema.ts`                      | 1 hour    |
| 8.18 | Create photo upload API              | `src/app/api/progress-photos/route.ts`         | 2 hours   |
| 8.19 | Create progress photos gallery       | `src/app/(dashboard)/progress-photos/page.tsx` | 3 hours   |
| 8.20 | Add before/after comparison          | `src/components/photo-comparison.tsx`          | 2 hours   |
| 8.21 | Write E2E tests for recipe features  | `e2e/phase-8-recipes-body-tracking.spec.ts`    | 3 hours   |

#### Deliverables

- [ ] Recipe creation with ingredients and instructions
- [ ] Recipe nutrition calculation per serving
- [ ] Recipe tags and filtering
- [ ] Public recipe sharing via links
- [ ] Add recipes to food log
- [ ] Body weight tracking with charts
- [ ] Custom body measurements (waist, arms, chest, etc.)
- [ ] Progress photos gallery with upload
- [ ] Before/after photo comparison
- [ ] **E2E Tests**: `e2e/phase-8-recipes-body-tracking.spec.ts`
  - [ ] User can create a recipe
  - [ ] User can add ingredients to recipe
  - [ ] User can add cooking instructions
  - [ ] Recipe nutrition calculates correctly
  - [ ] User can tag and filter recipes
  - [ ] User can share recipe via public link
  - [ ] User can add recipe to food log
  - [ ] User can log body weight
  - [ ] Weight trend chart displays correctly
  - [ ] User can add body measurements
  - [ ] User can upload progress photos
  - [ ] Photo comparison works correctly

---

### Phase 9: Barcode Scanner & Data Portability (Days 27-30)

**Priority: 🟡 HIGH (Tier 1 - Recommended)**
**Status: ⏳ PENDING**

#### Tasks

| #    | Task                                     | Files to Create/Modify                         | Est. Time |
| ---- | ---------------------------------------- | ---------------------------------------------- | --------- |
| 9.1  | Add barcode scanner library              | `package.json`, install `html5-qrcode`         | 30 min    |
| 9.2  | Create barcode scanner component         | `src/components/barcode-scanner.tsx`           | 3 hours   |
| 9.3  | Integrate scanner with UPC lookup        | `src/components/barcode-scanner.tsx`           | 2 hours   |
| 9.4  | Add scanner to food search page          | `src/app/(dashboard)/foods/search/page.tsx`    | 1 hour    |
| 9.5  | Add camera permissions handling          | `src/lib/camera-permissions.ts`                | 1 hour    |
| 9.6  | Add AI food recognition library          | `package.json`, research API options           | 2 hours   |
| 9.7  | Create image upload component            | `src/components/image-food-upload.tsx`         | 3 hours   |
| 9.8  | Create AI food recognition API           | `src/app/api/foods/image-recognize/route.ts`   | 4 hours   |
| 9.9  | Integrate image recognition with logging | `src/app/(dashboard)/food-log/page.tsx`        | 2 hours   |
| 9.10 | Create data export API                   | `src/app/api/export/route.ts`                  | 3 hours   |
| 9.11 | Add CSV export functionality             | `src/lib/export-csv.ts`                        | 2 hours   |
| 9.12 | Add JSON export functionality            | `src/lib/export-json.ts`                       | 1 hour    |
| 9.13 | Create export UI                         | `src/app/(dashboard)/settings/export/page.tsx` | 2 hours   |
| 9.14 | Create data import API                   | `src/app/api/import/route.ts`                  | 3 hours   |
| 9.15 | Add CSV import functionality             | `src/lib/import-csv.ts`                        | 3 hours   |
| 9.16 | Add bulk food import validation          | `src/lib/import-validation.ts`                 | 2 hours   |
| 9.17 | Create import UI                         | `src/app/(dashboard)/settings/import/page.tsx` | 2 hours   |
| 9.18 | Add backup/restore functionality         | `src/components/backup-restore.tsx`            | 2 hours   |
| 9.19 | Write E2E tests for barcode & data       | `e2e/phase-9-barcode-data-portability.spec.ts` | 3 hours   |

#### Deliverables

- [ ] Barcode scanner for packaged foods
- [ ] UPC lookup integration with scanner
- [ ] Camera permissions handling
- [ ] Image-based food logging
- [ ] AI food recognition from photos
- [ ] CSV data export (all data types)
- [ ] JSON data export (all data types)
- [ ] CSV data import with validation
- [ ] Bulk custom food import
- [ ] Full backup and restore functionality
- [ ] **E2E Tests**: `e2e/phase-9-barcode-data-portability.spec.ts`
  - [ ] User can scan barcode
  - [ ] Scanner finds food via UPC
  - [ ] User can upload food image
  - [ ] AI recognizes food from image
  - [ ] User can export data to CSV
  - [ ] User can export data to JSON
  - [ ] User can import CSV data
  - [ ] Import validation works correctly
  - [ ] User can create full backup
  - [ ] User can restore from backup

---

### Phase 10: Enhanced Organization & Offline Support (Days 31-35)

**Priority: 🟢 MEDIUM (Tier 2)**
**Status: ⏳ PENDING**

#### Tasks

| #     | Task                             | Files to Create/Modify                      | Est. Time |
| ----- | -------------------------------- | ------------------------------------------- | --------- |
| 10.1  | Add tags/categories schema       | `src/server/db/schema.ts`                   | 1 hour    |
| 10.2  | Create tags CRUD API             | `src/app/api/tags/route.ts`                 | 2 hours   |
| 10.3  | Add tag management UI            | `src/components/tag-manager.tsx`            | 2 hours   |
| 10.4  | Add tags to foods and recipes    | Multiple files                              | 3 hours   |
| 10.5  | Create tag-based filtering       | `src/components/tag-filter.tsx`             | 2 hours   |
| 10.6  | Add service worker for offline   | `public/sw.js`                              | 4 hours   |
| 10.7  | Implement IndexedDB caching      | `src/lib/offline-storage.ts`                | 4 hours   |
| 10.8  | Add offline indicator            | `src/components/offline-indicator.tsx`      | 1 hour    |
| 10.9  | Implement sync queue             | `src/lib/sync-queue.ts`                     | 3 hours   |
| 10.10 | Add background sync              | `src/lib/background-sync.ts`                | 3 hours   |
| 10.11 | Add exercise tracking schema     | `src/server/db/schema.ts`                   | 2 hours   |
| 10.12 | Create exercise database         | `src/lib/exercise-database.ts`              | 3 hours   |
| 10.13 | Create exercise logging API      | `src/app/api/exercise-logs/route.ts`        | 3 hours   |
| 10.14 | Create exercise tracking UI      | `src/app/(dashboard)/exercise/page.tsx`     | 4 hours   |
| 10.15 | Add exercise to dashboard        | `src/app/(dashboard)/dashboard/page.tsx`    | 2 hours   |
| 10.16 | Add calories burned calculation  | `src/lib/exercise-calories.ts`              | 2 hours   |
| 10.17 | Add unit preferences schema      | `src/server/db/schema.ts`                   | 1 hour    |
| 10.18 | Create unit conversion utilities | `src/lib/unit-conversion.ts`                | 3 hours   |
| 10.19 | Add imperial/metric toggle       | `src/components/unit-toggle.tsx`            | 2 hours   |
| 10.20 | Update all displays for units    | Multiple files                              | 4 hours   |
| 10.21 | Write E2E tests for organization | `e2e/phase-10-organization-offline.spec.ts` | 3 hours   |

#### Deliverables

- [ ] Tag creation and management
- [ ] Tag-based filtering for foods and recipes
- [ ] Offline mode with service worker
- [ ] IndexedDB caching for offline data
- [ ] Sync queue for offline changes
- [ ] Background sync when online
- [ ] Offline indicator in UI
- [ ] Exercise database integration
- [ ] Exercise logging with calories burned
- [ ] Exercise tracking dashboard
- [ ] Imperial/metric unit toggle
- [ ] Unit conversion throughout app
- [ ] **E2E Tests**: `e2e/phase-10-organization-offline.spec.ts`
  - [ ] User can create tags
  - [ ] User can tag foods and recipes
  - [ ] Tag filtering works correctly
  - [ ] App works offline
  - [ ] Offline changes sync when online
  - [ ] User can log exercises
  - [ ] Exercise calories calculate correctly
  - [ ] User can switch units (imperial/metric)
  - [ ] Unit conversions display correctly

---

### Phase 11: AI Coach & Advanced Analytics (Days 36-40)

**Priority: 🟢 MEDIUM (Tier 2)**
**Status: ⏳ PENDING**

#### Tasks

| #     | Task                                   | Files to Create/Modify                          | Est. Time |
| ----- | -------------------------------------- | ----------------------------------------------- | --------- |
| 11.1  | Research and select AI provider        | Documentation                                   | 2 hours   |
| 11.2  | Set up AI API integration              | `src/lib/ai-client.ts`                          | 3 hours   |
| 11.3  | Create chat schema                     | `src/server/db/schema.ts`                       | 1 hour    |
| 11.4  | Create AI chat API                     | `src/app/api/ai-coach/route.ts`                 | 4 hours   |
| 11.5  | Create chat UI component               | `src/components/ai-coach-chat.tsx`              | 4 hours   |
| 11.6  | Add context awareness to AI            | `src/lib/ai-context.ts`                         | 3 hours   |
| 11.7  | Implement voice input                  | `src/components/voice-input.tsx`                | 3 hours   |
| 11.8  | Add food logging via chat              | `src/lib/ai-food-parser.ts`                     | 4 hours   |
| 11.9  | Add personalized recommendations       | `src/lib/ai-recommendations.ts`                 | 3 hours   |
| 11.10 | Create chat history view               | `src/app/(dashboard)/ai-coach/page.tsx`         | 2 hours   |
| 11.11 | Add micronutrient schema               | `src/server/db/schema.ts`                       | 2 hours   |
| 11.12 | Extend Nutritionix with micronutrients | `src/lib/nutritionix.ts`                        | 2 hours   |
| 11.13 | Create micronutrient tracking API      | `src/app/api/micronutrients/route.ts`           | 2 hours   |
| 11.14 | Add micronutrient dashboard            | `src/components/charts/micronutrient-chart.tsx` | 3 hours   |
| 11.15 | Add vitamin and mineral goals          | `src/app/(dashboard)/goals/page.tsx`            | 2 hours   |
| 11.16 | Create meal timing schema              | `src/server/db/schema.ts`                       | 1 hour    |
| 11.17 | Add meal timing analytics API          | `src/app/api/analytics/meal-timing/route.ts`    | 2 hours   |
| 11.18 | Create meal timing charts              | `src/components/charts/meal-timing-chart.tsx`   | 3 hours   |
| 11.19 | Add habit tracking schema              | `src/server/db/schema.ts`                       | 1 hour    |
| 11.20 | Create habit tracking API              | `src/app/api/habits/route.ts`                   | 2 hours   |
| 11.21 | Create daily check-in UI               | `src/components/daily-checkin.tsx`              | 3 hours   |
| 11.22 | Add streak tracking                    | `src/lib/streak-tracker.ts`                     | 2 hours   |
| 11.23 | Write E2E tests for AI and analytics   | `e2e/phase-11-ai-advanced-analytics.spec.ts`    | 3 hours   |

#### Deliverables

- [ ] AI nutrition coach chatbot
- [ ] Context-aware AI responses
- [ ] Voice input for chat
- [ ] Food logging via natural language
- [ ] Personalized nutrition recommendations
- [ ] Chat history management
- [ ] Micronutrient tracking (vitamins, minerals, fiber)
- [ ] Cholesterol and sodium tracking
- [ ] Micronutrient goal setting
- [ ] Meal timing analytics
- [ ] Meal timing pattern charts
- [ ] Habit tracking system
- [ ] Daily check-ins
- [ ] Streak tracking and visualization
- [ ] **E2E Tests**: `e2e/phase-11-ai-advanced-analytics.spec.ts`
  - [ ] User can chat with AI coach
  - [ ] AI provides relevant responses
  - [ ] User can log food via chat
  - [ ] AI parses food correctly
  - [ ] Voice input works
  - [ ] Micronutrients display correctly
  - [ ] User can set micronutrient goals
  - [ ] Meal timing analytics work
  - [ ] User can create habits
  - [ ] Daily check-ins record correctly
  - [ ] Streak tracking updates

---

### Phase 12: Multi-User & Integrations (Days 41-45)

**Priority: 🔵 LOW (Tier 3 - Future Enhancement)**
**Status: ⏳ PENDING**

#### Tasks

| #     | Task                                    | Files to Create/Modify                           | Est. Time |
| ----- | --------------------------------------- | ------------------------------------------------ | --------- |
| 12.1  | Add family account schema               | `src/server/db/schema.ts`                        | 2 hours   |
| 12.2  | Create family management API            | `src/app/api/family/route.ts`                    | 4 hours   |
| 12.3  | Create family invite system             | `src/components/family-invite.tsx`               | 3 hours   |
| 12.4  | Add family member management UI         | `src/app/(dashboard)/family/page.tsx`            | 4 hours   |
| 12.5  | Create family dashboard                 | `src/app/(dashboard)/family/dashboard/page.tsx`  | 3 hours   |
| 12.6  | Add family progress tracking            | `src/components/family-progress.tsx`             | 3 hours   |
| 12.7  | Research wearable APIs                  | Documentation                                    | 2 hours   |
| 12.8  | Add Garmin OAuth integration            | `src/lib/garmin-auth.ts`                         | 4 hours   |
| 12.9  | Create wearable sync schema             | `src/server/db/schema.ts`                        | 2 hours   |
| 12.10 | Create Garmin data sync API             | `src/app/api/integrations/garmin/route.ts`       | 4 hours   |
| 12.11 | Add step counter sync                   | `src/lib/garmin-steps.ts`                        | 2 hours   |
| 12.12 | Add sleep tracking sync                 | `src/lib/garmin-sleep.ts`                        | 2 hours   |
| 12.13 | Create integrations UI                  | `src/app/(dashboard)/integrations/page.tsx`      | 3 hours   |
| 12.14 | Add health metrics dashboard            | `src/components/charts/health-metrics-chart.tsx` | 3 hours   |
| 12.15 | Set up i18n framework                   | `package.json`, install `next-intl`              | 2 hours   |
| 12.16 | Create translation files                | `locales/en.json`, `locales/es.json`, etc.       | 4 hours   |
| 12.17 | Add language switcher                   | `src/components/language-switcher.tsx`           | 2 hours   |
| 12.18 | Translate all UI text                   | Multiple files                                   | 6 hours   |
| 12.19 | Create public API documentation         | `src/app/api-docs/page.tsx`                      | 3 hours   |
| 12.20 | Add API key generation                  | `src/app/api/api-keys/route.ts`                  | 3 hours   |
| 12.21 | Add rate limiting                       | `src/middleware/rate-limit.ts`                   | 2 hours   |
| 12.22 | Create API key management UI            | `src/app/(dashboard)/settings/api-keys/page.tsx` | 2 hours   |
| 12.23 | Document all public endpoints           | `docs/api.md`                                    | 4 hours   |
| 12.24 | Write E2E tests for multi-user features | `e2e/phase-12-multiuser-integrations.spec.ts`    | 3 hours   |

#### Deliverables

- [ ] Family account creation and management
- [ ] Family member invitations
- [ ] Family dashboard with combined stats
- [ ] Family progress tracking
- [ ] Garmin OAuth integration
- [ ] Step counter sync from Garmin
- [ ] Sleep tracking sync from Garmin
- [ ] Health metrics visualization
- [ ] Integration management UI
- [ ] Multi-language support (i18n)
- [ ] Language switcher component
- [ ] Translations for major languages
- [ ] Public REST API documentation
- [ ] API key generation and management
- [ ] API rate limiting
- [ ] Developer documentation
- [ ] **E2E Tests**: `e2e/phase-12-multiuser-integrations.spec.ts`
  - [ ] User can create family account
  - [ ] User can invite family members
  - [ ] Family dashboard displays correctly
  - [ ] User can connect Garmin account
  - [ ] Step data syncs correctly
  - [ ] Sleep data syncs correctly
  - [ ] User can change language
  - [ ] Translations display correctly
  - [ ] User can generate API key
  - [ ] API endpoints work with key
  - [ ] Rate limiting functions correctly

---

## 📁 File Structure (Current State)

```
nutrition-app/
├── docker-compose.yml                    # ✅ Created
├── playwright.config.ts                  # ✅ Created
├── drizzle/                              # EXISTS: Migrations
├── e2e/                                  # ✅ Created
│   ├── fixtures/
│   │   └── test-data.ts                  # ✅ Created
│   ├── pages/
│   │   ├── login.page.ts                 # ✅ Created
│   │   ├── signup.page.ts                # ✅ Created
│   │   ├── dashboard.page.ts             # ✅ Created
│   │   ├── food-log.page.ts              # ✅ Created
│   │   └── goals.page.ts                 # ✅ Created
│   ├── phase-1-auth.spec.ts              # ✅ Created
│   ├── phase-2-food-logging.spec.ts      # ✅ Created - All passing
│   ├── phase-3-dashboard.spec.ts         # ✅ Created - All passing
│   ├── phase-4-goals.spec.ts             # Pending
│   ├── phase-5-advanced.spec.ts          # Pending
│   ├── phase-6-professional.spec.ts      # Pending
│   └── global-setup.ts                   # Pending
├── src/
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx        # ✅ EXISTS - Real data + Charts
│   │   │   ├── food-log/page.tsx         # ✅ EXISTS - Real CRUD
│   │   │   ├── goals/page.tsx            # ✅ EXISTS - Real CRUD
│   │   │   ├── foods/
│   │   │   │   ├── search/page.tsx       # ✅ EXISTS
│   │   │   │   └── custom/page.tsx       # Pending
│   │   │   ├── meal-templates/page.tsx   # Pending
│   │   │   ├── diet-plans/page.tsx       # Pending
│   │   │   └── professional/             # Pending
│   │   ├── api/
│   │   │   ├── auth/[...all]/route.ts    # ✅ Updated
│   │   │   ├── foods/                    # ✅ EXISTS
│   │   │   ├── food-logs/route.ts        # ✅ EXISTS - Real DB
│   │   │   ├── goals/                    # ✅ EXISTS - Real DB
│   │   │   ├── analytics/                # ✅ EXISTS - Daily & Weekly endpoints
│   │   │   ├── meal-templates/           # Pending
│   │   │   ├── diet-plans/               # Pending
│   │   │   ├── water/                    # Pending
│   │   │   └── professional/             # Pending
│   │   ├── login/page.tsx                # ✅ Updated with Google OAuth
│   │   └── signup/page.tsx               # ✅ Updated with Google OAuth
│   ├── components/
│   │   ├── ui/                           # EXISTS: Shadcn
│   │   ├── food-search.tsx               # ✅ EXISTS
│   │   └── charts/                       # ✅ EXISTS - 3 chart components
│   ├── hooks/                            # ✅ EXISTS - 3 data hooks
│   ├── stores/                           # Pending
│   ├── lib/
│   │   ├── auth.ts                       # ✅ Updated with DB + OAuth
│   │   ├── auth-client.ts                # ✅ Created
│   │   ├── nutritionix.ts                # EXISTS
│   │   ├── session.ts                    # EXISTS
│   │   └── utils.ts                      # EXISTS
│   ├── server/db/
│   │   ├── schema.ts                     # ✅ Updated for Better Auth
│   │   └── index.ts                      # EXISTS
│   └── types/
│       └── nutritionix.ts                # EXISTS
```

---

## 🔧 Environment Variables Required

```env
# Database (Local Docker PostgreSQL)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/nutrition_app"

# Nutritionix API (User has credentials)
NUTRITIONIX_APP_ID="your_actual_app_id"
NUTRITIONIX_API_KEY="your_actual_api_key"

# Better Auth
BETTER_AUTH_SECRET="nutrition-app-secret-change-in-production-abc123"
BETTER_AUTH_URL="http://localhost:3000"

# Google OAuth (get from Google Cloud Console)
GOOGLE_CLIENT_ID="your_google_client_id"
GOOGLE_CLIENT_SECRET="your_google_client_secret"

# App Settings
NODE_ENV="development"

# Playwright
PLAYWRIGHT_TEST_BASE_URL="http://localhost:3000"
```

---

## 🐳 Docker Setup for PostgreSQL

```yaml
# docker-compose.yml
version: '3.8'
services:
  postgres:
    image: postgres:16-alpine
    container_name: nutrition_db
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: nutrition_app
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
```

---

## 📋 Quick Start Commands

```bash
# 1. Start PostgreSQL
docker compose up -d

# 2. Push schema to database
npm run db:push

# 3. (Optional) Open Drizzle Studio
npm run db:studio

# 4. Start development server
npm run dev

# 5. Run Playwright tests
npm run test:e2e

# 6. Run specific phase tests
npx playwright test e2e/phase-1-auth.spec.ts
```

---

## 📊 Timeline Summary

| Week | Days  | Focus                      | Key Deliverables                    | Tests                              | Status  |
| ---- | ----- | -------------------------- | ----------------------------------- | ---------------------------------- | ------- |
| 1    | 1-3   | Core Infrastructure        | Database, Auth                      | `phase-1-auth`                     | ✅ DONE |
| 1    | 4-5   | Food Logging               | Food CRUD, Daily Totals             | `phase-2-food-logging`             | ✅ DONE |
| 2    | 6-9   | Dashboard & Charts         | Charts, Analytics                   | `phase-3-dashboard`                | ✅ DONE |
| 2    | 10-12 | Goals System               | Goal CRUD, Calculator               | `phase-4-goals`                    | Pending |
| 3    | 13-17 | Advanced Features          | Custom Foods, Templates             | `phase-5-advanced`                 | Pending |
| 3    | 18-19 | Professional               | Client Management                   | `phase-6-professional`             | Pending |
| 3    | 20-21 | Polish                     | Mobile, A11y, Performance           | regression, a11y                   | Pending |
| 4    | 22-26 | Recipes & Body Tracking    | Recipes, Weight, Photos             | `phase-8-recipes-body-tracking`    | Pending |
| 5    | 27-30 | Barcode & Data Portability | Scanner, Image AI, Export/Import    | `phase-9-barcode-data-portability` | Pending |
| 6    | 31-35 | Organization & Offline     | Tags, Offline Mode, Exercise        | `phase-10-organization-offline`    | Pending |
| 7    | 36-40 | AI Coach & Analytics       | AI Chatbot, Micronutrients, Habits  | `phase-11-ai-advanced-analytics`   | Pending |
| 8    | 41-45 | Multi-User & Integrations  | Family, Wearables, i18n, Public API | `phase-12-multiuser-integrations`  | Pending |

---

## ✅ Definition of Done

A feature is considered "done" when:

1. ✅ Code is written and type-safe
2. ✅ Works with real database data
3. ✅ Has proper error handling
4. ✅ Is mobile responsive
5. ✅ Has loading states
6. ✅ Has been manually tested
7. ✅ **Playwright E2E tests pass**

---

## 🧪 Running Tests

```bash
# Install Playwright browsers (first time)
npx playwright install

# Run all E2E tests
npm run test:e2e

# Run tests for specific phase
npx playwright test e2e/phase-1-auth.spec.ts

# Run tests with UI
npm run test:e2e:ui

# Run tests in headed mode (see browser)
npm run test:e2e:headed

# Generate test report
npx playwright show-report
```

## COMMANDS

```
✅ COMPLETED: Search for any other repositories for nutrition tracking features for individuals and dietitians and find the unique features they offer.
✅ COMPLETED: Please compare these features to our project. Which would be new?
✅ COMPLETED: Add the NEW Features to my MASTER_IMPLEMENTATION_PLAN as new phases after the phase 7
📋 NEXT: Create GitHub issues for these in my repository.
```

---

## 🎯 Next Steps

### Immediate (Current Focus)

1. **Complete Phase 4: Goals System** (Days 10-12)
   - Implement CRUD operations for nutrition goals
   - Add BMR/TDEE calculator
   - Create goal templates and wizard

### Short-term (Next 2 Weeks)

1. **Phase 5: Advanced Features** (Days 13-17)
   - Custom food creation and management
   - Meal templates system
   - Diet plan wizard
   - Water intake tracking

2. **Phase 6: Professional Features** (Days 18-19)
   - Professional verification
   - Client management system

3. **Phase 7: Polish & Testing** (Days 20-21)
   - Mobile optimization
   - Performance and accessibility testing

### Medium-term (Weeks 4-5) - High Priority Enhancements

1. **Phase 8: Recipe Management & Body Tracking** (Days 22-26)
   - Full recipe builder with nutrition calculation
   - Body weight and measurements tracking
   - Progress photos gallery

2. **Phase 9: Barcode Scanner & Data Portability** (Days 27-30)
   - Barcode scanner for quick food entry
   - AI-powered image food recognition
   - Complete data export/import system

### Long-term (Weeks 6-8) - Feature Expansion

1. **Phase 10: Enhanced Organization & Offline Support** (Days 31-35)
   - Tags and categories system
   - Offline mode with sync
   - Exercise tracking integration

2. **Phase 11: AI Coach & Advanced Analytics** (Days 36-40)
   - AI nutrition chatbot
   - Micronutrient tracking
   - Habit tracking and streaks

3. **Phase 12: Multi-User & Integrations** (Days 41-45)
   - Family accounts
   - Wearable device integrations (Garmin)
   - Multi-language support
   - Public REST API

### Success Metrics

- ✅ All E2E tests passing for each phase
- ✅ Mobile responsive on all features
- ✅ Performance: Page loads < 2 seconds
- ✅ Accessibility: WCAG 2.1 AA compliance
- ✅ Code coverage > 80%
- ✅ Zero critical security vulnerabilities

### Technical Debt Management

- Refactor components as complexity grows
- Document all APIs and complex logic
- Regular dependency updates
- Security audits after major features

---

## 💡 Future Considerations (Post-Phase 12)

### Potential Future Phases

- **Phase 13**: Social Features (meal sharing, community recipes)
- **Phase 14**: Advanced Reporting (PDF reports, doctor sharing)
- **Phase 15**: Marketplace (recipe marketplace, professional services)
- **Phase 16**: IoT Integrations (smart scales, smart watches beyond Garmin)
- **Phase 17**: Machine Learning (personalized recommendations, pattern recognition)

### Technology Upgrades

- Consider React Server Components optimization
- Evaluate edge functions for better performance
- Explore WebAssembly for complex calculations
- Consider GraphQL for more flexible API queries
