import { NextRequest, NextResponse } from "next/server";
import {
  apiKeyMiddleware,
  type AuthenticatedHandler,
} from "@/lib/auth/token-handlers";
import { metaSyncService } from "@/lib/whatsapp";
import { getUserById } from "@/data/user";
import { UserRole } from "@/lib/prisma/generated";

const postInit: AuthenticatedHandler = async (request, apiKey) => {
  try {
    const user = await getUserById(apiKey.user.id);

    if (user?.role !== UserRole.ADMIN)
      return NextResponse.json({ error: "uskue mjanja" }, { status: 400 });

    const body = await request.json();

    const launchDate = body.launchDate;

    if (launchDate !== process.env.LAUNCH_DATE) {
      console.error("invalid launch date", launchDate, process.env.LAUNCH_DATE);
      return NextResponse.json(
        {
          success: false,
          details: "Invalid info, bro...",
        },
        { status: 400 },
      );
    }

    await metaSyncService.syncFromMeta();

    return NextResponse.json(
      {
        success: true,
        details: "synchronizing...",
      },
      { status: 201 },
    );
  } catch (error: any) {
    console.error(`[WABA_DISPATCH_ERROR]:`, error);

    return NextResponse.json(
      { error: "Failed to init", details: error.message },
      { status: error.status || 502 },
    );
  }
};

export const POST = apiKeyMiddleware(postInit);
