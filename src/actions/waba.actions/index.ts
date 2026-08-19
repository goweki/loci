"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { PhoneNumberStatus, WabaOwnership } from "@/lib/prisma/generated";

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
}: ConnectWabaParams) {
  const actor = await requireUser();
  try {
    if (!code) {
      return { success: false, error: "Missing authorization code" };
    }

    // 1. Exchange OAuth code for User Access Token
    const tokenUrl = new URL(
      "https://graph.facebook.com/v22.0/oauth/access_token",
    );
    tokenUrl.searchParams.append(
      "client_id",
      process.env.NEXT_PUBLIC_META_APP_ID!,
    );
    tokenUrl.searchParams.append("client_secret", process.env.META_APP_SECRET!);
    tokenUrl.searchParams.append("code", code);

    const tokenRes = await fetch(tokenUrl.toString());
    const tokenData = await tokenRes.json();

    if (tokenData.error) {
      return { success: false, error: tokenData.error.message };
    }

    const { access_token } = tokenData;

    // 2. Fetch WABA Metadata from Meta Graph API if waba_id exists
    let wabaMeta = {
      name: "WhatsApp Account",
      currency: "USD",
      timezone_id: "1",
      message_template_namespace: null,
    };

    if (waba_id) {
      const wabaRes = await fetch(
        `https://graph.facebook.com/v22.0/${waba_id}?fields=name,currency,timezone_id,message_template_namespace&access_token=${access_token}`,
      );
      if (wabaRes.ok) {
        const data = await wabaRes.json();
        wabaMeta = {
          name: data.name || wabaMeta.name,
          currency: data.currency || wabaMeta.currency,
          timezone_id: data.timezone_id || wabaMeta.timezone_id,
          message_template_namespace: data.message_template_namespace || null,
        };
      }
    }

    // 3. Persist WABA Account in Prisma DB
    const targetWabaId = waba_id || `waba_${Date.now()}`;

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

    // 4. Fetch and Store Phone Number details if phone_number_id exists
    if (phone_number_id) {
      const phoneRes = await fetch(
        `https://graph.facebook.com/v22.0/${phone_number_id}?fields=display_phone_number,verified_name&access_token=${access_token}`,
      );

      if (phoneRes.ok) {
        const phoneData = await phoneRes.json();

        await prisma.phoneNumber.upsert({
          where: {
            phoneNumber: phoneData.display_phone_number || phone_number_id,
          },
          update: {
            displayName: phoneData.verified_name || null,
            status: PhoneNumberStatus.VERIFIED,
            verifiedAt: new Date(),
            wabaId: wabaAccount.id,
          },
          create: {
            phoneNumber: phoneData.display_phone_number || phone_number_id,
            displayName: phoneData.verified_name || null,
            status: PhoneNumberStatus.VERIFIED,
            verifiedAt: new Date(),
            wabaId: wabaAccount.id,
          },
        });
      }
    }

    return { success: true, wabaId: wabaAccount.id };
  } catch (error: any) {
    console.error("WhatsApp Action Error:", error);
    return {
      success: false,
      error: error.message || "Failed to link WhatsApp account",
    };
  }
}
