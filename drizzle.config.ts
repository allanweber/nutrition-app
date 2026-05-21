import { defineConfig } from 'drizzle-kit';
import { config } from 'dotenv';

// Prefer env already provided by the runner (e.g. dotenv-cli in E2E).
// Only fall back to `.env.local` for local dev convenience.
if (!process.env.DATABASE_URL) {
  config({ path: '.env.local' });
}

export default defineConfig({
  schema: './src/server/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: process.env.DRIZZLE_VERBOSE === 'true',
  // `strict: true` forces an interactive confirmation prompt, which breaks CI/E2E runners.
  // Default to strict locally, but allow disabling via env.
  strict: process.env.DRIZZLE_STRICT ? process.env.DRIZZLE_STRICT === 'true' : true,
});