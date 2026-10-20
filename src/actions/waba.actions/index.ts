"use server";

import { requireUser } from "@/lib/auth";
import prisma from "@/lib/prisma";
import {
  PhoneNumberStatus,
  SubscriptionStatus,
  WabaOwnership,
} from "@/lib/prisma/generated";
import whatsapp from "@/lib/whatsapp";
import { WhatsAppClient } from "@/lib/whatsapp/services/client";
import {
  decryptWhatsAppToken,
  encryptWhatsAppToken,
} from "@/lib/whatsapp/credentials";
import { env_ } from "@/lib/whatsapp/types/environment-variables";
import { ActionResult } from "@/types";

interface ConnectWabaParams {
  code: string;
  waba_id: string;
  phone_number_id?: string;
  business_id?: string;
}

export interface ConnectedWabaResult {
  wabaId: string;
  phoneNumberId: string;
  registrationRequired: boolean;
}

export async function connectWhatsAppAction({
  code,
  waba_id,
  phone_number_id,
  business_id,
}: ConnectWabaParams): Promise<ActionResult<ConnectedWabaResult>> {
  const actor = await requireUser();

  try {
    if (!code?.trim())
      throw new Error("Meta did not return an authorization code.");
    if (!/^\d{5,32}$/.test(waba_id))
      throw new Error("Meta returned an invalid WhatsApp Business Account ID.");
    if (phone_number_id && !/^\d{5,32}$/.test(phone_number_id)) {
      throw new Error("Meta returned an invalid phone number ID.");
    }
    if (business_id && !/^\d{5,32}$/.test(business_id)) {
      throw new Error("Meta returned an invalid business portfolio ID.");
    }

    const subscription = await prisma.subscription.findFirst({
      where: {
        userId: actor.id,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd: { gt: new Date() },
      },
      include: { plan: { select: { maxPhoneNumbers: true } } },
      orderBy: { currentPeriodEnd: "desc" },
    });
    if (!subscription) {
      throw new Error(
        "An active subscription is required to connect WhatsApp.",
      );
    }

    const exchanged = await whatsapp.getTokenUsingWabaAuthCode(code);
    if (!exchanged.ok) throw new Error(exchanged.error);
    const { accessToken, tokenType, expiresIn } = exchanged.data;
    const encryptedAccessToken = encryptWhatsAppToken(accessToken);

    // These calls verify that the exchanged credential can access the exact
    // WABA and selected phone number from this signup session.
    const [wabaMeta, phoneNumbers] = await Promise.all([
      whatsapp.getWaba(waba_id, accessToken),
      getWabaPhoneNumbers(waba_id, accessToken),
    ]);
    if (wabaMeta.id !== waba_id) {
      throw new Error(
        "The selected WhatsApp Business Account could not be verified.",
      );
    }

    const phoneNumberId =
      phone_number_id ??
      (phoneNumbers.length === 1 ? phoneNumbers[0].id : undefined);
    if (!phoneNumberId) {
      throw new Error(
        "Select a phone number in Meta Embedded Signup and try again.",
      );
    }
    if (!phoneNumbers.some((phone) => phone.id === phoneNumberId)) {
      throw new Error(
        "The selected phone number does not belong to this WhatsApp Business Account.",
      );
    }

    const [phoneData, existingWaba, otherAccount, existingPhone] =
      await Promise.all([
        whatsapp.getPhoneNumberDetails(phoneNumberId, accessToken),
        prisma.wabaAccount.findUnique({
          where: { id: waba_id },
          select: { userId: true },
        }),
        prisma.wabaAccount.findFirst({
          where: { userId: actor.id, id: { not: waba_id } },
          select: { id: true },
        }),
        prisma.phoneNumber.findUnique({
          where: { id: phoneNumberId },
          select: { id: true, waba: { select: { userId: true } } },
        }),
      ]);
    if (phoneData.id && phoneData.id !== phoneNumberId) {
      throw new Error("Meta returned details for a different phone number.");
    }
    if (existingWaba?.userId && existingWaba.userId !== actor.id) {
      throw new Error(
        "This WhatsApp Business Account is connected to another account.",
      );
    }
    if (otherAccount) {
      throw new Error(
        "This account already has a different WhatsApp Business Account connected.",
      );
    }
    if (existingPhone?.waba?.userId && existingPhone.waba.userId !== actor.id) {
      throw new Error("This phone number is connected to another account.");
    }
    const phoneNumber = phoneData.display_phone_number || phoneNumberId;
    const existingPhoneNumber = await prisma.phoneNumber.findUnique({
      where: { phoneNumber },
      select: { id: true, waba: { select: { userId: true } } },
    });
    if (
      existingPhoneNumber?.waba?.userId &&
      existingPhoneNumber.waba.userId !== actor.id
    ) {
      throw new Error("This phone number is connected to another account.");
    }
    const currentPhoneCount = await prisma.phoneNumber.count({
      where: { waba: { userId: actor.id } },
    });
    const alreadyOwnedPhone =
      existingPhone?.waba?.userId === actor.id ||
      existingPhoneNumber?.waba?.userId === actor.id;
    if (
      !alreadyOwnedPhone &&
      currentPhoneCount >= subscription.plan.maxPhoneNumbers
    ) {
      throw new Error(
        `Your plan allows ${subscription.plan.maxPhoneNumbers} WhatsApp number(s).`,
      );
    }

    // Ensure webhook delivery is enabled before reporting onboarding success.
    await whatsapp.subscribeApp(waba_id, accessToken);

    const now = new Date();
    const wabaAccount = await prisma.wabaAccount.upsert({
      where: { id: waba_id },
      update: {
        userId: actor.id,
        name: wabaMeta.name,
        currency: wabaMeta.currency,
        timezoneId: wabaMeta.timezone_id,
        messageTemplateNamespace: wabaMeta.message_template_namespace,
        businessId: business_id,
        accessTokenEncrypted: encryptedAccessToken,
        accessTokenType: tokenType ?? null,
        accessTokenExpiresAt:
          typeof expiresIn === "number"
            ? new Date(now.getTime() + expiresIn * 1000)
            : null,
        tokenUpdatedAt: now,
      },
      create: {
        id: waba_id,
        userId: actor.id,
        name: wabaMeta.name,
        ownership: WabaOwnership.SHARED,
        currency: wabaMeta.currency,
        timezoneId: wabaMeta.timezone_id,
        messageTemplateNamespace: wabaMeta.message_template_namespace,
        businessId: business_id,
        accessTokenEncrypted: encryptedAccessToken,
        accessTokenType: tokenType ?? null,
        accessTokenExpiresAt:
          typeof expiresIn === "number"
            ? new Date(now.getTime() + expiresIn * 1000)
            : null,
        tokenUpdatedAt: now,
      },
    });

    const verified = phoneData.code_verification_status === "VERIFIED";
    await prisma.phoneNumber.upsert({
      where: { phoneNumber },
      update: {
        id: phoneNumberId,
        displayName: phoneData.verified_name || null,
        status: verified
          ? PhoneNumberStatus.VERIFIED
          : PhoneNumberStatus.NOT_VERIFIED,
        verifiedAt: verified ? now : null,
        whatsappRegistrationStatus: phoneData.status ?? null,
        wabaId: wabaAccount.id,
      },
      create: {
        id: phoneNumberId,
        phoneNumber,
        displayName: phoneData.verified_name || null,
        status: verified
          ? PhoneNumberStatus.VERIFIED
          : PhoneNumberStatus.NOT_VERIFIED,
        verifiedAt: verified ? now : null,
        whatsappRegistrationStatus: phoneData.status ?? null,
        wabaId: wabaAccount.id,
      },
    });

    return {
      ok: true,
      data: {
        wabaId: wabaAccount.id,
        phoneNumberId,
        registrationRequired: phoneData.status !== "CONNECTED",
      },
    };
  } catch (error) {
    console.error("WhatsApp connection error:", error);
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to link WhatsApp account.",
    };
  }
}

