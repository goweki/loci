// // lib/prisma.index.ts

// import "dotenv/config";
// import { PrismaPg } from "@prisma/adapter-pg";
// import { PrismaClient } from "./generated";
// const connectionString = `${process.env.DATABASE_URL}`;
// const adapter = new PrismaPg({ connectionString });

// const globalForPrisma = globalThis as unknown as {
//   prisma: PrismaClient | undefined;
// };

// export const prisma =
//   globalForPrisma.prisma ??
//   new PrismaClient({ adapter, log: ["error", "warn"] });

// if (
//   process.env.VERCEL_ENV !== "production" &&
//   process.env.NODE_ENV !== "production"
// )
//   globalForPrisma.prisma = prisma;

// export default prisma;

// lib/prisma.index.ts

import "dotenv/config";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "./generated";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
  pool: Pool | undefined;
};

const connectionString = `${process.env.DATABASE_URL}`;

// 1. Create or reuse pg Pool for concurrent connections
const pool = globalForPrisma.pool ?? new Pool({ connectionString });

// 2. Pass pool instance into PrismaPg adapter
const adapter = new PrismaPg(pool);

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({ adapter, log: ["error", "warn"] });

// 3. Preserve pool and client singletons during Next.js Hot Module Replacement
if (
  process.env.VERCEL_ENV !== "production" &&
  process.env.NODE_ENV !== "production"
) {
  globalForPrisma.prisma = prisma;
  globalForPrisma.pool = pool;
}

export default prisma;
