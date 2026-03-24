import { NextRequest, NextResponse } from "next/server";
import { tokenRepository } from "@/data/repositories/token.repository";
import z from "zod";
import { TokenType } from "@/lib/prisma/generated";
import { hashToken } from "@/lib/auth/token-handlers";
import { getUserByKey } from "@/data/user";
import { compareHash } from "@/lib/utils/passwordHandlers";
import { generateUserApiKey } from "@/actions";
import { addToDate } from "@/lib/utils/dateHandlers";

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

    const user = await getUserByKey(username);

    if (!user) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 },
      );
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
    const isPasswordValid = await compareHash(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "Invalid email or password" },
        { status: 401 },
      );
    }

    const apiKeyString = await generateUserApiKey(user.id);
    const updatedToken = await tokenRepository.upsertToken({
      userId: user.id,
      type: TokenType.API_KEY,
      hashedToken: hashToken(apiKeyString),
      expiresAt: addToDate({ days: 1 }),
    });

    return NextResponse.json({
      success: true,
      data: {
        apiKey: apiKeyString,
        expiresAt: updatedToken.expiresAt,
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
