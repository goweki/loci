import { NextRequest, NextResponse } from "next/server";
import {
  apiKeyMiddleware,
  type AuthenticatedHandler,
} from "@/lib/auth/token-handlers";
import { metaSyncService } from "@/lib/whatsapp";
import { UserRole } from "@/lib/prisma/generated";
import { UserService } from "@/services/user/user.service";
import prisma from "@/lib/prisma";

const postInit: AuthenticatedHandler = async (request: NextRequest, apiKey) => {
  try {
    // 1. Fetch user by the user ID bound to the API Key
    const actor = await prisma.user.findUnique({where:{id:apiKey.user.id}});

    if (!actor) {
      return NextResponse.json(
        { success: false, error: "Unauthorized user account" },
        { status: 401 },
      );
    }

    // 2. Role Check (ADMIN guard)
    if (actor.role !== UserRole.ADMIN) {
      return NextResponse.json(
        { success: false, error: "Access denied. Admin privileges required." },
        { status: 403 },
      );
    }

    // 3. Safe JSON Body Parsing
    const body = await request.json().catch(() => ({}));
    const { launchDate } = body;

    // 4. Validate Environment Secret Launch Parameter
    if (!launchDate || launchDate !== process.env.LAUNCH_DATE) {
      console.error(
        "[META_SYNC_ROUTE]: Invalid launch date verification:",
        launchDate,
        "Expected:",
        process.env.LAUNCH_DATE,
      );
      return NextResponse.json(
        {
          success: false,
          error: "Invalid launch verification date.",
        },
        { status: 400 },
      );
    }

    // 5. Construct User context for Sync Service
    const userPayload = {
      id: actor.id,
      role: actor.role,
      email: actor.email,
      name: actor.name ?? undefined,
    };

    // 6. Execute Meta Sync
    const syncRes = await metaSyncService.syncFromMeta(userPayload as any);

    // 7. Handle partial or total sync failures
    if (syncRes.errors.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: "Synchronization encountered errors",
          created: syncRes.created,
          updated: syncRes.updated,
          errors: syncRes.errors,
        },
        { status: 500 },
      );
    }

    // 8. Success Response
    return NextResponse.json({
      success: true,
      message: `Synchronization successful: created ${syncRes.created}, updated ${syncRes.updated}`,
      created: syncRes.created,
      updated: syncRes.updated,
    });
  } catch (error: any) {
    console.error(`[WABA_DISPATCH_ERROR]:`, error);

    return NextResponse.json(
      {
        success: false,
        error: "Failed to initialize Meta synchronization",
        details: error?.message || "Internal Server Error",
      },
      { status: error?.status || 500 },
    );
  }
};

export const POST = apiKeyMiddleware(postInit);
