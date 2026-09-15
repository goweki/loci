"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PhoneNumberStatus, WabaOwnership } from "@/lib/prisma/generated";
import whatsapp from "@/lib/whatsapp";
import { ActionResult } from "@/types";

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
    if (!targetPhoneNumberId) {
      try {
        const phoneListRes = await fetch(
          `https://graph.facebook.com/v22.0/${targetWabaId}/phone_numbers?access_token=${access_token}`,
        );
        const phoneListData = await phoneListRes.json();
        targetPhoneNumberId = phoneListData?.data?.[0]?.id;
      } catch (err) {
        console.warn("Could not resolve Phone Number ID from WABA:", err);
      }
    }
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
      },
      create: {
        id: targetWabaId,
        userId: actor.id,
        name: wabaMeta.name,
        ownership: WabaOwnership.SHARED,
        currency: wabaMeta.currency,
        timezoneId: wabaMeta.timezone_id,
        messageTemplateNamespace: wabaMeta.message_template_namespace,
      },
    });

    // 6. Fetch and Store Phone Number details via WhatsAppClient
    if (targetPhoneNumberId) {
      try {
        const phoneData = await whatsapp.getPhoneNumberDetails(
          targetPhoneNumberId,
          access_token,
        );
        const phoneNumberStr =
          phoneData.display_phone_number || targetPhoneNumberId;

        await prisma.phoneNumber.upsert({
          where: { phoneNumber: phoneNumberStr },
          update: {
            displayName: phoneData.verified_name || null,
            status: PhoneNumberStatus.VERIFIED,
            verifiedAt: new Date(),
            wabaId: wabaAccount.id,
          },
          create: {
            phoneNumber: phoneNumberStr,
            displayName: phoneData.verified_name || null,
            status: PhoneNumberStatus.VERIFIED,
            verifiedAt: new Date(),
            wabaId: wabaAccount.id,
          },
        });
      } catch (err) {
        console.warn(
          "Could not fetch phone number details, skipping phone save:",
          err,
        );
      }
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
