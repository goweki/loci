import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { createUser, getUserByEmail, getUserByKey } from "@/data/user";
import { User, UserRole, UserStatus } from "@/lib/prisma/generated";
import { getSubscriptionStatusByUserId } from "@/data/subscription";
import { upsertAccount } from "@/data/account";
import { compareHash } from "../utils/passwordHandlers";
import { SubscriptionStatusEnum } from "@/types";
import prisma from "../prisma";
import { hashApiKey } from "./api-key";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set in environment variables");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password)
          throw new Error("Missing credentials");

        const user = await getUserByKey(credentials.username);
        if (!user) throw new Error("Invalid credentials"); //User not found

        if (user.status === UserStatus.SUSPENDED)
          throw new Error("Account suspended");

        // auth password
        let isPasswordValid = false;

        const validTokens = await prisma.token.findMany({
          where: {
            userId: user.id,
          },
        });

        if (validTokens.length < 1 && !user.password) {
          throw new Error("Create a password/passcode first");
        }

        if (user.password) {
          isPasswordValid = await compareHash(
            credentials.password,
            user.password,
          );
        }
        if (!isPasswordValid) {
          const hashedPassword = hashApiKey(credentials.password);
          const validOtp = validTokens.find(
            ({ hashedToken }) => hashedToken === hashedPassword,
          );
          if (validOtp) {
            console.log(`User-${user.id} authenticated using OTP Token`);
            isPasswordValid = true;
            await prisma.token.delete({
              where: { id: validOtp.id },
            });
          }
        }

        if (!isPasswordValid) throw new Error("Invalid password/passcode");

        const subscription = await getSubscriptionStatusByUserId(user.id);

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
          role: user.role,
          subscriptionPlan: subscription.plan,
          subscriptionStatus: subscription.status,
        };
      },
    }),

    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  // --- Session configuration ---
  session: {
    strategy: "jwt",
    maxAge: 14 * 24 * 60 * 60, // 14 days
  },

  // --- Page routes ---
  pages: {
    signIn: "/sign-in",
    signOut: "/sign-out",
    verifyRequest: "/auth/verify-request",
    newUser: "/auth/new-user",
  },

  // --- Callbacks ---
  callbacks: {
    /**
     * JWT callback: runs on sign-in and whenever a session is checked or updated.
     */
    async jwt({ token, user, trigger, session }) {
      // --- Initial sign-in ---
      if (user) {
        token.sub = user.id;
        token.email = user.email;
        token.role = user.role;

        // Always refresh subscription info on login
        try {
          const subscription = await getSubscriptionStatusByUserId(user.id);
          token.subscriptionStatus = subscription.status;
          token.subscriptionPlan = subscription.plan;
        } catch (err) {
          console.error("Error fetching subscription for user:", user.id, err);
          token.subscriptionStatus = SubscriptionStatusEnum.INACTIVE;
          token.subscriptionPlan = null;
        }
      }

      // --- Session update (manual trigger) ---
      if (trigger === "update" && session) {
        token = { ...token, ...session };
      }

      // --- Periodic refresh every 24 hours ---
      const iat = typeof token.iat === "number" ? token.iat : 0;
      const userId = token.sub;
      const elapsed = Date.now() - iat * 1000;

      if (userId && elapsed > 24 * 60 * 60 * 1000) {
        try {
          const subscription = await getSubscriptionStatusByUserId(userId);
          token.subscriptionStatus = subscription.status;
          token.subscriptionPlan = subscription.plan;
        } catch (error) {
          console.error("Error refreshing user subscription:", error);
        }
      }

      return token;
    },

    /**
     * Session callback: exposes token data to the client.
     */
    async session({ session, token }) {
      if (!token || !session.user) return session;

      session.user.id = token.sub!;
      session.user.role = token.role || "USER";
      session.user.subscriptionStatus =
        token.subscriptionStatus ?? SubscriptionStatusEnum.INACTIVE;
      session.user.subscriptionPlan = token.subscriptionPlan ?? null;

      return session;
    },

    /**
     * Sign-in callback: ensure Google users exist and are initialized.
     */
    async signIn({ user, account, profile }) {
      console.log(
        "SIGN IN ATTEMPT....",
        ` >> user.email - ${user.email}`,
        ` >> account.provider - ${account?.provider}`,
        ` >> profile.email - ${profile?.email}`,
      );

      try {
        if (account?.provider === "google" && profile?.email) {
          const userEmail_ = profile?.email;
          // 1️⃣ Find or create local user
          let localUser: Partial<User & { id: string }> | null =
            await getUserByEmail(userEmail_);

          if (!localUser) {
            localUser = await createUser({
              email: userEmail_,
              name: profile.name ?? "",
              image: profile.image ?? null,
            });
          }

          if (!localUser.id) {
            return false;
          }

          // Ensure linkage
          await upsertAccount(localUser.id, {
            user: { connect: { id: localUser.id } },
            provider: account.provider,
            providerAccountId: account.providerAccountId,
            type: account.type,
            access_token: account.access_token,
            token_type: account.token_type,
            scope: account.scope,
            id_token: account.id_token,
            expires_at: account.expires_at,
            refresh_token: account.refresh_token,
          });

          // 3️⃣ Load subscription details and attach to session user
          const subscription = await getSubscriptionStatusByUserId(
            localUser.id,
          );

          user.id = localUser.id;
          user.role = localUser.role || UserRole.USER;
          user.subscriptionStatus = subscription.status;
          user.subscriptionPlan = subscription.plan;
        }

        return true;
      } catch (err) {
        console.error("Error during sign-in:", err);
        return false;
      }
    },
  },

  // --- Events ---
  events: {
    async signIn({ user, account }) {
      console.log(`✅ ${user.email} signed in via ${account?.provider}`);
    },
    async signOut({ session }) {
      console.log(`👋 User signed out`);
    },
  },
};
