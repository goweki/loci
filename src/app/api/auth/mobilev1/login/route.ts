import { NextRequest, NextResponse } from "next/server";
import z from "zod";
import { bcryptCompare } from "@/lib/utils/authHandlers";
import { UserService } from "@/services/user/user.service";
import { createApiKey } from "@/lib/auth/token-handlers";
import { UserStatus } from "@/lib/prisma/generated";

const LoginSchema = z.object({
  username: z.string().min(6),
  password: z.string().min(6),
});

/**
 * Route: POST
 * Exchange credentials for an API_KEY type token
 */
export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();
    const parse = LoginSchema.safeParse(rawBody);

    if (!parse.success) {
      return NextResponse.json(
        {
          error: "Invalid credentials format",
          details: z.treeifyError(parse.error),
        },
        { status: 400 },
      );
    }

    const { username, password } = parse.data;

    const user = await UserService.getUserByKey(username);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
    }

    if (user.status !== UserStatus.ACTIVE) {
      return NextResponse.json({ error: "User account is not active" }, { status: 403 });
    }

    if (!user.password) {
      return NextResponse.json(
        {
          error: "Password not set",
          message:
            "Please initialize your account credentials on the Loci website before using the mobile app.",
        },
        { status: 403 },
      );
    }

    // Verify Password
    const isPasswordValid = await bcryptCompare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const { apiKey: apiKeyString, expiresAt } = await createApiKey({
      userId: user.id,
      description: "mobile-login",
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: apiKeyString,
        expiresAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          tel: user.tel,
          image: user.image,
          role: user.role,
          status: user.status,
          createdAt: user.createdAt,
        },
      },
    });
  } catch (error: any) {
    console.error(`[MOBILE_LOGIN_ERROR]:`, error);
    return NextResponse.json(
      { error: "Authentication failed", details: error.message },
      { status: 500 },
    );
  }
}