export async function registerWhatsAppPhoneNumberAction(
  phoneNumberId: string,
  pin: string,
): Promise<ActionResult<void>> {
  const actor = await requireUser();
  if (!/^\d{5,32}$/.test(phoneNumberId)) {
    return { ok: false, error: "Invalid WhatsApp phone number." };
  }
  if (!/^\d{6}$/.test(pin)) {
    return {
      ok: false,
      error: "Enter the six-digit WhatsApp registration PIN.",
    };
  }

  try {
    const phone = await prisma.phoneNumber.findFirst({
      where: { id: phoneNumberId, waba: { userId: actor.id } },
      select: {
        id: true,
        waba: { select: { id: true, accessTokenEncrypted: true } },
      },
    });
    if (!phone?.waba?.accessTokenEncrypted) {
      throw new Error(
        "Reconnect your WhatsApp Business account before registering this number.",
      );
    }

    const accessToken = decryptWhatsAppToken(phone.waba.accessTokenEncrypted);
    const result = await whatsapp.registerPhoneNumber(
      phone.id,
      pin,
      accessToken,
    );
    if (!result.success)
      throw new Error("Meta did not confirm phone number registration.");

    await prisma.phoneNumber.update({
      where: { id: phone.id },
      data: { whatsappRegistrationStatus: "CONNECTED" },
    });
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof Error
          ? error.message
          : "Could not register the WhatsApp phone number.",
    };
  }
}

