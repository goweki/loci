import "dotenv/config";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execFileAsync = promisify(execFile);

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("❌ DATABASE_URL environment variable is missing.");
  }

  // -----------------------------------------------------
  // Configure PostgreSQL SSL
  // -----------------------------------------------------

  const databaseUrl = new URL(dbUrl);

  /**
   * Keep full TLS certificate and hostname verification.
   *
   * sslrootcert=system tells libpq/pg_dump to use the
   * operating system's trusted CA certificates instead of
   * expecting ~/.postgresql/root.crt.
   */
  databaseUrl.searchParams.set("sslmode", "verify-full");
  databaseUrl.searchParams.set("sslrootcert", "system");

  // Create dumps directory if it doesn't exist
  const dumpDir = path.join(__dirname, "./dumps");

  fs.mkdirSync(dumpDir, {
    recursive: true,
  });

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const outputPath = path.join(dumpDir, `backup-${timestamp}.sql`);

  console.log("📦 Starting database dump...");
  console.log(`📁 Output: ${outputPath}`);

  try {
    await execFileAsync("pg_dump", [
      databaseUrl.toString(),
      "-F",
      "p",
      "-f",
      outputPath,
    ]);

    console.log("\n✅ Database dump created successfully!");
    console.log(`📁 File saved to: ${outputPath}`);
  } catch (error) {
    console.error("\n❌ Error creating database dump:");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
