// lib/whatsapp/helper-functions.ts
"use server";

import prisma from "@/lib/prisma";
import {
  MessageType,
  MessageDirection,
  MessageStatus,
  Prisma,
  PhoneNumber,
  PhoneNumberStatus,
} from "@/lib/prisma/generated";
import { InboundMessage, WhatsAppPhoneNumberDetailsResponse } from "./types";
import { Message } from "../validations";
import { createPhoneNumber, getPhoneNumberByNumber } from "@/data/phoneNumber";
import { getAdminUsers, getUserByPhoneNumberId } from "@/data/user";
import whatsapp from ".";
import { findContactByPhoneNumber } from "@/data/contact";
import {
  GetTokenUsingWabaAuthCodeResult,
  PreVerifiedNumberResponse,
  RequestCodeResponse,
  VerifyNumberResponse,
} from "./types/waba-api-reponses";
import { getServerSession } from "next-auth";
import { authOptions } from "../auth";

interface WhatsAppContact {
  profile: {
    name: string;
  };
  wa_id: string;
}

interface WhatsAppStatusUpdate {
  id: string;
  recipient_id: string;
  status: "sent" | "delivered" | "read" | "failed";
  timestamp: string;
  errors?: Array<{
    code: number;
    title: string;
    message: string;
  }>;
}

/**
 * Process incoming WhatsApp message and store in database
 */
export async function processIncomingMessage(
  message: InboundMessage,
  contacts: WhatsAppContact[] = [],
  metadata: {
    phone_number_id: string;
    display_phone_number: string;
  }
): Promise<void> {
  try {
    console.log("Processing incoming message:", message);

    const fromNumber = message.from;
    var phoneNumberId = metadata.phone_number_id;

    if (!phoneNumberId) {
      console.warn(`No phone number id in metadata!`);
      return;
    }

    let user = await getUserByPhoneNumberId(phoneNumberId);
    if (!user) {
      console.warn(
        `No user assigned the phoneNumberId:${phoneNumberId}, assigning it to admin...`
      );

      const phoneNumberDetails: WhatsAppPhoneNumberDetailsResponse =
        await whatsapp.getPhoneNumberDetails(phoneNumberId);
      user = (await getAdminUsers())[0];
      await createPhoneNumber({
        userId: user.id,
        phoneNumber: phoneNumberDetails.display_phone_number,
        displayName: phoneNumberDetails.verified_name,
        phoneNumberId,
        status:
          phoneNumberDetails.code_verification_status as PhoneNumberStatus,
      });
    }

    if (contacts.length > 0) {
      for (const contact of contacts) {
        await findOrCreateContact(
          user.id,
          contact.wa_id,
          contact.profile?.name
        );
      }
    }

    // Process message content based on type
    const content = await processMessageContent(message);

    // Store message in database
    const contact = await findContactByPhoneNumber(fromNumber);
    if (!contact) {
      console.warn(`No contact found with phone number: ${fromNumber}`);
      return;
    }

    await prisma.message.create({
      data: {
        userId: user.id,
        contactId: contact.id,
        phoneNumberId: phoneNumberId,
        waMessageId: message.id,
        type: mapWhatsAppTypeToMessageType(message.type),
        content,
        direction: MessageDirection.INBOUND,
        status: "DELIVERED",
        timestamp: new Date(parseInt(message.timestamp) * 1000),
      },
    });

    // Update contact's last message time
    await prisma.contact.update({
      where: { id: contact.id },
      data: { lastMessageAt: new Date() },
    });

    // Trigger real-time updates (WebSocket, SSE, etc.)
    await notifyUserOfNewMessage(user.id, contact.id, message);

    // Process auto-replies if configured
    await processAutoReplies(user.id, contact, message);

    console.log(`Successfully processed message ${message.id}`);
  } catch (error) {
    console.error("Error processing incoming message:", error);
    // Store failed message for retry
    await storeFailedMessage(message, error);
  }
}

