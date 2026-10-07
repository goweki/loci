// lib/whatsapp/actions.ts

"use server";

import { timingSafeEqual } from "node:crypto";
import prisma from "@/lib/prisma";
import {
  MessageType,
  MessageDirection,
  MessageStatus,
  Prisma,
} from "@/lib/prisma/generated";
import { InboundMessage, WabaPhoneNumberDetailsResponse } from "../types";
import { Message } from "../../validations";
import whatsapp from "../";
import {
  GetTokenUsingWabaAuthCodeResult,
  PreVerifiedNumberResponse,
  RequestCodeResponse,
  VerifyNumberResponse,
} from "..//types/waba-api-reponses";
import { getServerSession } from "next-auth";
import { authOptions, requireUser } from "../../auth";
import { env_ } from "../types/environment-variables";
import { UserService } from "@/services/user/user.service";
import { createPhoneNumberAction } from "@/actions/phoneNumber.actions";
import { AgentRuntimeService } from "@/services/agent/agent-runtime.service";
import { matchAutoReplyRule } from "@/services/autoReply/match-rule";
import { shouldHandoffToHuman } from "@/services/agent/agent-helpers";

const BASE_URL = `https://graph.facebook.com/${env_.apiVersion}`;

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
  },
  webhookSecret: string,
): Promise<void> {
  assertWebhookSecret(webhookSecret);
  try {
    console.log("Processing WhatsApp message:", message.id);

    const fromNumber = message.from;
    const phoneNumberId = metadata.phone_number_id;

    if (!phoneNumberId) {
      console.warn(`No phone number id in metadata!`);
      return;
    }

    const phoneNoWithUser = await prisma.phoneNumber.findUnique({
      where: { id: phoneNumberId },
      include: { waba: { include: { user: true } } },
    });
    const user = phoneNoWithUser?.waba?.user;
    if (!phoneNoWithUser || !user) {
      throw new Error(`WhatsApp number ${phoneNumberId} is not assigned to an account.`);
    }

    const duplicate = await prisma.message.findFirst({
      where: { waMessageId: message.id, direction: MessageDirection.INBOUND },
      select: { id: true },
    });
    if (duplicate) return;

    // Process message content based on type
    const content = await processMessageContent(message);

    // Store message in database
    const webhookContact = contacts.find(({ wa_id }) => wa_id === fromNumber);
    const contact = await prisma.contact.upsert({
      where: { userId_phoneNumber: { userId: user.id, phoneNumber: fromNumber } },
      create: {
        userId: user.id,
        phoneNumber: fromNumber,
        name: webhookContact?.profile?.name || null,
      },
      update: {
        lastMessageAt: new Date(),
      },
    });

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
    await processAutoReplies(user.id, phoneNumberId, contact, message);

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
  statusUpdate: WhatsAppStatusUpdate,
  webhookSecret: string,
): Promise<void> {
  assertWebhookSecret(webhookSecret);
  try {
    console.log(
      "Processing status update:",
      statusUpdate.id,
      statusUpdate.status,
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
      statusUpdate.status,
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

function assertWebhookSecret(providedSecret: string) {
  const expectedSecret = process.env.META_APP_SECRET;
  if (!expectedSecret || !providedSecret) {
    throw new Error("This processor can only be called by the verified Meta webhook.");
  }
  const expected = Buffer.from(expectedSecret);
  const provided = Buffer.from(providedSecret);
  if (expected.length !== provided.length || !timingSafeEqual(expected, provided)) {
    throw new Error("This processor can only be called by the verified Meta webhook.");
  }
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
          "document",
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
  mediaType: string,
): Promise<string> {
  try {
    // Step 1: Get media URL from WhatsApp API
    const mediaResponse = await fetch(
      `https://graph.facebook.com/v18.0/${mediaId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.WHATSAPP_ACCESS_TOKEN}`,
        },
      },
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
      mediaInfo.mime_type,
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
  mimeType: string,
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
  whatsappStatus: string,
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
  message: InboundMessage,
): Promise<void> {
  // Implement real-time notification logic
  // Examples:
  // - WebSocket broadcast
  // - Server-Sent Events
  // - Push notifications
  // - Email notifications

  console.log(
    `Notifying user ${userId} of new message from contact ${contactId}`,
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
  phoneNumberId: string,
  contact: any,
  message: InboundMessage,
): Promise<void> {
  const text = message.type === "text"
    ? message.text.body
    : message.type === "interactive"
      ? message.interactive.button_reply?.title ?? message.interactive.list_reply?.title ?? ""
      : "";
  const config = await prisma.chatbotConfig.findUnique({ where: { phoneNumberId } });
  let conversation = config
    ? await prisma.chatbotConversation.findUnique({
        where: {
          chatbotConfigId_contactId: {
            chatbotConfigId: config.id,
            contactId: contact.id,
          },
        },
      })
    : null;

  if (conversation?.handedOffToHuman) return;
  if (
    config?.isActive &&
    text &&
    shouldHandoffToHuman(text, config.humanHandoffKeywords)
  ) {
    conversation = await prisma.chatbotConversation.upsert({
      where: {
        chatbotConfigId_contactId: {
          chatbotConfigId: config.id,
          contactId: contact.id,
        },
      },
      create: {
        chatbotConfigId: config.id,
        contactId: contact.id,
        context: {},
        isActive: false,
        handedOffToHuman: true,
      },
      update: { handedOffToHuman: true, isActive: false, lastMessageAt: new Date() },
    });
    return;
  }

  const rules = await prisma.autoReplyRule.findMany({
    where: { phoneNumberId, createdById: userId, isActive: true },
    orderBy: [{ priority: "asc" }, { createdAt: "asc" }],
  });
  const matchingRule = matchAutoReplyRule(rules, {
    text,
    messageType: message.type.toLocaleUpperCase(),
  });

  if (matchingRule) {
    await sendAssistantText(phoneNumberId, contact, message.id, matchingRule.replyMessage);
    return;
  }

  if (!config?.isActive) return;

  conversation = await prisma.chatbotConversation.upsert({
    where: {
      chatbotConfigId_contactId: {
        chatbotConfigId: config.id,
        contactId: contact.id,
      },
    },
    create: { chatbotConfigId: config.id, contactId: contact.id, context: {} },
    update: {},
  });
  if (conversation.handedOffToHuman || !conversation.isActive) return;
  if (!text) return;

  const history = await prisma.message.findMany({
    where: { userId, contactId: contact.id, phoneNumberId },
    orderBy: { timestamp: "desc" },
    take: Math.min(Math.max(config.conversationHistory, 1), 30),
    select: { content: true, direction: true },
  });
  const runtime = new AgentRuntimeService();
  const response = await runtime.respond({
    ownerId: userId,
    phoneNumberId,
    systemPrompt: config.systemPrompt,
    profileContext: config.profileContext,
    enabledTools: config.enabledTools,
    temperature: config.temperature,
    maxTokens: config.maxTokens,
    history: history.reverse().map((item) => ({
      role: item.direction === MessageDirection.INBOUND ? "user" : "assistant",
      content: extractTextContent(item.content),
    })),
  });

  await sendAssistantText(phoneNumberId, contact, message.id, response);
  await prisma.chatbotConversation.update({
    where: { id: conversation.id },
    data: { messageCount: { increment: 2 }, lastMessageAt: new Date() },
  });
}

async function sendAssistantText(
  phoneNumberId: string,
  contact: { id: string; phoneNumber: string; userId: string },
  incomingMessageId: string,
  text: string,
) {
  const body = text.slice(0, 4000);
  const result = await whatsapp.sendMessage({
    phoneNumberId,
    to: contact.phoneNumber,
    type: MessageType.TEXT,
    text: { body },
    context: { message_id: incomingMessageId },
  });
  if ("error" in result) throw new Error(result.error.message);

  await prisma.message.create({
    data: {
      userId: contact.userId,
      contactId: contact.id,
      phoneNumberId,
      waMessageId: result.messages[0]?.id,
      type: MessageType.TEXT,
      content: { text: body },
      direction: MessageDirection.OUTBOUND,
      status: MessageStatus.SENT,
      timestamp: new Date(),
    },
  });
}

function extractTextContent(content: Prisma.JsonValue): string {
  if (typeof content === "string") return content;
  if (content && typeof content === "object" && !Array.isArray(content)) {
    if (typeof content.text === "string") return content.text;
    if (typeof content.caption === "string") return content.caption;
  }
  return "";
}

/**
 * Store failed message for retry
 */
async function storeFailedMessage(
  message: InboundMessage,
  error: any,
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
    case MessageType.TEXT:
      if (!input.text)
        throw new Error(`text field is required for type "text"`);
      message.text = input.text;
      break;

    case MessageType.AUDIO:
      if (!input.audio) throw new Error(`audio is required for type "audio"`);
      message.audio = input.audio;
      break;

    case MessageType.CONTACT:
      if (!input.contacts)
        throw new Error(`contacts is required for type "contacts"`);
      message.contacts = input.contacts;
      break;

    case MessageType.DOCUMENT:
      if (!input.document)
        throw new Error(`document is required for type "document"`);
      message.document = input.document;
      break;

    case MessageType.IMAGE:
      if (!input.image) throw new Error(`image is required for type "image"`);
      message.image = input.image;
      break;

    case MessageType.LOCATION:
      if (!input.location)
        throw new Error(`location is required for type "location"`);
      message.location = input.location;
      break;

    case MessageType.VIDEO:
      if (!input.video) throw new Error(`video is required for type "video"`);
      message.video = input.video;
      break;

    case MessageType.TEMPLATE:
      if (!input.template)
        throw new Error(`template is required for type "template"`);
      message.template = input.template;
      break;

    case "INTERACTIVE":
      if (!input.interactive)
        throw new Error(`interactive is required for type "interactive"`);
      message.interactive = input.interactive;
      break;

    case "REACTION":
      if (!input.reaction)
        throw new Error(`reaction is required for type "reaction"`);
      message.reaction = input.reaction;
      break;

    case "STICKER":
      if (!input.sticker)
        throw new Error(`sticker is required for type "sticker"`);
      message.sticker = input.sticker;
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
  phoneNumber: string,
): Promise<PreVerifiedNumberResponse> {
  const session = await getServerSession(authOptions);
  const userId = session?.user.id;
  if (!userId) {
    throw new Error("401: Unauthorized");
  }

  const user = await UserService.getUserByKey(userId, { waba: true });
  if (!user) {
    throw new Error("401: Unauthorized");
  }
  if (!user.waba) {
    throw new Error("400: No waba connected");
  }

  const url = `${BASE_URL}/${env_.fbBusinessId}/add_phone_numbers?phone_number=${phoneNumber}`;

  console.log(`Creating new preverified WhatsApp No....\n
     >>> Whatsapp Number: ${phoneNumber}\n
     >>> url: ${url}`);

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${env_.wabaAccessToken}`,
    },
  });

  if (!res.ok) {
    const text = await res.text();
    console.error(text);
    throw new Error(`Failed: Try again later`);
  }
  const { preverificationId }: PreVerifiedNumberResponse = await res.json();
  await createPhoneNumberAction({
    phoneNumber,
    wabaId: user.waba.id,
    preVerificationId: preverificationId,
  });

  return { preverificationId };
}

/**
 * Request a verification code (OTP) for a pre-verified number
 */
export async function requestVerificationCode(
  baseUrl: string,
  preVerifiedNumberId: string,
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
      Authorization: `Bearer ${env_.wabaAccessToken}`,
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
  wabaAccessToken: string,
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
  appSecret: string,
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
