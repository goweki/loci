import dotenv from "dotenv";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

dotenv.config({ path: ".env.production" });

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

  if (
    databaseUrl.hostname === "localhost" ||
    databaseUrl.hostname === "127.0.0.1"
  ) {
    databaseUrl.searchParams.set("sslmode", "disable");
  } else {
    databaseUrl.searchParams.set("sslmode", "require");
    databaseUrl.searchParams.delete("sslrootcert");
  }

  // -----------------------------------------------------
  // Log safe database identity
  // -----------------------------------------------------

  console.log("🎯 Database:");
  console.log(`   Host:     ${databaseUrl.hostname}`);
  console.log(`   Port:     ${databaseUrl.port || "5432"}`);
  console.log(`   Database: ${databaseUrl.pathname.slice(1)}`);
  console.log(`   User:     ${databaseUrl.username}`);

  // -----------------------------------------------------
  // Create dumps directory
  // -----------------------------------------------------

  const dumpDir = path.join(import.meta.dirname, "dumps");

  fs.mkdirSync(dumpDir, {
    recursive: true,
  });

  // -----------------------------------------------------
  // Generate backup filename
  // -----------------------------------------------------

  const databaseName =
    decodeURIComponent(databaseUrl.pathname.slice(1)) || "unknown-db";

  const dbIdentifier = sanitizeFilename(
    `${databaseUrl.hostname.split(".")[0]}-${databaseName}`,
  );

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const outputPath = path.join(
    dumpDir,
    `backup-${dbIdentifier}-${timestamp}.sql`,
  );

  console.log("📦 Starting database dump...");
  console.log(`📁 Output: ${outputPath}`);

  // -----------------------------------------------------
  // Run pg_dump
  // -----------------------------------------------------

  try {
    await execFileAsync("pg_dump", [
      databaseUrl.toString(),

      // Plain SQL format
      "-F",
      "p",

      // Do not include object ownership statements.
      // This makes the dump portable across databases
      // with different PostgreSQL roles.
      "--no-owner",

      // Do not include GRANT/REVOKE privilege statements.
      // The restoring user will own the restored objects.
      "--no-privileges",

      // Output file
      "-f",
      outputPath,
    ]);

    // ---------------------------------------------------
    // Verify dump
    // ---------------------------------------------------

    if (!fs.existsSync(outputPath)) {
      throw new Error("pg_dump completed but the backup file was not created.");
    }

    const stats = fs.statSync(outputPath);

    console.log("\n✅ Database dump created successfully!");
    console.log(`📁 File: ${outputPath}`);
    console.log(`📦 Size: ${formatBytes(stats.size)}`);
    console.log("🔐 Ownership: excluded");
    console.log("🔑 Privileges: excluded");
  } catch (error) {
    console.error("\n❌ Error creating database dump:");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    // Remove incomplete dump
    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
        console.log("🧹 Removed incomplete backup file.");
      } catch {
        console.warn("⚠️ Could not remove incomplete backup file.");
      }
    }

    throw error;
  }
}

function formatBytes(bytes: number): string {
  if (bytes === 0) {
    return "0 Bytes";
  }

  const units = ["Bytes", "KB", "MB", "GB", "TB"];

  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return `${(bytes / Math.pow(1024, index)).toFixed(2)} ${units[index]}`;
}

function sanitizeFilename(value: string): string {
  return value
    .replace(/[^a-zA-Z0-9_-]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .toLowerCase();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
