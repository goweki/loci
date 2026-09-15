import dotenv from "dotenv";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import readline from "readline";

const execFileAsync = promisify(execFile);

// -----------------------------------------------------
// Environment
// -----------------------------------------------------
//
// Live database:
//   .env.production -> DATABASE_URL
//
// Local database:
//   .env.local      -> DATABASE_URL
//
// -----------------------------------------------------

const productionEnv: Record<string, string> = {};
const localEnv: Record<string, string> = {};

dotenv.config({
  path: ".env.production",
  processEnv: productionEnv,
});

dotenv.config({
  path: ".env.local",
  processEnv: localEnv,
});

const LIVE_DATABASE_URL = productionEnv.DATABASE_URL;
const LOCAL_DATABASE_URL = localEnv.DATABASE_URL;

type DatabaseInfo = {
  url: URL;
  name: string;
  host: string;
  port: string;
  user: string;
  sslmode: string;
};

// -----------------------------------------------------
// Helpers
// -----------------------------------------------------

function configureDatabaseUrl(connectionString: string): URL {
  const databaseUrl = new URL(connectionString);

  const isLocal =
    databaseUrl.hostname === "localhost" ||
    databaseUrl.hostname === "127.0.0.1" ||
    databaseUrl.hostname === "::1";

  if (isLocal) {
    databaseUrl.searchParams.set("sslmode", "disable");
  } else {
    databaseUrl.searchParams.set("sslmode", "require");
    databaseUrl.searchParams.delete("sslrootcert");
  }

  return databaseUrl;
}

