import "dotenv/config";
import { execFile } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";
import readline from "readline";

const execFileAsync = promisify(execFile);

type DumpFile = {
  name: string;
  path: string;
  mtime: number;
  size: number;
};

function getDumpFiles(dumpsDir: string): DumpFile[] {
  if (!fs.existsSync(dumpsDir)) {
    throw new Error(`❌ Dumps directory does not exist: ${dumpsDir}`);
  }

  const files = fs
    .readdirSync(dumpsDir)
    .filter((file) => file.endsWith(".sql"))
    .map((file) => {
      const filePath = path.join(dumpsDir, file);
      const stats = fs.statSync(filePath);

      return {
        name: file,
        path: filePath,
        mtime: stats.mtimeMs,
        size: stats.size,
      };
    })
    .sort((a, b) => b.mtime - a.mtime);

  if (files.length === 0) {
    throw new Error(`❌ No .sql dump files found in: ${dumpsDir}`);
  }

  return files;
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

async function selectDump(dumpsDir: string): Promise<string> {
  const dumps = getDumpFiles(dumpsDir);

  console.log("\n📦 Available database dumps:");
  console.log("────────────────────────────────────────────────────────");

  dumps.forEach((dump, index) => {
    const date = new Date(dump.mtime).toLocaleString();
    const size = (dump.size / 1024 / 1024).toFixed(2);

    console.log(`${index + 1}. ${dump.name}`);
    console.log(`   ${size} MB | ${date}`);
  });

  console.log("────────────────────────────────────────────────────────");

  const answer = await ask(`Select dump [1-${dumps.length}] or q to cancel: `);

  if (answer.toLowerCase() === "q") {
    console.log("\n❌ Restore cancelled.");
    process.exit(0);
  }

  const selection = Number(answer);

  if (
    !Number.isInteger(selection) ||
    selection < 1 ||
    selection > dumps.length
  ) {
    throw new Error("❌ Invalid dump selection.");
  }

  return dumps[selection - 1].path;
}

async function restoreDatabase() {
  const args = process.argv.slice(2);
  const isForce = args.includes("--force") || args.includes("-f");
  const specifiedFile = args.find((arg) => !arg.startsWith("-"));

  const dbUrl = process.env.DATABASE_URL;

  console.log(`DATABASE_URL present: ${Boolean(dbUrl)}`);

  if (!dbUrl) {
    throw new Error("❌ DATABASE_URL environment variable is missing.");
  }

  const databaseUrl = new URL(dbUrl);

  // -----------------------------------------------------
  // Configure PostgreSQL SSL
  // -----------------------------------------------------

  if (
    databaseUrl.hostname === "localhost" ||
    databaseUrl.hostname === "127.0.0.1"
  ) {
    // Local PostgreSQL usually does not support SSL.
    databaseUrl.searchParams.set("sslmode", "disable");
  } else {
    // Managed PostgreSQL providers typically require SSL.
    databaseUrl.searchParams.set("sslmode", "require");
    databaseUrl.searchParams.delete("sslrootcert");
  }

  console.log("🎯 Target database:");
  console.log(`   Host:     ${databaseUrl.hostname}`);
  console.log(`   Port:     ${databaseUrl.port || "5432"}`);
  console.log(`   Database: ${databaseUrl.pathname.slice(1)}`);
  console.log(`   User:     ${databaseUrl.username}`);
  console.log(`   SSL:      ${databaseUrl.searchParams.get("sslmode")}`);
  console.log(
    `   Force:    ${isForce ? "YES (will drop existing schema)" : "NO"}`,
  );

  const dumpsDir = path.join(import.meta.dirname, "dumps");

  const targetDumpPath = specifiedFile
    ? path.resolve(specifiedFile)
    : await selectDump(dumpsDir);

  if (!fs.existsSync(targetDumpPath)) {
    throw new Error(`❌ Dump file does not exist: ${targetDumpPath}`);
  }

  const stats = fs.statSync(targetDumpPath);

  console.log("\n⚠️ DATABASE RESTORE");
  console.log("────────────────────────────────────");

  console.log(`📁 Source: ${targetDumpPath}`);
  console.log(`📦 Size:   ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

  if (isForce) {
    console.log(
      "⚠️ WARNING: --force flag detected. All existing tables and types will be WIPED!",
    );
  }

  console.log("\n⚠️ This will execute the dump against the target database.");

  const confirmed = await ask("\nContinue with restore? [y/N] ");

  if (confirmed.toLowerCase() !== "y") {
    console.log("\n❌ Restore cancelled.");
    process.exit(0);
  }

  try {
    if (isForce) {
      console.log("\n🧹 Dropping existing schema...");
      await execFileAsync("psql", [
        databaseUrl.toString(),
        "-c",
        "DROP SCHEMA public CASCADE; CREATE SCHEMA public;",
      ]);
    }

    console.log("\n📥 Restoring database dump...");
    await execFileAsync("psql", [
      databaseUrl.toString(),
      "-v",
      "ON_ERROR_STOP=1",
      "-f",
      targetDumpPath,
    ]);

    console.log("\n✅ Database restored successfully!");
  } catch (error) {
    console.error("\n❌ Error restoring database:");

    if (error instanceof Error) {
      console.error(error.message);
    } else {
      console.error(error);
    }

    throw error;
  }
}

console.log("▶️ Starting restoreDatabase...");

restoreDatabase()
  .then(() => {
    console.log("🏁 Restore script finished.");
  })
  .catch((error) => {
    console.error("💥 Restore script failed:", error);
    process.exitCode = 1;
  });
