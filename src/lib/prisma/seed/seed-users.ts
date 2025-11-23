import { PrismaClient, UserRole, UserStatus } from "@/lib/prisma/generated";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Example users data
const usersData = [
  {
    name: "Admin User",
    email: process.env.ADMIN_EMAIL || "loci@goweki.com",
    tel: "254721334944",
    password: "admin1234",
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
  },
  {
    name: "Demo User",
    email: "demo@goweki.com.com",
    password: "user1234",
    role: UserRole.USER,
    status: UserStatus.ACTIVE,
  },
];

export async function seedUsers() {
  console.log("👤 Seeding users...");

  for (const userData of usersData) {
    const existingUser = await prisma.user.findUnique({
      where: { email: userData.email },
    });

    if (existingUser) {
      console.log("✔ User already exists:", existingUser.email);
      continue;
    }

    const hashedPassword = await bcrypt.hash(userData.password, 10);

    await prisma.user.create({
      data: {
        ...userData,
        password: hashedPassword,
      },
    });

    console.log("➕ Created user:", userData.email);
  }
}
