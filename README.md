# Nutrition App

## Getting Started

To get started, follow these steps:

### Database Setup

Make sure you have a PostgreSQL database set up in docker

```bash
docker run --name nutrition_app -e POSTGRES_PASSWORD=password -e POSTGRES_USER=password -e POSTGRES_DB=nutrition_app -p 5432:5432 -d postgres
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
npx drizzle-kit generate:migration
npx drizzle-kit migrate:up
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.
