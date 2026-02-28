# WhatsApp Integration SaaS - Technical Documentation

## Table of Contents

1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Technology Stack](#technology-stack)
4. [Database Design](#database-design)
5. [Authentication & Authorization](#authentication--authorization)
6. [WhatsApp Business API Integration](#whatsapp-business-api-integration)
7. [Payment System](#payment-system)
8. [API Endpoints](#api-endpoints)
9. [Frontend Components](#frontend-components)
10. [Security Considerations](#security-considerations)
11. [Deployment & Infrastructure](#deployment--infrastructure)
12. [Development Guidelines](#development-guidelines)

## Project Overview

A SaaS platform that enables clients to integrate WhatsApp messaging capabilities into their business operations. Users can manage multiple WhatsApp Business numbers, send/receive messages, and access analytics through a unified dashboard.

### Key Features

- Multi-tenant architecture with user authentication
- WhatsApp Business API integration
- Subscription-based billing system
- Real-time messaging interface
- Custom phone number management
- Message history and analytics
- Responsive UI with dark/light theme support

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Next.js App   │    │   PostgreSQL    │    │  WhatsApp API   │
│   (Frontend +   │◄──►│    Database     │    │                 │
│    API Routes)  │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                                              ▲
         ▼                                              │
┌─────────────────┐    ┌─────────────────┐             │
│  Payment Gateway│    │   File Storage  │             │
│   (Stripe/etc)  │    │   (AWS S3/etc)  │             │
└─────────────────┘    └─────────────────┘             │
                                                        │
┌─────────────────┐                                     │
│   Redis Cache   │                                     │
│   (Sessions +   │                                     │
│   Rate Limiting)│                                     │
└─────────────────┘                                     │
                                                        │
┌─────────────────────────────────────────────────────┘
│                Webhooks
└─────────────────────────────────────────────────────┐
                                                      ▼
┌─────────────────┐
│   Queue System  │
│  (Redis/Bull)   │
└─────────────────┘
```

### Folder Structure

```
├── app/
│   ├── (auth)/
│   │   ├── sign-in/
│   │   ├── sign-up/
│   │   ├── reset-password/
│   │   └── layout.tsx
│   ├── (public)/
│   │   ├── blog/
│   │   ├── contact-us/
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── (protected)/
│   │   ├── sign-out/
│   │   ├── dashboard/
│   │   ├── messages/
│   │   ├── contacts/
│   │   ├── phone-numbers/
│   │   ├── billing/
│   │   └── layout.tsx
│   ├── api/
│   │   ├── auth/
│   │   ├── messages/
│   │   ├── contacts/
│   │   ├── phone-numbers/
│   │   ├── billing/
│   │   ├── webhooks/
│   │   └── whatsapp/
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── components/
│   ├── ui/ (shadcn components)
│   ├── auth/
│   ├── dashboard/
│   ├── messages/
│   └── shared/
├── lib/
│   ├── auth/
│   ├── prisma/
│   ├── whatsapp.ts
│   ├── payments.ts
│   ├── utils
│   └── validations.ts
├── types/
└── hooks/
```

## Technology Stack

### Core Technologies

- **Framework**: Next.js 15 (App Router)
- **Database**: PostgreSQL with Prisma ORM
- **UI**: Tailwind CSS + shadcn/ui components
- **Theme**: next-themes for dark/light mode
- **Authentication**: NextAuth.js or custom JWT
- **Payment**: Stripe or similar
- **WhatsApp API**: WhatsApp Business API
- **Real-time**: WebSockets or Server-Sent Events
- **Queue**: Redis with Bull Queue
- **File Upload**: AWS S3 or similar

### Development Tools

- **TypeScript**: Full type safety
- **ESLint + Prettier**: Code formatting
- **Husky**: Git hooks
- **Jest**: Testing framework
- **Docker**: Containerization

## Database Design

### Prisma Schema

```prisma
// lib/prisma/schema.prisma
// This is your Prisma schema file,
// learn more about it in the docs: https://pris.ly/d/prisma-schema

// Looking for ways to speed up your queries, or scale easily with your serverless or edge functions?
// Try Prisma Accelerate: https://pris.ly/cli/accelerate-init

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String     @id @default(cuid())
  name          String?
  email         String     @unique
  emailVerified DateTime?
  image         String?
  password      String // Keep for credentials provider
  role          UserRole   @default(USER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime   @default(now())
  updatedAt     DateTime   @updatedAt

  accounts      Account[]
  sessions      Session[]
  subscription  Subscription?
  phoneNumbers  PhoneNumber[]
  messages      Message[]
  contacts      Contact[]
  AutoReplyRule AutoReplyRule[]

  @@map("users")
}

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

// model VerificationToken {
//   identifier String
//   token      String   @unique
//   expires    DateTime

//   @@unique([identifier, token])
//   @@map("verificationtokens")
// }

model Subscription {
  id                   String             @id @default(cuid())
  userId               String             @unique
  planId               String
  status               SubscriptionStatus
  currentPeriodStart   DateTime
  currentPeriodEnd     DateTime
  cancelAtPeriodEnd    Boolean            @default(false)
  stripeCustomerId     String?
  stripeSubscriptionId String?
  createdAt            DateTime           @default(now())
  updatedAt            DateTime           @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  plan Plan @relation(fields: [planId], references: [id])

  @@map("subscriptions")
}

model Plan {
  id                  String       @id @default(cuid())
  name                String
  description         String?
  price               Int // in cents
  interval            PlanInterval
  features            Json
  maxPhoneNumbers     Int
  maxMessagesPerMonth Int
  active              Boolean      @default(true)
  createdAt           DateTime     @default(now())
  updatedAt           DateTime     @updatedAt

  subscriptions Subscription[]

  @@map("plans")
}

model PhoneNumber {
  id            String            @id @default(cuid())
  userId        String
  phoneNumber   String            @unique
  displayName   String?
  wabaId        String? // WhatsApp Business Account ID
  phoneNumberId String? // WhatsApp Phone Number ID
  status        PhoneNumberStatus @default(PENDING)
  verifiedAt    DateTime?
  createdAt     DateTime          @default(now())
  updatedAt     DateTime          @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@map("phone_numbers")
}

model Contact {
  id            String    @id @default(cuid())
  userId        String
  phoneNumber   String
  name          String?
  avatar        String?
  lastMessageAt DateTime?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  user     User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  messages Message[]

  @@unique([userId, phoneNumber])
  @@map("contacts")
}

model Message {
  id            String           @id @default(cuid())
  userId        String
  contactId     String
  phoneNumberId String
  waMessageId   String? // WhatsApp Message ID
  type          MessageType
  content       Json // Flexible content structure
  direction     MessageDirection
  status        MessageStatus    @default(SENT)
  timestamp     DateTime
  createdAt     DateTime         @default(now())
  updatedAt     DateTime         @updatedAt

  user        User        @relation(fields: [userId], references: [id], onDelete: Cascade)
  contact     Contact     @relation(fields: [contactId], references: [id], onDelete: Cascade)
  phoneNumber PhoneNumber @relation(fields: [phoneNumberId], references: [id], onDelete: Cascade)

  @@map("messages")
}

model MessageUnprocessed {
  id          String   @id @default(cuid())
  waMessageId String // WhatsApp message ID
  payload     Json // Full WhatsApp payload
  error       String // Error message
  retryCount  Int      @default(0)
  nextRetry   DateTime
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
}

enum TriggerType {
  KEYWORD // Match specific keywords in message
  MESSAGE_TYPE // Match by WhatsApp message type (text, image, video, etc.)
  DEFAULT // Fallback when no rule matches
  TIME_BASED // (Optional) Trigger during specific time windows
}

model AutoReplyRule {
  id           String      @id @default(cuid())
  userId       String
  name         String
  active       Boolean     @default(true)
  triggerType  TriggerType
  triggerValue String? // Keyword or type (depends on triggerType)
  replyMessage String
  isActive     Boolean     @default(true)
  priority     Int         @default(0)
  createdAt    DateTime    @default(now())
  updatedAt    DateTime    @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
}

model WebhookEvent {
  id        String   @id @default(cuid())
  type      String
  payload   Json
  processed Boolean  @default(false)
  createdAt DateTime @default(now())

  @@map("webhook_events")
}

// Enums
enum UserRole {
  USER
  ADMIN
}

enum UserStatus {
  ACTIVE
  SUSPENDED
  INACTIVE
}

enum SubscriptionStatus {
  ACTIVE
  CANCELED
  PAST_DUE
  UNPAID
}

enum PlanInterval {
  MONTHLY
  YEARLY
}

enum PhoneNumberStatus {
  PENDING
  VERIFIED
  FAILED
}

enum MessageType {
  TEXT
  IMAGE
  DOCUMENT
  AUDIO
  VIDEO
  LOCATION
  CONTACT
  TEMPLATE
}

enum MessageDirection {
  INBOUND
  OUTBOUND
}

enum MessageStatus {
  SENT
  DELIVERED
  READ
  FAILED
}

// If using NextAuth.js, add these models:

model Account {
  id                String  @id @default(cuid())
  userId            String
  type              String
  provider          String
  providerAccountId String
  refresh_token     String? @db.Text
  access_token      String? @db.Text
  expires_at        Int?
  token_type        String?
  scope             String?
  id_token          String? @db.Text
  session_state     String?

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([provider, providerAccountId])
  @@map("accounts")
}

```

## Authentication & Authorization

### NextAuth.js Configuration

```typescript
// lib/auth/index.ts
import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { db } from "./db";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: { subscription: true },
        });

        if (
          !user ||
          !(await bcrypt.compare(credentials.password, user.password))
        ) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: { strategy: "jwt" },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = token.sub;
      session.user.role = token.role;
      return session;
    },
  },
};
```

### Middleware for Route Protection

```typescript
// middleware.ts
import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth/jwt";

const PUBLIC_ROUTES = ["/", "/login", "/register", "/forgot-password"];

const PUBLIC_API_PREFIXES = ["/api/auth", "/api/webhooks"];

// static assets / special paths to skip middleware
const IGNORE_PATHS = [
  "/_next", // Next.js build files
  "/favicon.ico", // Favicon
  "/assets", // Public assets
  "/images", // Public images
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Ignore Next.js internals & static files
  if (IGNORE_PATHS.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 2. Public routes (exact match)
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // 3. Public API routes (prefix match)
  if (PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))) {
    return NextResponse.next();
  }

  // 4. Get token from cookies
  const token = request.cookies.get("auth-token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 5. Verify token
  const payload = verifyJWT(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  // 6. Attach user info to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-role", payload.role);

  return NextResponse.next({
    request: { headers: requestHeaders },
  });
}

// Matcher: apply middleware only to certain routes
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|assets|images).*)"],
};
```

## WhatsApp Business API Integration

### WhatsApp API Client

```typescript
// lib/whatsapp.ts

interface WhatsAppConfig {
  accessToken: string;
  phoneNumberId: string;
  wabaId: string;
  verifyToken: string;
}

export class WhatsAppClient {
  private config: WhatsAppConfig;
  private baseUrl = "https://graph.facebook.com/v18.0";

  constructor(config: WhatsAppConfig) {
    this.config = config;
  }

  async sendMessage(to: string, message: MessagePayload) {
    const response = await fetch(
      `${this.baseUrl}/${this.config.phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${this.config.accessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to,
          ...message,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`WhatsApp API error: ${response.statusText}`);
    }

    return response.json();
  }

  async sendTextMessage(to: string, text: string) {
    return this.sendMessage(to, {
      type: "text",
      text: { body: text },
    });
  }

  async sendMediaMessage(
    to: string,
    type: "image" | "document" | "audio" | "video",
    mediaUrl: string,
    caption?: string
  ) {
    return this.sendMessage(to, {
      type,
      [type]: {
        link: mediaUrl,
        caption,
      },
    });
  }

  async sendTemplateMessage(
    to: string,
    templateName: string,
    language: string,
    parameters?: any[]
  ) {
    return this.sendMessage(to, {
      type: "template",
      template: {
        name: templateName,
        language: { code: language },
        components: parameters
          ? [
              {
                type: "body",
                parameters,
              },
            ]
          : undefined,
      },
    });
  }
}

interface MessagePayload {
  type: string;
  text?: { body: string };
  image?: { link: string; caption?: string };
  document?: { link: string; caption?: string };
  audio?: { link: string };
  video?: { link: string; caption?: string };
  template?: {
    name: string;
    language: { code: string };
    components?: any[];
  };
}
```

### Webhook Handler

```typescript
// app/api/webhooks/whatsapp/route.ts
import { NextRequest, NextResponse } from "next/server";
import db from "@/lib/prisma";
import { processIncomingMessage } from "@/lib/waMessageProcessor";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("hub.mode");
  const token = searchParams.get("hub.verify_token");
  const challenge = searchParams.get("hub.challenge");

  if (mode === "subscribe" && token === process.env.WEBHOOK_VERIFY_TOKEN) {
    return new NextResponse(challenge);
  }

  return new NextResponse("Forbidden", { status: 403 });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Store webhook event for processing
    await db.webhookEvent.create({
      data: {
        type: "whatsapp_webhook",
        payload: body,
      },
    });

    // Process webhook in background
    await processWebhookEvent(body);

    return new NextResponse("OK");
  } catch (error) {
    console.error("Webhook processing error:", error);
    return new NextResponse("Internal Server Error", { status: 500 });
  }
}

async function processWebhookEvent(body: any) {
  const entry = body.entry?.[0];
  const changes = entry?.changes?.[0];

  if (changes?.field === "messages") {
    const messages = changes.value?.messages || [];
    const contacts = changes.value?.contacts || [];

    for (const message of messages) {
      await processIncomingMessage(message, contacts);
    }
  }
}
```

## API Endpoints

### Messages API

```typescript
// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import { WhatsAppClient } from "@/lib/whatsapp";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const { searchParams } = new URL(request.url);
  const contactId = searchParams.get("contactId");
  const phoneNumberId = searchParams.get("phoneNumberId");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");

  const messages = await db.message.findMany({
    where: {
      userId: session.user.id,
      ...(contactId && { contactId }),
      ...(phoneNumberId && { phoneNumberId }),
    },
    include: {
      contact: true,
      phoneNumber: true,
    },
    orderBy: { timestamp: "desc" },
    take: limit,
    skip: (page - 1) * limit,
  });

  return NextResponse.json({ messages });
}

export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  const { phoneNumberId, to, type, content } = body;

  // Validate phone number ownership
  const phoneNumber = await db.phoneNumber.findFirst({
    where: {
      id: phoneNumberId,
      userId: session.user.id,
      status: "VERIFIED",
    },
  });

  if (!phoneNumber) {
    return new NextResponse("Phone number not found", { status: 404 });
  }

  // Check subscription limits
  const subscription = await db.subscription.findUnique({
    where: { userId: session.user.id },
    include: { plan: true },
  });

  if (!subscription || subscription.status !== "ACTIVE") {
    return new NextResponse("Active subscription required", { status: 402 });
  }

  // Send message via WhatsApp API
  const whatsappClient = new WhatsAppClient({
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN!,
    phoneNumberId: phoneNumber.phoneNumberId!,
    wabaId: phoneNumber.wabaId!,
    verifyToken: process.env.WEBHOOK_VERIFY_TOKEN!,
  });

  try {
    let waResponse;
    if (type === "text") {
      waResponse = await whatsappClient.sendTextMessage(to, content.text);
    } else if (type === "image") {
      waResponse = await whatsappClient.sendMediaMessage(
        to,
        "image",
        content.url,
        content.caption
      );
    }
    // Add other message types...

    // Find or create contact
    const contact = await db.contact.upsert({
      where: {
        userId_phoneNumber: {
          userId: session.user.id,
          phoneNumber: to,
        },
      },
      create: {
        userId: session.user.id,
        phoneNumber: to,
        name: content.contactName || null,
      },
      update: {
        lastMessageAt: new Date(),
      },
    });

    // Store message in database
    const message = await db.message.create({
      data: {
        userId: session.user.id,
        contactId: contact.id,
        phoneNumberId: phoneNumber.id,
        waMessageId: waResponse.messages[0].id,
        type,
        content,
        direction: "OUTBOUND",
        status: "SENT",
        timestamp: new Date(),
      },
      include: {
        contact: true,
        phoneNumber: true,
      },
    });

    return NextResponse.json({ message });
  } catch (error) {
    console.error("Message sending error:", error);
    return new NextResponse("Failed to send message", { status: 500 });
  }
}
```

### Phone Numbers API

```typescript
// app/api/phone-numbers/route.ts
export async function POST(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session) return new NextResponse("Unauthorized", { status: 401 });

  const body = await request.json();
  const { phoneNumber, displayName } = body;

  // Check subscription limits
  const user = await db.user.findUnique({
    where: { id: session.user.id },
    include: {
      subscription: { include: { plan: true } },
      phoneNumbers: true,
    },
  });

  if (!user?.subscription || user.subscription.status !== "ACTIVE") {
    return new NextResponse("Active subscription required", { status: 402 });
  }

  if (user.phoneNumbers.length >= user.subscription.plan.maxPhoneNumbers) {
    return new NextResponse("Phone number limit reached", { status: 400 });
  }

  // Create phone number record
  const newPhoneNumber = await db.phoneNumber.create({
    data: {
      userId: session.user.id,
      phoneNumber,
      displayName,
      status: "PENDING",
    },
  });

  // TODO: Implement WhatsApp Business API registration flow

  return NextResponse.json({ phoneNumber: newPhoneNumber });
}
```

## Frontend Components

### Message Interface Component

```typescript
// components/messages/MessageInterface.tsx
"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Paperclip } from "lucide-react";

interface Message {
  id: string;
  type: string;
  content: any;
  direction: "INBOUND" | "OUTBOUND";
  timestamp: string;
  status: string;
}

interface MessageInterfaceProps {
  contactId: string;
  phoneNumberId: string;
}

export function MessageInterface({
  contactId,
  phoneNumberId,
}: MessageInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    fetchMessages();
  }, [contactId, phoneNumberId]);

  const fetchMessages = async () => {
    const response = await fetch(
      `/api/messages?contactId=${contactId}&phoneNumberId=${phoneNumberId}`
    );
    const data = await response.json();
    setMessages(data.messages.reverse());
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumberId,
          to: contactId,
          type: "text",
          content: { text: newMessage },
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages((prev) => [...prev, data.message]);
        setNewMessage("");
      }
    } catch (error) {
      console.error("Failed to send message:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-1 p-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`mb-4 flex ${
              message.direction === "OUTBOUND" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`max-w-[70%] rounded-lg p-3 ${
                message.direction === "OUTBOUND"
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted"
              }`}
            >
              {message.type === "text" && <p>{message.content.text}</p>}
              {message.type === "image" && (
                <div>
                  <img
                    src={message.content.url}
                    alt=""
                    className="rounded mb-2"
                  />
                  {message.content.caption && <p>{message.content.caption}</p>}
                </div>
              )}
              <div className="text-xs opacity-70 mt-1">
                {new Date(message.timestamp).toLocaleTimeString()}
              </div>
            </div>
          </div>
        ))}
      </ScrollArea>

      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <Button variant="outline" size="icon">
            <Paperclip className="h-4 w-4" />
          </Button>
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            onKeyPress={(e) => e.key === "Enter" && sendMessage()}
            className="flex-1"
          />
          <Button onClick={sendMessage} disabled={isLoading}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
```

### Dashboard Layout

```typescript
// app/dashboard/layout.tsx
import { Sidebar } from "@/components/dashboard/Sidebar";
import { Header } from "@/components/dashboard/Header";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className="pl-64">
        <Header />
        <main className="p-8">{children}</main>
      </div>
    </div>
  );
}
```

## Security Considerations

### Rate Limiting

```typescript
// lib/rate-limit.ts
import { Redis } from "ioredis";

const redis = new Redis(process.env.REDIS_URL!);

export async function rateLimit(
  identifier: string,
  limit: number,
  window: number
): Promise<{
  success: boolean;
  limit: number;
  remaining: number;
  reset: Date;
}> {
  const key = `rate_limit:${identifier}`;
  const current = await redis.get(key);

  if (current === null) {
    await redis.setex(key, window, 1);
    return {
      success: true,
      limit,
      remaining: limit - 1,
      reset: new Date(Date.now() + window * 1000),
    };
  }

  const count = parseInt(current);
  if (count >= limit) {
    const ttl = await redis.ttl(key);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: new Date(Date.now() + ttl * 1000),
    };
  }

  await redis.incr(key);
  const ttl = await redis.ttl(key);

  return {
    success: true,
    limit,
    remaining: limit - count - 1,
    reset: new Date(Date.now() + ttl * 1000),
  };
}
```

### Input Validation

```typescript
// lib/validations.ts
import { z } from "zod";

export const messageSchema = z.object({
  phoneNumberId: z.string().cuid(),
  to: z.string().regex(/^\+[1-9]\d{1,14}$/),
  type: z.enum(["text", "image", "document", "audio", "video"]),
  content: z.object({
    text: z.string().max(4096).optional(),
    url: z.string().url().optional(),
    caption: z.string().max(1024).optional(),
  }),
});

export const phoneNumberSchema = z.object({
  phoneNumber: z.string().regex(/^\+[1-9]\d{1,14}$/),
  displayName: z.string().min(1).max(100).optional(),
});
```

### Environment Variables

```bash
# .env.example
DATABASE_URL="postgresql://username:password@localhost:5432/whatsapp_saas"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-secret
```