/**
 * Process WhatsApp status updates (delivery receipts, read receipts)
 */
export async function processStatusUpdate(
  statusUpdate: WhatsAppStatusUpdate
): Promise<void> {
  try {
    console.log(
      "Processing status update:",
      statusUpdate.id,
      statusUpdate.status
    );

    // Find the message by WhatsApp message ID
    const message = await prisma.message.findFirst({
      where: {
        waMessageId: statusUpdate.id,
        direction: MessageDirection.OUTBOUND,
      },
    });

    if (!message) {
      console.warn(`Message not found for status update: ${statusUpdate.id}`);
      return;
    }

    // Update message status
    const newStatus: MessageStatus = mapWhatsAppStatusToMessageStatus(
      statusUpdate.status
    );
    await prisma.message.update({
      where: { id: message.id },
      data: {
        status: newStatus,
        updatedAt: new Date(),
      },
    });

    // Handle failed messages
    if (statusUpdate.status === "failed" && statusUpdate.errors) {
      console.error("Message failed:", statusUpdate.errors);
      // Could implement retry logic here
    }

    console.log(`Updated message ${message.id} status to ${newStatus}`);
  } catch (error) {
    console.error("Error processing status update:", error);
  }
}

/**
 * Find or create contact
 */
async function findOrCreateContact(
  userId: string,
  phoneNumber: string,
  name?: string
) {
  const contact = await prisma.contact.findFirst({
    where: {
      userId,
      phoneNumber,
    },
  });

  if (contact) {
    // Update name if provided and not already set
    if (name && !contact.name) {
      return await prisma.contact.update({
        where: { id: contact.id },
        data: { name },
      });
    }
    return contact;
  }

  // Create new contact
  return await prisma.contact.create({
    data: {
      userId,
      phoneNumber,
      name: name || null,
    },
  });
}

/**
 * Process message content based on type
 */
async function processMessageContent(message: InboundMessage): Promise<any> {
  switch (message.type) {
    case "text":
      return {
        text: message.text?.body || "",
      };

    case "image":
      if (message.image.id) {
        const mediaUrl = await downloadAndStoreMedia(message.image.id, "image");
        return {
          url: mediaUrl,
          caption: message.image.caption,
        };
      }
      break;

    case "document":
      if (message.document.id) {
        const mediaUrl = await downloadAndStoreMedia(
          message.document.id,
          "document"
        );
        return {
          url: mediaUrl,
          filename: message.document.filename,
          caption: message.document.caption,
        };
      }
      break;

    case "audio":
      if (message.audio.id) {
        const mediaUrl = await downloadAndStoreMedia(message.audio.id, "audio");
        return {
          url: mediaUrl,
        };
      }
      break;

    case "video":
      if (message.video.id) {
        const mediaUrl = await downloadAndStoreMedia(message.video.id, "video");
        return {
          url: mediaUrl,
          caption: message.video.caption,
        };
      }
      break;

    case "location":
      return {
        latitude: message.location?.latitude,
        longitude: message.location?.longitude,
        name: message.location?.name,
        address: message.location?.address,
      };

    // case "contacts":
    //   return {
    //     contacts: message.contacts?.map((contact) => ({
    //       name: contact.name.formatted_name,
    //       firstName: contact.name.first_name,
    //       lastName: contact.name.last_name,
    //       phones: contact.phones?.map((phone) => ({
    //         phone: phone.phone,
    //         type: phone.type,
    //       })),
    //     })),
    //   };

    // case "button":
    //   return {
    //     buttonText: message.button?.text,
    //     buttonPayload: message.button?.payload,
    //   };

    case "interactive":
      if (message.interactive?.button_reply) {
        return {
          interactiveType: "button_reply",
          buttonId: message.interactive.button_reply.id,
          buttonTitle: message.interactive.button_reply.title,
        };
      }
      if (message.interactive?.list_reply) {
        return {
          interactiveType: "list_reply",
          listId: message.interactive.list_reply.id,
          listTitle: message.interactive.list_reply.title,
        };
      }
      break;

    default:
      return {
        unsupported: true,
        type: message.type,
        rawData: message,
      };
  }

  return {};
}

