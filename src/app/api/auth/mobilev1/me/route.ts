import { NextRequest, NextResponse } from "next/server";
import {
  apiKeyMiddleware,
  AuthenticatedHandler,
} from "@/lib/auth/token-handlers";
import { getUserById } from "@/data/user";

/**
 * Route: GET
 * Validate API key and return user data
 */
const getMe: AuthenticatedHandler = async (_request, apiKey) => {
  try {
    const _user = await getUserById(apiKey.user.id);
    const user = _user!;

    return NextResponse.json({
      success: true,
      data: {
        id: user!.id,
        name: user.name,
        email: user.email,
        tel: user.tel,
        image: user.image,
        role: user.role,
        status: user.status,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error(`[GET_ME_ERROR]:`, error);
    return NextResponse.json(
      { error: "Failed to fetch user data", details: error.message },
      { status: 500 },
    );
  }
};

export const GET = apiKeyMiddleware(getMe);
