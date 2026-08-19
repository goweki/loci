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

    // 2. Fetch WABA Metadata via WhatsAppClient
    let wabaMeta = {
      name: "WhatsApp Account",
      currency: "USD",
      timezone_id: "1",
      message_template_namespace: null as string | null,
    };

    if (waba_id) {
      try {
        const data = await whatsapp.getWaba(waba_id, access_token);
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

    // 4. Fetch and Store Phone Number details via WhatsAppClient
    if (phone_number_id) {
      try {
        const phoneData = await whatsapp.getPhoneNumberDetails(
          phone_number_id,
          access_token,
        );
        const phoneNumberStr =
          phoneData.display_phone_number || phone_number_id;

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
