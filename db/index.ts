import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function createPrismaClient() {
  // Replace sslmode=require (and similar) with verify-full to silence
  // pg v8 deprecation warning — the behavior is identical today but
  // require will weaken in pg v9.
  const connectionString = (process.env.DATABASE_URL ?? "").replace(
    /sslmode=(prefer|require|verify-ca)\b/,
    "sslmode=verify-full",
  );
  const pool = new Pool({
    connectionString,
    ssl: true,
  });
  const adapter = new PrismaPg(pool);
  return new PrismaClient({ adapter });
}

export const prisma = globalForPrisma.prisma ?? createPrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
