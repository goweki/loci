"use server";

import { prisma } from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";
import { getFriendlyErrorMessage } from "@/lib/utils/errorHandlers";
import { ActionResult } from "@/types";
import { MerchantSpaceData } from "./space.dto";

export async function getMerchantSpaceAction(
  username: string,
): Promise<ActionResult<MerchantSpaceData>> {
  try {
    const merchant = await prisma.user.findUnique({
      where: { username, status: "ACTIVE" },
      select: {
        id: true,
        username: true,
        name: true,
        image: true,
        tel: true,
        preferredCommunicationChannel: true,
        _count: {
          select: { products: { where: { isActive: true } } },
        },
        waba: {
          select: {
            phoneNumbers: {
              where: { status: "VERIFIED" },
              orderBy: { createdAt: "asc" },
              take: 1,
              select: { phoneNumber: true, displayName: true },
            },
          },
        },
      },
    });

    if (!merchant) return { ok: false, error: "Merchant not found" };

    return {
      ok: true,
      data: {
        id: merchant.id,
        username: merchant.username,
        name: merchant.name ?? merchant.username,
        image: merchant.image,
        preferredCommunicationChannel: merchant.preferredCommunicationChannel,
        tel:
          merchant.waba?.phoneNumbers[0]?.phoneNumber ?? merchant.tel ?? null,
        productCount: merchant._count.products,
      },
    };
  } catch (error) {
    return { ok: false, error: getFriendlyErrorMessage(error) };
  }
}
