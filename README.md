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

## Drizzle Commands

To create the database tables, run:

```bash
npx drizzle-kit generate
npx drizzle-kit migrate
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
