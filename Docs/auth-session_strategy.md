# Auth Session

The Session model in the database schema serves as a crucial component for user authentication and session management. Let me break down its purpose, structure, and how it works within the authentication system.

## Session Model Overview

```prisma
model Session {
  id        String   @id @default(cuid())
  sessionToken String @unique
  userId    String
  expires   DateTime
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@map("sessions")
}
```

## Field Breakdown

### id - Primary Key

- **Type**: String with `@default(cuid())`
- **Purpose**: Unique identifier for each session record
- **CUID**: Collision-resistant unique identifier that's URL-safe and sortable

### sessionToken - Session Identifier

- **Type**: String with `@unique` constraint
- **Purpose**: The actual token that identifies the user's session
- **Usage**: Stored in cookies/localStorage and sent with requests to authenticate the user
- **Security**: Should be cryptographically random and sufficiently long

### userId - User Reference

- **Type**: String
- **Purpose**: Links the session to a specific user account
- **Relationship**: Foreign key referencing the User model's `id` field

### expires - Expiration Timestamp

- **Type**: DateTime
- **Purpose**: Defines when the session becomes invalid
- **Security**: Prevents indefinite session persistence, reducing security risks

### user - Relation Field

- **Type**: Relation to User model
- **Purpose**: Enables easy access to user data from session
- **Cascade Delete**: When a user is deleted, all their sessions are automatically removed

---

## How Sessions Work in Practice

### 1. Session Creation (Login)

```typescript
// When user logs in successfully
const session = await db.session.create({
  data: {
    sessionToken: generateSecureToken(), // Cryptographically random string
    userId: user.id,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
  },
});

// Store session token in HTTP-only cookie
cookies().set("session-token", session.sessionToken, {
  httpOnly: true,
  secure: true,
  sameSite: "strict",
  expires: session.expires,
});
```

### 2. Session Validation (Middleware)

```typescript
// On each protected request
const sessionToken = cookies().get("session-token")?.value;

if (sessionToken) {
  const session = await db.session.findUnique({
    where: {
      sessionToken,
      expires: { gte: new Date() }, // Check if not expired
    },
    include: { user: true },
  });

  if (session) {
    // User is authenticated
    return session.user;
  }
}

// No valid session found
return null;
```

### 3. Session Cleanup (Logout)

```typescript
// When user logs out
await db.session.delete({
  where: { sessionToken },
});

// Clear cookie
cookies().delete("session-token");
```

---

## Integration with NextAuth.js

If you're using NextAuth.js (as suggested in the tech docs), the Session model works with the Prisma adapter:

```typescript
// NextAuth automatically manages sessions
import { PrismaAdapter } from "@next-auth/prisma-adapter";

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(db),
  session: {
    strategy: "database", // Uses database sessions instead of JWT
    maxAge: 30 * 24 * 60 * 60, // 30 days
    updateAge: 24 * 60 * 60, // 24 hours
  },
};
```

---

## Security Considerations

### 1. Token Generation

```typescript
import crypto from "crypto";

function generateSecureToken(): string {
  return crypto.randomBytes(32).toString("hex");
}
```

### 2. Session Rotation

```typescript
// Rotate session token periodically for security
async function rotateSession(oldSessionToken: string) {
  const session = await db.session.findUnique({
    where: { sessionToken: oldSessionToken },
  });

  if (session) {
    const newToken = generateSecureToken();

    await db.session.update({
      where: { id: session.id },
      data: {
        sessionToken: newToken,
        expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    });

    return newToken;
  }
}
```

### 3. Cleanup Expired Sessions

```typescript
// Run periodically to clean up expired sessions
async function cleanupExpiredSessions() {
  await db.session.deleteMany({
    where: {
      expires: { lt: new Date() },
    },
  });
}
```

---

## Usage Examples

### Check Active Sessions for User

```typescript
async function getUserActiveSessions(userId: string) {
  return await db.session.findMany({
    where: {
      userId,
      expires: { gte: new Date() },
    },
    orderBy: { expires: "desc" },
  });
}
```

### Logout from All Devices

```typescript
async function logoutAllDevices(userId: string) {
  await db.session.deleteMany({
    where: { userId },
  });
}
```

### Session Analytics

```typescript
async function getSessionStats(userId: string) {
  const sessions = await db.session.findMany({
    where: { userId },
    orderBy: { expires: "desc" },
  });

  return {
    totalSessions: sessions.length,
    activeSessions: sessions.filter((s) => s.expires > new Date()).length,
    lastLogin: sessions[0]?.expires,
  };
}
```

---

The Session model provides a robust, secure foundation for managing user authentication state while maintaining the flexibility to implement features like multi-device support, session analytics, and security controls like forced logouts.
