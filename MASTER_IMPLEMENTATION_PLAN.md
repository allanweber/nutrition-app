# Nutrition App - Consolidated Implementation Plan

> **Last Updated**: 2026-01-19  
> **Version**: 4.0  
> **Status**: Phase 3 Complete - Ready for Phase 4  
> **Database**: Local PostgreSQL (Docker)  
> **Auth**: Email/Password + Google OAuth  
> **API**: Nutritionix (credentials ready)  
> **Testing**: Playwright E2E tests per phase

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

| #   | Task                              | Files to Create/Modify                   | Est. Time |
| --- | --------------------------------- | ---------------------------------------- | --------- |
| 4.1 | Create goals CRUD API             | `src/app/api/goals/route.ts`             | 2 hours   |
| 4.2 | Create goal calculator (BMR/TDEE) | `src/app/api/goals/calculate/route.ts`   | 2 hours   |
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

| Week | Days  | Focus               | Key Deliverables          | Tests                  | Status  |
| ---- | ----- | ------------------- | ------------------------- | ---------------------- | ------- |
| 1    | 1-3   | Core Infrastructure | Database, Auth            | `phase-1-auth`         | ✅ DONE |
| 1    | 4-5   | Food Logging        | Food CRUD, Daily Totals   | `phase-2-food-logging` | ✅ DONE |
| 2    | 6-9   | Dashboard & Charts  | Charts, Analytics         | `phase-3-dashboard`    | ✅ DONE |
| 2    | 10-12 | Goals System        | Goal CRUD, Calculator     | `phase-4-goals`        | Pending |
| 3    | 13-17 | Advanced Features   | Custom Foods, Templates   | `phase-5-advanced`     | Pending |
| 3    | 18-19 | Professional        | Client Management         | `phase-6-professional` | Pending |
| 3    | 20-21 | Polish              | Mobile, A11y, Performance | regression, a11y       | Pending |

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

---

## 🎯 Next Steps

...
