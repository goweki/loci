import "dotenv/config";
import { defineConfig, env } from "prisma/config";

export default defineConfig({
  schema: "src/lib/prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
  migrations: {
    path: "src/lib/prisma/migrations",
    seed: 'ts-node --compiler-options {"module":"CommonJS"} src/lib/prisma/seed.ts',
  },
  views: {
    path: "src/lib/prisma/views",
  },
  typedSql: {
    path: "src/lib/prisma/queries",
  },
});