/**
 * Download and store media files
 */
async function downloadAndStoreMedia(
  mediaId: string,
  mediaType: string
): Promise<string> {
  try {
    // Step 1: Get media URL from WhatsApp API
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      }
    );

    if (!mediaResponse.ok) {
      throw new Error(`Failed to get media info: ${mediaResponse.statusText}`);
    }

    const mediaInfo = await mediaResponse.json();

    // Step 2: Download the actual media file
    const fileResponse = await fetch(mediaInfo.url, {
      headers: {
        Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
      },
    });

    if (!fileResponse.ok) {
      throw new Error(`Failed to download media: ${fileResponse.statusText}`);
    }

    // Step 3: Store file (implement your storage logic)
    // This could be AWS S3, local storage, etc.
    const fileBuffer = await fileResponse.arrayBuffer();
    const fileName = `${mediaId}.${getFileExtension(mediaInfo.mime_type)}`;
    const storedUrl = await storeFile(
      fileName,
      fileBuffer,
      mediaInfo.mime_type
    );

    return storedUrl;
  } catch (error) {
    console.error("Error downloading media:", error);
    throw error;
  }
}

/**
 * Store file in your preferred storage solution
 */
async function storeFile(
  fileName: string,
  fileBuffer: ArrayBuffer,
  mimeType: string
): Promise<string> {
  // Implement your file storage logic here
  // Examples:
  // - AWS S3
  // - Google Cloud Storage
  // - Local file system
  // - CDN upload

  // For now, return a placeholder URL
  // In production, implement actual file upload
  const baseUrl = process.env.MEDIA_BASE_URL || "https://your-cdn.com/media";
  return `${baseUrl}/${fileName}`;
}

/**
 * Get file extension from MIME type
 */
function getFileExtension(mimeType: string): string {
  const extensions: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "video/mp4": "mp4",
    "video/quicktime": "mov",
    "audio/mpeg": "mp3",
    "audio/ogg": "ogg",
    "audio/wav": "wav",
    "application/pdf": "pdf",
    "application/msword": "doc",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
      "docx",
    "application/vnd.ms-excel": "xls",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
    "text/plain": "txt",
  };

  return extensions[mimeType] || "bin";
}

/**
 * Map WhatsApp message type to database MessageType enum
 */
function mapWhatsAppTypeToMessageType(whatsappType: string): MessageType {
  const typeMap: Record<string, MessageType> = {
    text: MessageType.TEXT,
    image: MessageType.IMAGE,
    document: MessageType.DOCUMENT,
    audio: MessageType.AUDIO,
    video: MessageType.VIDEO,
    location: MessageType.LOCATION,
    contacts: MessageType.CONTACT,
    button: MessageType.TEXT, // Treat as text for now
    interactive: MessageType.TEXT, // Treat as text for now
  };

  return typeMap[whatsappType] || MessageType.TEXT;
}

/**
 * Map WhatsApp status to database MessageStatus
 */
function mapWhatsAppStatusToMessageStatus(
  whatsappStatus: string
): MessageStatus {
  const statusMap: Record<string, MessageStatus> = {
    sent: MessageStatus.SENT,
    delivered: MessageStatus.DELIVERED,
    read: MessageStatus.READ,
    failed: MessageStatus.FAILED,
  };

  return statusMap[whatsappStatus] || "SENT";
}

/**
 * Notify user of new message (WebSocket, SSE, etc.)
 */
