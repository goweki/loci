# Authentication Implementation Guide

## Table of Contents

1. [Authentication Strategy Overview](#authentication-strategy-overview)
2. [NextAuth.js Implementation](#nextauthjs-implementation)
3. [Custom JWT Authentication](#custom-jwt-authentication)
4. [Database Setup](#database-setup)
5. [Middleware & Route Protection](#middleware--route-protection)
6. [Frontend Components](#frontend-components)
7. [API Authentication](#api-authentication)
8. [Session Management](#session-management)
9. [Security Best Practices](#security-best-practices)

## Authentication Strategy Overview

For a WhatsApp SaaS platform, you have several authentication options:

### Option 1: NextAuth.js (Recommended)

- **Pros**: Battle-tested, handles OAuth, session management, database integration
- **Cons**: Some overhead, less control over auth flow
- **Best for**: Quick setup, OAuth providers, enterprise features

### Option 2: Custom JWT + Session Hybrid

- **Pros**: Full control, optimized for your use case, lighter weight
- **Cons**: More implementation work, security considerations
- **Best for**: Custom requirements, API-heavy applications

### Option 3: Custom Database Sessions

- **Pros**: Simple, secure, easy to manage
- **Cons**: Database overhead, scaling considerations
- **Best for**: Traditional web apps, high security requirements

## NextAuth.js Implementation

### 1. Installation & Setup

```bash
npm install next-auth @next-auth/prisma-adapter
npm install @types/next-auth # if using TypeScript
```

### 2. NextAuth Configuration

```typescript
// lib/auth.ts
import { NextAuthOptions, DefaultSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { db } from "./db";
import bcrypt from "bcryptjs";

// Extend NextAuth types
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      role: string;
      subscription?: {
        status: string;
        plan: string;
      };
    } & DefaultSession["user"];
  }

  interface User {
    role: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    role: string;
    subscriptionStatus?: string;
  }
}

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
          throw new Error("Missing credentials");
        }

        const user = await db.user.findUnique({
          where: { email: credentials.email },
          include: {
            subscription: {
              include: { plan: true },
            },
          },
        });

        if (!user) {
          throw new Error("User not found");
        }

        if (user.status !== "ACTIVE") {
          throw new Error("Account suspended");
        }

        const passwordMatch = await bcrypt.compare(
          credentials.password,
          user.password
        );

        if (!passwordMatch) {
          throw new Error("Invalid password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          image: user.avatar,
        };
      },
    }),
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT for better performance
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  pages: {
    signIn: "/auth/signin",
    signUp: "/auth/signup",
    error: "/auth/error",
  },
  callbacks: {
    async jwt({ token, user, trigger, session }) {
      // Initial sign in
      if (user) {
        token.role = user.role;
        token.id = user.id;
      }

      // Session update
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      // Refresh subscription status periodically
      if (
        token.id &&
        Date.now() - (token.iat || 0) * 1000 > 24 * 60 * 60 * 1000
      ) {
        try {
          const userWithSubscription = await db.user.findUnique({
            where: { id: token.id as string },
            include: { subscription: true },
          });

          if (userWithSubscription) {
            token.subscriptionStatus =
              userWithSubscription.subscription?.status;
          }
        } catch (error) {
          console.error("Error refreshing user data:", error);
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
        if (token.subscriptionStatus) {
          session.user.subscription = {
            status: token.subscriptionStatus as string,
            plan: "", // Add plan info if needed
          };
        }
      }
      return session;
    },
    async signIn({ user, account, profile }) {
      // Custom sign-in logic
      if (account?.provider === "google") {
        // Handle Google OAuth sign-in
        const existingUser = await db.user.findUnique({
          where: { email: user.email! },
        });

        if (!existingUser) {
          // Create new user for Google sign-in
          await db.user.create({
            data: {
              email: user.email!,
              name: user.name || "",
              avatar: user.image,
              password: "", // No password for OAuth users
              role: "USER",
              status: "ACTIVE",
            },
          });
        }
      }

      return true;
    },
  },
  events: {
    async signIn({ user, account, isNewUser }) {
      console.log(`User ${user.email} signed in via ${account?.provider}`);
    },
    async signOut({ session }) {
      console.log(`User signed out`);
    },
  },
};
```

### 3. API Route Handler

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
```

### 4. Session Provider Setup

```typescript
// app/providers.tsx
"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

```typescript
// app/layout.tsx
import { Providers } from "./providers";

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
```

## Custom JWT Authentication

### 1. JWT Utility Functions

```typescript
// lib/jwt.ts
import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET!;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
  userId: string;
  email: string;
  role: string;
  subscriptionStatus?: string;
}

export function signJWT(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

export function verifyJWT(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function refreshToken(token: string): string | null {
  const payload = verifyJWT(token);
  if (!payload) return null;

  // Generate new token with updated expiry
  return signJWT({
    userId: payload.userId,
    email: payload.email,
    role: payload.role,
    subscriptionStatus: payload.subscriptionStatus,
  });
}
```

### 2. Custom Auth API Routes

```typescript
// app/api/auth/login/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signJWT } from "@/lib/jwt";
import { loginSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password } = loginSchema.parse(body);

    // Find user
    const user = await db.user.findUnique({
      where: { email },
      include: { subscription: true },
    });

    if (!user || user.status !== "ACTIVE") {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Verify password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return NextResponse.json(
        { error: "Invalid credentials" },
        { status: 401 }
      );
    }

    // Generate JWT
    const token = signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
      subscriptionStatus: user.subscription?.status,
    });

    // Set HTTP-only cookie
    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
    });

    return response;
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

```typescript
// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { signJWT } from "@/lib/jwt";
import { registerSchema } from "@/lib/validations";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name } = registerSchema.parse(body);

    // Check if user exists
    const existingUser = await db.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await db.user.create({
      data: {
        email,
        name,
        password: hashedPassword,
        role: "USER",
        status: "ACTIVE",
      },
    });

    // Generate JWT
    const token = signJWT({
      userId: user.id,
      email: user.email,
      role: user.role,
    });

    const response = NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
    });

    response.cookies.set({
      name: "auth-token",
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

### 3. Auth Context for Client-Side

```typescript
// lib/auth-context.tsx
"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const response = await fetch("/api/auth/me");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData.user);
      }
    } catch (error) {
      console.error("Auth check failed:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Login failed");
    }

    const data = await response.json();
    setUser(data.user);
  };

  const register = async (email: string, password: string, name: string) => {
    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password, name }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Registration failed");
    }

    const data = await response.json();
    setUser(data.user);
  };

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
```

## Database Setup

### 1. Update Prisma Schema for NextAuth

```prisma
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

model Session {
  id           String   @id @default(cuid())
  sessionToken String   @unique
  userId       String
  expires      DateTime
  user         User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}

model VerificationToken {
  identifier String
  token      String   @unique
  expires    DateTime

  @@unique([identifier, token])
  @@map("verificationtokens")
}

// Update User model to include NextAuth fields
model User {
  id            String    @id @default(cuid())
  name          String?
  email         String    @unique
  emailVerified DateTime?
  image         String?
  password      String    // Keep for credentials provider
  role          Role      @default(USER)
  status        UserStatus @default(ACTIVE)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  accounts      Account[]
  sessions      Session[]
  subscription  Subscription?
  phoneNumbers  PhoneNumber[]
  messages      Message[]
  contacts      Contact[]

  @@map("users")
}
```

### 2. Migration Commands

```bash
# Generate and apply migrations
npx prisma migrate dev --name add-auth-tables
npx prisma generate
```

## Middleware & Route Protection

### 1. Authentication Middleware

```typescript
// middleware.ts
import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Subscription check for premium features
    if (
      pathname.startsWith("/dashboard/analytics") ||
      pathname.startsWith("/dashboard/automation")
    ) {
      if (token?.subscriptionStatus !== "ACTIVE") {
        return NextResponse.redirect(new URL("/billing", req.url));
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes
        if (
          pathname === "/" ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/api/auth") ||
          pathname.startsWith("/api/webhooks")
        ) {
          return true;
        }

        // Protected routes require authentication
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: ["/((?!api/webhooks|_next/static|_next/image|favicon.ico).*)"],
};
```

### 2. Custom Middleware for JWT

```typescript
// middleware.ts (for custom JWT)
import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "./lib/jwt";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/webhooks")
  ) {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get("auth-token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Verify token
  const payload = verifyJWT(token);
  if (!payload) {
    return NextResponse.redirect(new URL("/auth/login", request.url));
  }

  // Add user info to headers for API routes
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-user-id", payload.userId);
  requestHeaders.set("x-user-role", payload.role);

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });
}
```

## Frontend Components

### 1. Login Component

```typescript
// components/auth/LoginForm.tsx
"use client";

import { useState } from "react";
import { signIn } from "next-auth/react"; // or useAuth for custom
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Invalid credentials");
      } else {
        window.location.href = "/dashboard";
      }
    } catch (error) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Sign In</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </Button>

          <div className="text-center">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => signIn("google")}
            >
              Sign in with Google
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
```

### 2. Protected Route Component

```typescript
// components/auth/ProtectedRoute.tsx
"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiresSubscription?: boolean;
}

export function ProtectedRoute({
  children,
  requiredRole,
  requiresSubscription = false,
}: ProtectedRouteProps) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;

    if (!session) {
      router.push("/auth/signin");
      return;
    }

    if (requiredRole && session.user.role !== requiredRole) {
      router.push("/dashboard");
      return;
    }

    if (
      requiresSubscription &&
      session.user.subscription?.status !== "ACTIVE"
    ) {
      router.push("/billing");
      return;
    }
  }, [session, status, requiredRole, requiresSubscription, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!session) {
    return null;
  }

  return <>{children}</>;
}
```

## API Authentication

### 1. API Authentication Helper

```typescript
// lib/api-auth.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { NextRequest } from "next/server";

export async function getAuthenticatedUser(request?: NextRequest) {
  const session = await getServerSession(authOptions);

  if (!session?.user) {
    throw new Error("Unauthorized");
  }

  return session.user;
}

export async function requireAuth(request?: NextRequest) {
  const user = await getAuthenticatedUser(request);
  return user;
}

export async function requireRole(role: string, request?: NextRequest) {
  const user = await requireAuth(request);

  if (user.role !== role) {
    throw new Error("Forbidden");
  }

  return user;
}

export async function requireSubscription(request?: NextRequest) {
  const user = await requireAuth(request);

  if (user.subscription?.status !== "ACTIVE") {
    throw new Error("Active subscription required");
  }

  return user;
}
```

### 2. Protected API Route Example

```typescript
// app/api/messages/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireSubscription } from "@/lib/api-auth";
import { db } from "@/lib/db";

export async function GET(request: NextRequest) {
  try {
    const user = await requireSubscription(request);

    const messages = await db.message.findMany({
      where: { userId: user.id },
      include: { contact: true, phoneNumber: true },
      orderBy: { timestamp: "desc" },
    });

    return NextResponse.json({ messages });
  } catch (error) {
    if (error.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (error.message === "Active subscription required") {
      return NextResponse.json(
        { error: "Subscription required" },
        { status: 402 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

## Session Management

### 1. Session Update Function

```typescript
// lib/session-utils.ts
import { getServerSession } from "next-auth";
import { authOptions } from "./auth";
import { db } from "./db";

export async function updateUserSession(userId: string) {
  // Trigger session update with fresh user data
  const user = await db.user.findUnique({
    where: { id: userId },
    include: { subscription: true },
  });

  if (user) {
    // This will trigger the JWT callback to refresh the session
    return {
      ...user,
      subscriptionStatus: user.subscription?.status,
    };
  }
}
```

### 2. Client-Side Session Updates

```typescript
// hooks/useSessionUpdate.ts
import { useSession } from "next-auth/react";

export function useSessionUpdate() {
  const { data: session, update } = useSession();

  const updateSession = async (data: any) => {
    await update(data);
  };

  const refreshSession = async () => {
    await update();
  };

  return { session, updateSession, refreshSession };
}
```

## Security Best Practices

### 1. Environment Variables

```bash
# .env.local
NEXTAUTH_SECRET="your-very-long-random-secret-key"
NEXTAUTH_URL="http://localhost:3000"

# Database
DATABASE_URL="postgresql://..."

# OAuth Providers
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Custom JWT (if not using NextAuth)
JWT_SECRET="your-jwt-secret"
JWT_EXPIRES_IN="7d"

# Rate limiting
REDIS_URL="redis://localhost:6379"
```

### 2. Input Validation Schemas

```typescript
// lib/validations.ts
import { z } from "zod";

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const registerSchema = z
  .object({
    email: z.string().email("Invalid email address"),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters")
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        "Password must contain uppercase, lowercase, and number"
      ),
    name: z.string().min(2, "Name must be at least 2 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });
```

### 3. Rate Limiting

```typescript
// lib/rate-limit.ts
import { NextRequest } from "next/server";

const attempts = new Map();

export function rateLimit(
  request: NextRequest,
  maxAttempts: number = 5,
  windowMs: number = 15 * 60 * 1000 // 15 minutes
) {
  const ip = request.ip || request.headers.get("x-forwarded-for") || "unknown";
  const now = Date.now();
  const userAttempts = attempts.get(ip) || {
    count: 0,
    resetTime: now + windowMs,
  };

  if (now > userAttempts.resetTime) {
    userAttempts.count = 0;
    userAttempts.resetTime = now + windowMs;
  }

  userAttempts.count++;
  attempts.set(ip, userAttempts);

  return userAttempts.count <= maxAttempts;
}
```

This comprehensive authentication implementation provides multiple options and security layers for your WhatsApp SaaS platform. Choose the approach that best fits your needs - NextAuth.js for quick setup with OAuth support, or custom JWT for more control over the authentication flow.
