import { NextRequest, NextResponse } from "next/server";
import { tokenRepository } from "@/data/repositories/token.repository";
import z from "zod";
import { TokenType } from "@/lib/prisma/generated";
import { hashToken } from "@/lib/auth/token-handlers";
import { getUserByKey } from "@/data/user";
import { compareHash } from "@/lib/utils/passwordHandlers";
import { generateUserApiKey } from "@/actions";

const LoginSchema = z.object({
  email: z.email(),
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

    const { email, password } = parse.data;

    const user = await getUserByKey(email);

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

    // Retrieve or Create API Key Token
    // return the existing key if it exists,
    // or generate a new one if it doesn't.
    let activeToken = user.tokens.find(
      ({ type, expiresAt }) =>
        type === TokenType.API_KEY && new Date(expiresAt) > new Date(),
    );

    if (!activeToken) {
      // Generate a new secure random string
      const rawToken = await generateUserApiKey(
        user.id,
        "generated-over-api-login",
      );

      // Note: In your repo, you store 'hashedToken'.
      // For the mobile client, return the RAW token once, then hash it for the DB.
      activeToken = await tokenRepository.upsertToken({
        userId: user.id,
        type: TokenType.API_KEY,
        hashedToken: hashToken(rawToken),
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365), // 1 year
      });

      // Attach the raw token to the response object so the mobile app can save it
      (activeToken as any).raw = rawToken;
    }

    // 5. Audit log usage
    await tokenRepository.touch(activeToken.id);

    return NextResponse.json({
      success: true,
      data: {
        token: (activeToken as any).raw || activeToken.hashedToken,
        type: activeToken.type,
        expiresAt: activeToken.expiresAt,
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role,
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
