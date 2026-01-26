# Nutrition App

## Getting Started

To get started, follow these steps:

### Database Setup

Make sure you have a PostgreSQL database set up in docker

```bash
docker run --name nutrition_app -e POSTGRES_PASSWORD=postgres -e POSTGRES_USER=postgres -e POSTGRES_DB=nutrition_app -p 5432:5432 -d postgres
```

or user the provided `docker-compose.yml`

```bash
docker-compose up -d
```

### Install dependencies

First, install the dependencies:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### Run the development server

Then, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

### Environment variables

Copy `.env.example` to `.env.local` and fill in required values.

At minimum, you will need:

- `DATABASE_URL`
- `BETTER_AUTH_URL`
- `BETTER_AUTH_SECRET`
- `NUTRITIONIX_APP_ID`
- `NUTRITIONIX_API_KEY`
- `GOOGLE_CLIENT_ID` (optional if you don't use Google sign-in)
- `GOOGLE_CLIENT_SECRET` (optional if you don't use Google sign-in)
- `RESEND_API_KEY` (required for email verification/password reset emails)
- `EMAIL_FROM` (e.g. `Nutrition App <no-reply@yourdomain.com>`)

## Drizzle Commands

To create the database tables, run:

```bash
npx drizzle-kit generate
npx drizzle-kit push
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Seed Data

To populate the database with sample data for testing, run the seed script. **Note:** The dev server must be running for this to work.

```bash
# In one terminal
npm run dev

# In another terminal
npm run db:seed
```

### Test Accounts

All test accounts use the password: `Password123!`

#### Individual Users (one per goal type)

| Email                           | Name                 | Goal           |
| ------------------------------- | -------------------- | -------------- |
| <user.weight-loss@example.com>    | Alex Weight Loss     | weight_loss    |
| <user.maintenance@example.com>    | Jordan Maintenance   | maintenance    |
| <user.weight-gain@example.com>    | Sam Weight Gain      | weight_gain    |
| <user.muscle-gain@example.com>    | Chris Muscle Gain    | muscle_gain    |
| <user.fat-loss@example.com>       | Taylor Fat Loss      | fat_loss       |
| <user.performance@example.com>    | Morgan Performance   | performance    |
| <user.general-health@example.com> | Casey General Health | general_health |

#### Professional Users

| Email                         | Name              |
| ----------------------------- | ----------------- |
| <dr.sarah.wilson@example.com>   | Dr. Sarah Wilson  |
| <mark.nutritionist@example.com> | Mark Thompson, RD |

The seed creates:

- 15 sample foods (fruits, proteins, grains, etc.)
- 7 individual users with nutrition goals and 14 days of food logs each
- 2 professional users (dietitians)

## Running E2E Tests

E2E tests run with an isolated Docker database that is created fresh for each test run:

```bash
npm run test:e2e          # Full run with Docker DB lifecycle
npm run test:e2e:ui       # With Playwright UI
npm run test:e2e:headed   # In headed browser mode
```

**Requirements:**

- Docker must be running
- Port 5433 must be available (test database)

The test runner automatically:

1. Starts a fresh PostgreSQL container
2. Runs migrations and seeds test data
3. Runs Playwright tests
4. Cleans up the container on exit

Tests use the seeded accounts listed above for predictable test data.

## Databases and apis that contain nutrition information

USDA FoodData Central - Free government database and api for nutrition information on a variety of branded and basic foods.
OpenFoodFacts - Free crowdsourced database of food products.
ESHA - Nutrition database API.
Zestful - API to turn plain recipe strings into structured JSON.
Spoonacular - Nutrition and recipe API.
Edamam - Nutrition database and API.
FatSecret - Nutrition database and API.
NutritionX - Nutrition database and API.
Samsung Food Recipe Nutrition Calculator - Nutrition calculator for recipes.
Documenu - Restaurant menu API.
TheMealDB - Small meal and recipe database and API.

## Speckit flow

1. specify
2. clarify
3. plan
4. checklist
5. tasks
6. analyze
7. implement
