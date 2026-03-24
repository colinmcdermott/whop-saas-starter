// Auto-push Prisma schema to database during build (if DATABASE_URL is set).
// This ensures the database tables exist on first deploy without manual steps.
import { execSync } from "node:child_process";

const databaseUrl = process.env.DATABASE_URL || process.env.NILEDB_POSTGRES_URL;

if (databaseUrl) {
  console.log("Pushing database schema...");
  execSync(`prisma db push --schema db/schema.prisma --url "${databaseUrl}"`, {
    stdio: "inherit",
  });
} else {
  console.log("Skipping db push: DATABASE_URL not set");
}
