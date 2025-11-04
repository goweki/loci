import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "src/lib/prisma/schema.prisma",
  migrations: {
    path: "src/lib/prisma/migrations",
    seed: 'ts-node --compiler-options {"module":"CommonJS"} src/lib/prisma/seed.ts',
    "seed:clean":
      'ts-node --compiler-options {"module":"CommonJS"} src/lib/prisma/seed-clean.ts',
  },
  views: {
    path: "src/lib/prisma/views",
  },
  typedSql: {
    path: "src/lib/prisma/queries",
  },
});