export async function deleteWhatsAppPhoneNumberAction(phoneNumberId: string): Promise<ActionResult<void>> {
  const actor = await requireUser();
  if (!/^\d{5,32}$/.test(phoneNumberId)) {
    return { ok: false, error: "Invalid WhatsApp phone number." };
  }
  try {
    const phone = await prisma.phoneNumber.findFirst({
      where: { id: phoneNumberId, waba: { userId: actor.id } },
      select: { id: true, waba: { select: { id: true, accessTokenEncrypted: true } } },
    });
    if (!phone?.waba?.accessTokenEncrypted) {
      throw new Error("Reconnect your WhatsApp Business account before removing this number.");
    }
    const client = new WhatsAppClient({
      ...env_,
      wabaId: phone.waba.id,
      wabaAccessToken: decryptWhatsAppToken(phone.waba.accessTokenEncrypted),
    });
    await client.deregisterPhoneNumber(phone.id);
    await prisma.phoneNumber.delete({ where: { id: phone.id } });
    return { ok: true, data: undefined };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Could not remove the WhatsApp number.",
    };
  }
}

async function getWabaPhoneNumbers(wabaId: string, accessToken: string) {
  const allPhones: Array<{ id: string }> = [];
  let nextUrl: string | undefined =
    `https://graph.facebook.com/${env_.apiVersion}/${wabaId}/phone_numbers?fields=id&limit=100`;

  while (nextUrl) {
    const pageResponse: Response = await fetch(nextUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(10000),
    });
    const pageData: {
      data?: Array<{ id?: unknown }>;
      paging?: { next?: unknown };
      error?: { message?: string };
    } = await pageResponse.json();
    if (!pageResponse.ok) {
      throw new Error(
        pageData.error?.message || "Unable to verify WhatsApp phone numbers.",
      );
    }
    if (Array.isArray(pageData.data)) {
      for (const phone of pageData.data) {
        if (typeof phone?.id === "string") allPhones.push({ id: phone.id });
      }
    }
    nextUrl =
      typeof pageData.paging?.next === "string"
        ? pageData.paging.next
        : undefined;
    if (nextUrl) {
      const pagingUrl = new URL(nextUrl);
      if (
        pagingUrl.protocol !== "https:" ||
        pagingUrl.hostname !== "graph.facebook.com"
      ) {
        throw new Error("Meta returned an invalid phone-number paging URL.");
      }
    }
    if (allPhones.length > 500)
      throw new Error(
        "This WhatsApp Business Account has too many phone numbers to sync.",
      );
  }
  return allPhones;
}