async function notifyUserOfNewMessage(
  userId: string,
  contactId: string,
  message: InboundMessage
): Promise<void> {
  // Implement real-time notification logic
  // Examples:
  // - WebSocket broadcast
  // - Server-Sent Events
  // - Push notifications
  // - Email notifications

  console.log(
    `Notifying user ${userId} of new message from contact ${contactId}`
  );

  // Placeholder for actual implementation
  // await websocketManager.sendToUser(userId, {
  //   type: 'new_message',
  //   contactId,
  //   messageId: message.id
  // })
}

/**
 * Process auto-replies based on user configuration
 */
async function processAutoReplies(
  userId: string,
  contact: any,
  message: InboundMessage
): Promise<void> {
  try {
    // Check if user has auto-reply rules configured
    const autoReplyRules = await prisma.autoReplyRule?.findMany?.({
      where: {
        userId,
        active: true,
      },
      orderBy: { priority: "asc" },
    });

    if (!autoReplyRules?.length) return;

    // Process rules (implement based on your business logic)
    for (const rule of autoReplyRules) {
      if (await shouldTriggerAutoReply(rule, message, contact)) {
        await triggerAutoReply(rule, contact, message);
        break; // Only trigger first matching rule
      }
    }
  } catch (error) {
    console.error("Error processing auto-replies:", error);
  }
}

/**
 * Check if auto-reply should be triggered
 */
async function shouldTriggerAutoReply(
  rule: any,
  message: InboundMessage,
  contact: any
): Promise<boolean> {
  // Implement your auto-reply logic
  // Examples:
  // - Keyword matching
  // - Time-based rules
  // - First message from new contact
  // - Business hours

  return false; // Placeholder
}

/**
 * Trigger auto-reply
 */
async function triggerAutoReply(
  rule: any,
  contact: any,
  originalMessage: InboundMessage
): Promise<void> {
  // Implement auto-reply sending logic
  console.log(`Triggering auto-reply for rule ${rule.id}`);
}

/**
 * Store failed message for retry
 */
async function storeFailedMessage(
  message: InboundMessage,
  error: any
): Promise<void> {
  try {
    await prisma.messageUnprocessed?.create?.({
      data: {
        waMessageId: message.id,
        payload: message as unknown as Prisma.InputJsonValue, // 👈 cast here,
        error: error.message,
        retryCount: 0,
        nextRetry: new Date(Date.now() + 5 * 60 * 1000), // Retry in 5 minutes
      },
    });
  } catch (storeError) {
    console.error("Failed to store failed message:", storeError);
  }
}

export async function buildWhatsAppMessage(input: Message) {
  const {
    to,
    type,
    recipient_type = "INDIVIDUAL",
    messaging_product = "whatsapp",
    context,
  } = input;

  if (!to) {
    throw new Error("WhatsApp message must include a 'to' phone number.");
  }

  const message: any = {
    messaging_product,
    recipient_type,
    to,
    type,
  };

  if (context) message.context = context;

  // Validate and attach content based on type
  switch (type) {
    case "text":
      if (!input.text)
        throw new Error(`text field is required for type "text"`);
      message.text = input.text;
      break;

    case "audio":
      if (!input.audio) throw new Error(`audio is required for type "audio"`);
      message.audio = input.audio;
      break;

    case "contacts":
      if (!input.contacts)
        throw new Error(`contacts is required for type "contacts"`);
      message.contacts = input.contacts;
      break;

    case "document":
      if (!input.document)
        throw new Error(`document is required for type "document"`);
      message.document = input.document;
      break;

    case "image":
      if (!input.image) throw new Error(`image is required for type "image"`);
      message.image = input.image;
      break;

    case "interactive":
      if (!input.interactive)
        throw new Error(`interactive is required for type "interactive"`);
      message.interactive = input.interactive;
      break;

    case "location":
      if (!input.location)
        throw new Error(`location is required for type "location"`);
      message.location = input.location;
      break;

    case "reaction":
      if (!input.reaction)
        throw new Error(`reaction is required for type "reaction"`);
      message.reaction = input.reaction;
      break;

    case "sticker":
      if (!input.sticker)
        throw new Error(`sticker is required for type "sticker"`);
      message.sticker = input.sticker;
      break;

    case "video":
      if (!input.video) throw new Error(`video is required for type "video"`);
      message.video = input.video;
      break;

    case "template":
      if (!input.template)
        throw new Error(`template is required for type "template"`);
      message.template = input.template;
      break;

    default:
      throw new Error(`Unsupported WhatsApp message type: ${type}`);
  }

  return message;
}

