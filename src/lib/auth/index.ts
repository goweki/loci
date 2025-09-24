// lib/auth.ts
import { NextAuthOptions, DefaultSession } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import db from "@/lib/prisma";
import bcrypt from "bcryptjs";

// lib/auth.ts - Add validation at the top
if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set in environment variables");
}

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
          image: user.image,
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
    signOut: "/auth/signout",
    error: "/auth/error", // Error code passed in query string as ?error=
    verifyRequest: "/auth/verify-request", // (used for check email message)
    newUser: "/auth/new-user", // New users will be directed here on first sign in (leave the property out if not of interest)
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
      const iat = typeof token.iat === "number" ? token.iat : 0;
      if (token.id && Date.now() - iat * 1000 > 24 * 60 * 60 * 1000) {
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
              image: user.image,
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