function getDatabaseInfo(connectionString: string): DatabaseInfo {
  const url = configureDatabaseUrl(connectionString);

  return {
    url,
    name: decodeURIComponent(url.pathname.slice(1)) || "unknown-db",
    host: url.hostname,
    port: url.port || "5432",
    user: decodeURIComponent(url.username),
    sslmode: url.searchParams.get("sslmode") || "default",
  };
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

function ask(question: string): Promise<string> {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

// -----------------------------------------------------
// Validate environment
// -----------------------------------------------------

function validateEnvironment() {
  console.log("\n🔎 Checking environment...");

  if (!LIVE_DATABASE_URL) {
    throw new Error("❌ DATABASE_URL is missing from .env.production");
  }

  if (!LOCAL_DATABASE_URL) {
    throw new Error("❌ DATABASE_URL is missing from .env.local");
  }

  console.log("   ✓ .env.production DATABASE_URL found");
  console.log("   ✓ .env.local DATABASE_URL found");
}

// -----------------------------------------------------
// Create dump directory
// -----------------------------------------------------

function createDumpDirectory(): string {
  const dumpDir = path.join(import.meta.dirname, "dumps");

  fs.mkdirSync(dumpDir, {
    recursive: true,
  });

  return dumpDir;
}

// -----------------------------------------------------
// Dump live database
// -----------------------------------------------------

async function dumpLiveDatabase(
  live: DatabaseInfo,
  dumpDir: string,
): Promise<string> {
  console.log("\n");
  console.log("════════════════════════════════════════════════════");
  console.log("📦 STEP 1/3 — DUMP LIVE DATABASE");
  console.log("════════════════════════════════════════════════════");

  console.log("\n🎯 Source database:");
  console.log(`   Host:     ${live.host}`);
  console.log(`   Port:     ${live.port}`);
  console.log(`   Database: ${live.name}`);
  console.log(`   User:     ${live.user}`);
  console.log(`   SSL:      ${live.sslmode}`);

  const dbIdentifier = sanitizeFilename(
    `${live.host.split(".")[0]}-${live.name}`,
  );

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");

  const outputPath = path.join(
    dumpDir,
    `backup-${dbIdentifier}-${timestamp}.sql`,
  );

  console.log(`\n📁 Dump file: ${outputPath}`);

  console.log("\n⏳ Running pg_dump...");

  try {
    await execFileAsync("pg_dump", [
      live.url.toString(),

      // Plain SQL
      "--format=plain",

      // Make dump portable between PostgreSQL installations.
      "--no-owner",
      "--no-privileges",

      // Output
      "--file",
      outputPath,
    ]);

    if (!fs.existsSync(outputPath)) {
      throw new Error("pg_dump completed but no dump file was created.");
    }

    const stats = fs.statSync(outputPath);

    console.log("\n✅ Live database dump completed!");
    console.log(`   📁 File: ${outputPath}`);
    console.log(`   📦 Size: ${formatBytes(stats.size)}`);
    console.log("   🔐 Ownership excluded");
    console.log("   🔑 Privileges excluded");

    return outputPath;
  } catch (error) {
    console.error("\n❌ Live database dump failed.");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    if (fs.existsSync(outputPath)) {
      try {
        fs.unlinkSync(outputPath);
        console.log("🧹 Removed incomplete dump.");
      } catch {
        console.warn("⚠️ Could not remove incomplete dump.");
      }
    }

    throw error;
  }
}

// -----------------------------------------------------
// Clear local database
// -----------------------------------------------------

async function clearLocalDatabase(local: DatabaseInfo) {
  console.log("\n");
  console.log("════════════════════════════════════════════════════");
  console.log("🧹 STEP 2/3 — CLEAR LOCAL DATABASE");
  console.log("════════════════════════════════════════════════════");

  console.log("\n🎯 Target database:");
  console.log(`   Host:     ${local.host}`);
  console.log(`   Port:     ${local.port}`);
  console.log(`   Database: ${local.name}`);
  console.log(`   User:     ${local.user}`);
  console.log(`   SSL:      ${local.sslmode}`);

  console.log("\n🗑️ Dropping public schema...");
  console.log("   This removes:");
  console.log("   • Tables");
  console.log("   • Data");
  console.log("   • Enums");
  console.log("   • Sequences");
  console.log("   • Indexes");
  console.log("   • Foreign keys");
  console.log("   • Views");
  console.log("   • Functions");
  console.log("   • Other objects in public");

  try {
    await execFileAsync("psql", [
      local.url.toString(),
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      "DROP SCHEMA IF EXISTS public CASCADE;",
    ]);

    console.log("   ✓ Public schema dropped.");

    console.log("\n🏗️ Recreating public schema...");

    await execFileAsync("psql", [
      local.url.toString(),
      "-v",
      "ON_ERROR_STOP=1",
      "-c",
      "CREATE SCHEMA public;",
    ]);

    console.log("   ✓ Public schema recreated.");
  } catch (error) {
    console.error("\n❌ Failed to clear local database.");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    throw error;
  }
}

// -----------------------------------------------------
// Restore dump into local database
// -----------------------------------------------------

async function restoreLocalDatabase(local: DatabaseInfo, dumpPath: string) {
  console.log("\n");
  console.log("════════════════════════════════════════════════════");
  console.log("📥 STEP 3/3 — RESTORE INTO LOCAL DATABASE");
  console.log("════════════════════════════════════════════════════");

  const stats = fs.statSync(dumpPath);

  console.log("\n📁 Source dump:");
  console.log(`   ${dumpPath}`);
  console.log(`   Size: ${formatBytes(stats.size)}`);

  console.log("\n🎯 Target:");
  console.log(`   Host:     ${local.host}`);
  console.log(`   Port:     ${local.port}`);
  console.log(`   Database: ${local.name}`);
  console.log(`   User:     ${local.user}`);
  console.log(`   SSL:      ${local.sslmode}`);

  console.log("\n⏳ Running psql restore...");

  try {
    await execFileAsync("psql", [
      local.url.toString(),

      // Stop immediately if any SQL statement fails.
      "-v",
      "ON_ERROR_STOP=1",

      // Restore dump.
      "-f",
      dumpPath,
    ]);

    console.log("\n✅ Local database restore completed!");
  } catch (error) {
    console.error("\n❌ Local database restore failed.");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    throw error;
  }
}

// -----------------------------------------------------
// Main
// -----------------------------------------------------

async function main() {
  console.log("\n");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║                                                    ║");
  console.log("║       🔄 LIVE → LOCAL DATABASE SYNC               ║");
  console.log("║                                                    ║");
  console.log("╚════════════════════════════════════════════════════╝");

  // ---------------------------------------------------
  // 1. Validate environment
  // ---------------------------------------------------

  validateEnvironment();

  const live = getDatabaseInfo(LIVE_DATABASE_URL!);

  const local = getDatabaseInfo(LOCAL_DATABASE_URL!);

  // ---------------------------------------------------
  // Safety check
  // ---------------------------------------------------

  console.log("\n");
  console.log("⚠️ DATABASE SYNC");
  console.log("────────────────────────────────────────────────────");

  console.log("\n📤 LIVE SOURCE:");
  console.log(`   ${live.user}@${live.host}:${live.port}`);
  console.log(`   Database: ${live.name}`);

  console.log("\n📥 LOCAL TARGET:");
  console.log(`   ${local.user}@${local.host}:${local.port}`);
  console.log(`   Database: ${local.name}`);

  console.log("\n🚨 WARNING");
  console.log("   The local public schema will be completely deleted.");
  console.log("   All existing local tables and data will be removed.");
  console.log("   The live database will NOT be modified.");

  // Strong safety check: only allow localhost as target.
  const isLocalHost =
    local.host === "localhost" ||
    local.host === "127.0.0.1" ||
    local.host === "::1";

  if (!isLocalHost) {
    throw new Error(
      `❌ Safety check failed: local target is not localhost (${local.host}).`,
    );
  }

  const confirmation = await ask('\nType "SYNC LIVE TO LOCAL" to continue: ');

  if (confirmation !== "SYNC LIVE TO LOCAL") {
    console.log("\n❌ Sync cancelled.");
    process.exit(0);
  }

  console.log("\n✅ Confirmation received.");

  // ---------------------------------------------------
  // 2. Create dump directory
  // ---------------------------------------------------

  const dumpDir = createDumpDirectory();

  console.log(`\n📂 Dump directory: ${dumpDir}`);

  // ---------------------------------------------------
  // 3. Dump live database
  // ---------------------------------------------------

  const dumpPath = await dumpLiveDatabase(live, dumpDir);

  // ---------------------------------------------------
  // 4. Clear local database
  // ---------------------------------------------------

  await clearLocalDatabase(local);

  // ---------------------------------------------------
  // 5. Restore into local
  // ---------------------------------------------------

  await restoreLocalDatabase(local, dumpPath);

  // ---------------------------------------------------
  // Done
  // ---------------------------------------------------

  console.log("\n");
  console.log("╔════════════════════════════════════════════════════╗");
  console.log("║                                                    ║");
  console.log("║        ✅ LIVE → LOCAL SYNC COMPLETE              ║");
  console.log("║                                                    ║");
  console.log("╚════════════════════════════════════════════════════╝");

  console.log("\n📋 Summary:");
  console.log(`   📤 Source: ${live.host}/${live.name}`);
  console.log(`   📥 Target: ${local.host}/${local.name}`);
  console.log(`   📁 Dump:   ${dumpPath}`);

  console.log("\n🎉 Your local database now contains the");
  console.log("   schema and data from the live database.");
}

// -----------------------------------------------------
// Run
// -----------------------------------------------------

console.log("\n▶️ Starting live → local database sync...");

main()
  .then(() => {
    console.log("\n🏁 Sync script finished.");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n💥 Sync script failed.");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    process.exit(1);
  });
