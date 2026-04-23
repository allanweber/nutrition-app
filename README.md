# Vitalis

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
- `EMAIL_FROM` (e.g. `Vitalis <no-reply@yourdomain.com>`)

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

# Or run a specific test file with optional grep
./scripts/run-e2e.sh --headed e2e/phase-1-auth.spec.ts -g "user can logout"
```

**Requirements:**

- Docker must be running
- Port 5434 must be available (test database)

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

## Delete merged branches

```bash
# local branches
git branch --merged main | grep -v "main" | xargs git branch -d

# remote branches
git branch -r --merged main | grep -v "main" | sed 's/origin\///' | xargs -I {} git push origin --delete {}
```

## Cloudflare Tunnel with Dokploy

Follow **[Cloudflare Tunnels](https://docs.dokploy.com/docs/core/guides/cloudflare-tunnels)** (official). Short version:

1. **Cloudflare** → Zero Trust → **Networks** → **Connectors** → **Create tunnel** → **Cloudflared** → copy **`TUNNEL_TOKEN`**.
2. **SSL/TLS** in Cloudflare: use **Full** or **Full (strict)** — the doc says **avoid Flexible** (redirect loops with Traefik).
3. In **Dokploy**, create an **Application** with Docker image **`cloudflare/cloudflared`**; env **`TUNNEL_TOKEN`**; **Advanced → Arguments**: `tunnel` then `run` (see guide).
4. **Published routes / public hostname** in Cloudflare:
   - **Recommended:** route to **Traefik** so **all** Dokploy apps share one tunnel: **HTTP** service URL **`dokploy-traefik:80`** (exact hostname from guide — this reaches Traefik inside the swarm).
   - **Wildcard subdomains:** DNS **CNAME** `*` → `YOUR_TUNNEL_ID.cfargotunnel.com` (proxied), and one tunnel hostname to **`dokploy-traefik:80`** so `invest.allanweber.dev` and future subdomains work without new tunnel entries.
5. For **your app** in Dokploy → **Domains**: add **`invest.allanweber.dev`** with the **correct container port**; with tunnel + Traefik, the doc recommends **HTTPS off** and **no Let’s Encrypt** on that domain in Dokploy so Cloudflare terminates TLS at the edge (see guide — conflicts otherwise).
6. **Better Auth / OAuth:** if cookies or redirects break, you may need **Full (strict)** plus a **trusted origin certificate** on Traefik — same class of issue as Coolify’s [Full TLS](https://coolify.io/docs/integrations/cloudflare/tunnels/full-tls); plan extra time to tune SSL mode and app `BETTER_AUTH_URL`.