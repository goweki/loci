import "dotenv/config";
import { exec } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs";

const execAsync = promisify(exec);

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    throw new Error("❌ DATABASE_URL environment variable is missing.");
  }

  // Create dumps directory if it doesn't exist
  const dumpDir = path.join(__dirname, "./dumps");
  if (!fs.existsSync(dumpDir)) {
    fs.mkdirSync(dumpDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const outputPath = path.join(dumpDir, `backup-${timestamp}.sql`);

  console.log("📦 Starting database dump...\n");

  try {
    await execAsync(`pg_dump "${dbUrl}" -F p -f "${outputPath}"`);

    console.log(`✅ Database dump created successfully!`);
    console.log(`📁 File saved to: ${outputPath}`);
  } catch (error) {
    console.error("❌ Error creating database dump:", error);
    throw error;
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
