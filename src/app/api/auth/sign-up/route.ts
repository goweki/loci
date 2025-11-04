// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import db from "@/lib/prisma";
import { registerSchema } from "@/lib/validations";
import { createUser, getUserByEmail } from "@/data/user";

const SALT_ROUNDS_string = process.env.BCRYPT_SALT_ROUNDS || "10";

export async function POST(request: NextRequest) {
  const SALT_ROUNDS = parseInt(SALT_ROUNDS_string);

  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await getUserByEmail(email);

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

    // Create user
    const user = await createUser({
      email,
      name,
      password: hashedPassword,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