// ---------------------------------------------------------------------
// 8. NUMBER PREVERIFICATION
// ---------------------------------------------------------------------
/**
 * Create a pre-verified business phone number in your portfolio
 */
export async function createPreVerifiedNumber(
  baseUrl: string,
  fbBusinessId: string,
  wabaAccessToken: string,
  phoneNumber: string
): Promise<PreVerifiedNumberResponse> {
  const session = await getServerSession(authOptions);
  const user = session?.user;

  if (!user) {
    throw new Error("401: Unaauthorized");
  }

  const url = `${baseUrl}/${fbBusinessId}/add_phone_numbers?phone_number=${encodeURIComponent(
    phoneNumber
  )}`;

  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${wabaAccessToken}` },
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to create pre-verified number: ${text}`);
  }
  const { preverificationId }: PreVerifiedNumberResponse = await res.json();
  const createNewPhone_DTO = {
    phoneNumber,
    userId: user.id,
    preVerificationId: preverificationId,
  };
  const createdPhoneNo = await createPhoneNumber(createNewPhone_DTO);

  return { preverificationId };
}

/**
 * Request a verification code (OTP) for a pre-verified number
 */
export async function requestVerificationCode(
  baseUrl: string,
  preVerifiedNumberId: string,
  wabaAccessToken: string
): Promise<RequestCodeResponse> {
  var body = JSON.stringify({
    code_method: "SMS",
    locale: "en_US",
  });

  const url = `${baseUrl}/${preVerifiedNumberId}/request_code`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${wabaAccessToken}`,
    },
    body: body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to request verification code: ${text}`);
  }

  const data: RequestCodeResponse = await res.json();
  return data;
}

/**
 * Verify a pre-verified number using the otp
 */
export async function verifyPreVerifiedNumber(
  baseUrl: string,
  preVerifiedNumberId: string,
  otpCode: string,
  wabaAccessToken: string
): Promise<VerifyNumberResponse> {
  var body = JSON.stringify({
    code: otpCode,
  });

  const url = `${baseUrl}/${preVerifiedNumberId}/verify_code`;
  const res = await fetch(url, {
    method: "POST",
    headers: { Authorization: `Bearer ${wabaAccessToken}` },
    redirect: "follow",
    body: body,
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Failed to verify pre-verified number: ${text}`);
  }

  const data: VerifyNumberResponse = await res.json();
  return data;
}

export async function getTokenUsingWabaAuthCode(
  baseUrl: string,
  code: string,
  fbAppId: string,
  appSecret: string
): Promise<GetTokenUsingWabaAuthCodeResult> {
  const url = new URL(`${baseUrl}/oauth_access_token`);

  url.searchParams.set("client_id", fbAppId);
  url.searchParams.set("client_secret", appSecret);
  url.searchParams.set("code", code);

  try {
    const req = new Request(url.toString(), { method: "GET" });
    const res = await fetch(req);

    if (!res.ok) {
      const errorDetail = await res.text();
      console.error("OAuth exchange failed:", errorDetail);
      throw new Error("Failed to exchange auth code for business token");
    }

    const data: { access_token: string } = await res.json();

    return {
      success: true,
      businessToken: data.access_token,
    };
  } catch (error: any) {
    console.error("OAuth exchange error:", error);
    return {
      success: false,
      error: error?.message || "Unknown error",
    };
  }
}
