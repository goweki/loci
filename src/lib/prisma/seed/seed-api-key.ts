import prisma from "../index";
import { PrismaClient, TokenType, UserRole } from "../generated";
import crypto from "crypto";

async function createOrRotateAdminApiKey() {
  console.log(
    `🔑 Creating/updating admin API key... user email:${process.env.SYSTEM_EMAIL}`,
  );

  // find admin user
  const admin = await prisma.user.findFirst({
    where: {
      email: process.env.SYSTEM_EMAIL,
    },
  });

  if (!admin) {
    throw new Error("❌ No admin user found");
  }

  // generate new raw token
  const rawToken = `loc_A_${crypto.randomBytes(32).toString("hex")}`;

  // hash token before storing
  const hashedToken = hashToken(rawToken);

  // upsert token
  await prisma.token.upsert({
    where: {
      type_userId: {
        type: TokenType.API_KEY,
        userId: admin.id,
      },
    },
    update: {
      hashedToken,
      description: "Admin API key",
      expiresAt: new Date("2999-12-31"),
    },
    create: {
      type: TokenType.API_KEY,
      hashedToken,
      userId: admin.id,
      description: "Admin API key",
      expiresAt: new Date("2999-12-31"),
    },
  });

  console.log("✅ Admin API key created/rotated");
  console.log("👉 SAVE THIS TOKEN NOW (won’t be shown again):");
  console.log(rawToken);
}

function hashToken(token: string) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

createOrRotateAdminApiKey()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
