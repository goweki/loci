import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { NextAuthOptions } from "next-auth";
import { User, UserRole, UserStatus } from "@/lib/prisma/generated";
import { getSubscriptionStatusByUserId } from "@/data/subscription";
import { compareHash } from "../utils/passwordHandlers";
import { SubscriptionStatusEnum } from "@/types";
import prisma from "../prisma";
import { hashToken } from "./token-handlers";
import { UserService } from "@/services/user/user.service";
import { cookies } from "next/headers";
import { AuthFlow } from "./auth-types";

if (!process.env.NEXTAUTH_SECRET) {
  throw new Error("NEXTAUTH_SECRET is not set in environment variables");
}

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password)
          throw new Error("Missing credentials");
        else {
          console.log(`[SIGN IN REQUEST] Signing in ${credentials.username}`);
        }

        const user = await UserService.getUserByKey(credentials.username);

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
          const hashedPassword = hashToken(credentials.password);
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

        if (!isPasswordValid) throw new Error("Invalid credentials");

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
    maxAge: 7 * 24 * 60 * 60, // 7 days
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
        ` SIGN-IN ATTEMPT....`,
        ` >> user.email - ${user.email}`,
        ` >> account.provider - ${account?.provider}`,
        ` >> profile.email - ${profile?.email}`,
      );

      try {
        if (account?.provider === "google") {
          const email = profile?.email;
          if (!email) {
            console.warn(" >> Google user has no email");
            return false;
          }

          // auth flow cookie
          const cookieStore = await cookies();
          const authFlowCookie = cookieStore.get("auth_flow")?.value;
          const flow = authFlowCookie as AuthFlow | undefined;
          if (!flow) {
            console.warn(" > No flow provided for Google user");
            return false;
          }

          // if exists already
          const existingUser = await prisma.user.findUnique({
            where: { email },
            select: { id: true },
          });

          if (flow === "signin" && !existingUser) {
            console.warn(
              `Google sign-in denied for ${user.email}. User not found.`,
            );
            return false;
          }

          if (flow === "signup" && !existingUser) {
            // Create user

            const createdUser = await prisma.user.create({
              data: {
                email,
                name: profile.name,
                image: profile.image,
              },
            });

            console.log(" > Google user created:", createdUser);
          }
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
      console.log(`👋 User signed out. Sesssion ended:`, session);
    },
  },
};
