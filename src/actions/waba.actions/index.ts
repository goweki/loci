"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PhoneNumberStatus, SubscriptionStatus, WabaOwnership } from "@/lib/prisma/generated";
import whatsapp from "@/lib/whatsapp";
import { ActionResult } from "@/types";
import { encryptWhatsAppToken } from "@/lib/whatsapp/credentials";

interface ConnectWabaParams {
  code: string;
  waba_id?: string;
  phone_number_id?: string;
  business_id?: string;
}

export async function connectWhatsAppAction({
  code,
  waba_id,
  phone_number_id,
}: ConnectWabaParams): Promise<ActionResult<string>> {
  const actor = await requireUser();

  try {
    if (!code) {
      return { ok: false, error: "Missing authorization code" };
    }

    // 1. Exchange OAuth code via WhatsAppClient
    const resTokenData = await whatsapp.getTokenUsingWabaAuthCode(code);
    if (!resTokenData.ok) {
      throw new Error(resTokenData.error);
    }
    const access_token = resTokenData.data;

    if (!access_token) {
      return {
        ok: false,
        error: "Failed to obtain access token from authorization code",
      };
    }
    const encryptedAccessToken = encryptWhatsAppToken(access_token);

    const subscription = await prisma.subscription.findFirst({
      where: { userId: actor.id, status: SubscriptionStatus.ACTIVE, currentPeriodEnd: { gt: new Date() } },
      include: { plan: { select: { maxPhoneNumbers: true } } },
      orderBy: { currentPeriodEnd: "desc" },
    });
    if (!subscription) return { ok: false, error: "An active subscription is required to connect WhatsApp." };

    // --- FALLBACK RESOLUTION FOR CASE A (Missing IDs) ---
    let targetWabaId = waba_id;
    let targetPhoneNumberId = phone_number_id;

    // 2. Fetch WABA ID via Meta /debug_token if missing
    if (!targetWabaId) {
      try {
        const appAccessToken = `${process.env.NEXT_PUBLIC_META_APP_ID}|${process.env.META_APP_SECRET}`;
        const debugRes = await fetch(
          `https://graph.facebook.com/v22.0/debug_token?input_token=${access_token}&access_token=${appAccessToken}`,
        );
        const debugData = await debugRes.json();

        const scopes = debugData?.data?.granular_scopes || [];
        const whatsappScope = scopes.find(
          (s: any) => s.scope === "whatsapp_business_management",
        );

        targetWabaId = whatsappScope?.target_ids?.[0];
      } catch (err) {
        console.warn("Could not resolve WABA ID from debug_token:", err);
      }
    }

    if (!targetWabaId) {
      return {
        ok: false,
        error: "Could not locate WhatsApp Business Account ID from Meta",
      };
    }

    // 3. Fetch Phone Number ID via WABA endpoint if missing
    let remotePhoneNumbers: Array<{ id: string }> = [];
    try {
      const phoneListRes = await fetch(
        `https://graph.facebook.com/v22.0/${targetWabaId}/phone_numbers?fields=id&limit=100`,
        { headers: { Authorization: `Bearer ${access_token}` }, signal: AbortSignal.timeout(10000) },
      );
      const phoneListData = await phoneListRes.json();
      if (!phoneListRes.ok) throw new Error(phoneListData?.error?.message || "Unable to read WhatsApp phone numbers from Meta.");
      remotePhoneNumbers = Array.isArray(phoneListData?.data) ? phoneListData.data : [];
      targetPhoneNumberId ||= remotePhoneNumbers[0]?.id;
    } catch (err) {
      if (targetPhoneNumberId) remotePhoneNumbers = [{ id: targetPhoneNumberId }];
      else throw err;
    }

    const existingWaba = await prisma.wabaAccount.findUnique({ where: { id: targetWabaId }, select: { userId: true } });
    if (existingWaba?.userId && existingWaba.userId !== actor.id) {
      return { ok: false, error: "This WhatsApp Business Account is already connected to another account." };
    }
    const existingCount = await prisma.phoneNumber.count({ where: { waba: { userId: actor.id } } });
    const newPhoneIds = remotePhoneNumbers.filter((item) => item.id).map((item) => item.id);
    const alreadyOwned = await prisma.phoneNumber.count({ where: { id: { in: newPhoneIds }, waba: { userId: actor.id } } });
    if (existingCount + newPhoneIds.length - alreadyOwned > subscription.plan.maxPhoneNumbers) {
      return { ok: false, error: `Your plan allows ${subscription.plan.maxPhoneNumbers} WhatsApp number(s).` };
    }

    const otherAccount = await prisma.wabaAccount.findFirst({ where: { userId: actor.id, id: { not: targetWabaId } }, select: { id: true } });
    if (otherAccount) return { ok: false, error: "This account already has a different WhatsApp Business Account connected." };
    // --- END FALLBACK RESOLUTION ---

    // 4. Fetch WABA Metadata via WhatsAppClient
    let wabaMeta = {
      name: "Unknown WhatsApp Account",
      currency: "USD",
      timezone_id: "1",
      message_template_namespace: null as string | null,
    };

    try {
      const data = await whatsapp.getWaba(targetWabaId, access_token);
      wabaMeta = {
        name: data.name || wabaMeta.name,
        currency: data.currency || wabaMeta.currency,
        timezone_id: data.timezone_id || wabaMeta.timezone_id,
        message_template_namespace: data.message_template_namespace || null,
      };
    } catch (err) {
      console.warn(
        "Could not fetch WABA metadata, proceeding with defaults:",
        err,
      );
    }

    // 5. Persist WABA Account in Prisma DB
    const wabaAccount = await prisma.wabaAccount.upsert({
      where: { id: targetWabaId },
      update: {
        userId: actor.id,
        name: wabaMeta.name,
        currency: wabaMeta.currency,
        timezoneId: wabaMeta.timezone_id,
        messageTemplateNamespace: wabaMeta.message_template_namespace,
        accessTokenEncrypted: encryptedAccessToken,
        tokenUpdatedAt: new Date(),
      },
      create: {
        id: targetWabaId,
        userId: actor.id,
        name: wabaMeta.name,
        ownership: WabaOwnership.SHARED,
        currency: wabaMeta.currency,
        timezoneId: wabaMeta.timezone_id,
        messageTemplateNamespace: wabaMeta.message_template_namespace,
        accessTokenEncrypted: encryptedAccessToken,
        tokenUpdatedAt: new Date(),
      },
    });

    // 6. Fetch and Store Phone Number details via WhatsAppClient
    let syncedPhoneCount = 0;
    for (const remotePhone of remotePhoneNumbers) {
      try {
        const phoneData = await whatsapp.getPhoneNumberDetails(
          remotePhone.id,
          access_token,
        );
        const phoneNumberStr =
          phoneData.display_phone_number || remotePhone.id;

        const existingPhone = await prisma.phoneNumber.findUnique({ where: { phoneNumber: phoneNumberStr }, select: { id: true, waba: { select: { userId: true } } } });
        if (existingPhone?.waba?.userId && existingPhone.waba.userId !== actor.id) {
          throw new Error("A phone number returned by Meta belongs to another Loci account.");
        }

        await prisma.phoneNumber.upsert({
          where: { phoneNumber: phoneNumberStr },
          update: {
            id: remotePhone.id,
            displayName: phoneData.verified_name || null,
            status: PhoneNumberStatus.VERIFIED,
            verifiedAt: new Date(),
            wabaId: wabaAccount.id,
          },
          create: {
            id: remotePhone.id,
            phoneNumber: phoneNumberStr,
            displayName: phoneData.verified_name || null,
            status: PhoneNumberStatus.VERIFIED,
            verifiedAt: new Date(),
            wabaId: wabaAccount.id,
          },
        });
        syncedPhoneCount += 1;
      } catch (err) {
        if (err instanceof Error && err.message.includes("belongs to another")) throw err;
        console.warn(
          `Could not fetch phone number details for ${remotePhone.id}, skipping phone save:`,
          err,
        );
      }
    }
    if (syncedPhoneCount === 0) {
      throw new Error("Meta connected the business account, but no phone numbers could be synced. Retry the connection.");
    }

    return { ok: true, data: wabaAccount.id };
  } catch (error: any) {
    console.error("WhatsApp Action Error:", error);
    return {
      ok: false,
      error: error.message || "Failed to link WhatsApp account",
    };
  }
}
