import "server-only";

import { requireUser } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { resetPasswordEmail, welcomeEmail } from "@/lib/mail/email-render";
import prisma from "@/lib/prisma";
import {
  NotificationChannel,
  Prisma,
  TemplateLanguage,
  TokenType,
  User,
  UserRole,
} from "@/lib/prisma/generated";
import sendSms, { SMSprops } from "@/lib/sms";
import { BANNER_IMAGE_URL, BASE_URL } from "@/lib/utils/getUrl";
import { bcryptCompare } from "@/lib/utils/passwordHandlers";
import { buildResetUrlTail, generateResetToken } from "@/lib/utils/resetToken";
import { Message } from "@/lib/validations";
import whatsapp from "@/lib/whatsapp";

export type UserServiceContext = {
  userId: string;
  userRole: UserRole;
};

export class UserService {
  private userId: string;
  private userRole: UserRole;

  private constructor({ userId, userRole }: UserServiceContext) {
    this.userId = userId;
    this.userRole = userRole;
  }

  /**
   * Factory method to instantiate UserService with optional override or session auth context.
   */
  static async create(userData?: {
    id: string;
    role: UserRole;
  }): Promise<UserService> {
    if (userData) {
      return new UserService({
        userId: userData.id,
        userRole: userData.role,
      });
    }

    const user = await requireUser();
    return new UserService({
      userId: user.id,
      userRole: user.role as UserRole,
    });
  }

  /**
   * 🔐 Centralized access control
   * Admins can view/query across all users; normal users are restricted to their own record.
   */
  private scope<T extends Prisma.UserWhereInput>(
    where: T = {} as T,
  ): Prisma.UserWhereInput {
    if (this.userRole === UserRole.ADMIN) {
      return where;
    }

    return {
      ...where,
      id: this.userId,
    };
  }

  /**
   * 👤 Get system ADMIN user for automated tasks
   */
  static async getAdminUser(): Promise<{
    id: string;
    email: string | null;
    phone: string | null;
  }> {
    const user = await prisma.user.findFirst({
      where: {
        email: process.env.SYSTEM_EMAIL,
      },
      select: { id: true, email: true, tel: true },
    });

    if (!user) {
      throw new Error("System Admin user not found.");
    }

    return {
      id: user.id,
      email: user.email,
      phone: user.tel,
    };
  }

  /**
   * 👥 Get users with filtering and pagination (Role-scoped)
   */
  async getUsers(params?: {
    search?: string;
    limit?: number;
    cursor?: string;
    role?: UserRole;
  }) {
    const { search, limit = 20, cursor, role } = params || {};

    const users = await prisma.user.findMany({
      where: this.scope({
        ...(role ? { role } : {}),
        OR: search
          ? [
              { name: { contains: search, mode: "insensitive" } },
              { email: { contains: search, mode: "insensitive" } },
              { tel: { contains: search } },
            ]
          : undefined,
      }),
      include: {
        _count: {
          select: {
            contacts: true,
            messages: true,
            subscriptions: true,
          },
        },
        waba: true,
      },
      take: limit,
      ...(cursor && {
        skip: 1,
        cursor: { id: cursor },
      }),
      orderBy: {
        createdAt: "desc",
      },
    });

    return users.map((u) => this.toUserDTO(u));
  }

  /**
   * 🔎 Get single user by ID (Role-scoped)
   */
  async getUserById<T extends Prisma.UserInclude | undefined = undefined>(
    userId: string,
    include?: T,
  ): Promise<
    Prisma.UserGetPayload<T extends Prisma.UserInclude ? { include: T } : {}>
  > {
    const user = await prisma.user.findFirst({
      where: this.scope({ id: userId }),
      include,
    });

    if (!user) {
      throw new Error("User not found or access denied.");
    }

    return user as any;
  }

  /**
   * 🔎 Static lookup helper by unique key (ID / Email / Tel)
   */
  static async getUserByKey<
    T extends Prisma.UserInclude | undefined = undefined,
  >(
    key: string,
    userInclude?: T,
  ): Promise<
    Prisma.UserGetPayload<T extends Prisma.UserInclude ? { include: T } : {}>
  > {
    const user = await prisma.user.findFirst({
      where: {
        OR: [{ id: key }, { email: key }, { tel: key }, { username: key }],
      },
      include: userInclude,
    });

    if (!user) {
      throw new Error("User not found.");
    }

    return user as any;
  }

  /**
   * 📊 Get user statistics for dashboard display
   */
  async getUserStats() {
    const user = await prisma.user.findFirst({
      where: this.scope({ id: this.userId }),
      select: {
        _count: {
          select: {
            contacts: true,
            messages: true,
          },
        },
      },
    });

    if (!user) {
      throw new Error("User not found.");
    }

    return {
      totalContacts: user._count.contacts,
      totalMessages: user._count.messages,
    };
  }

  /**
   * 📧 Issue & send password reset token across channels
   */
  static async sendWelcomeLink(user: User): Promise<{
    username: string;
    sentTo: NotificationChannel;
  }> {
    const { id, preferredCommunicationChannel } = user;

    const user_ = await prisma.user.findUniqueOrThrow({ where: { id } });

    const username =
      preferredCommunicationChannel === NotificationChannel.EMAIL
        ? user_.email
        : user_.tel;

    if (!username) {
      throw `Preferred Notificationchannel not set: ${preferredCommunicationChannel} - in user:${user_.username}`;
    }

    const tokenObj = await generateResetToken();
    const resetLinkTail = await buildResetUrlTail(tokenObj.plain, username);
    const resetLink = `${BASE_URL}/${resetLinkTail}`;

    await prisma.token.upsert({
      where: {
        type_userId: {
          userId: user_.id,
          type: TokenType.RESET,
        },
      },
      update: {
        hashedToken: tokenObj.hashed,
        expiresAt: tokenObj.expiry,
        isActive: true,
        lastUsedAt: null,
      },
      create: {
        userId: user_.id,
        type: TokenType.RESET,
        hashedToken: tokenObj.hashed,
        expiresAt: tokenObj.expiry,
        description: "Password reset token",
      },
    });

    let sentTo_: NotificationChannel | undefined = undefined;

    if (preferredCommunicationChannel === NotificationChannel.EMAIL) {
      const emailToSend = await welcomeEmail(user_.name || "", resetLink);
      const sendmailRes = await sendMail({
        to: username,
        subject: "Welcome to LOCi",
        html: emailToSend.html,
        text: emailToSend.text,
      });

      if (sendmailRes.error) {
        throw new Error(sendmailRes.error.message);
      }

      sentTo_ = NotificationChannel.EMAIL;
    } else if (preferredCommunicationChannel === NotificationChannel.WHATSAPP) {
      const message: Message = {
        messaging_product: "whatsapp",
        recipient_type: "INDIVIDUAL",
        to: username,
        type: "TEMPLATE",
        template: {
          name: "set_password",
          language: { code: TemplateLanguage.en_US },
          components: [
            {
              type: "header",
              parameters: [
                { type: "image", image: { link: BANNER_IMAGE_URL } },
              ],
            },
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  parameter_name: "name",
                  text: user_.name || "",
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: resetLinkTail }],
            },
          ],
        },
      };

      await whatsapp.sendTemplate(message);
      sentTo_ = NotificationChannel.WHATSAPP;
    } else if (preferredCommunicationChannel === NotificationChannel.SMS) {
      const emailToSend = await resetPasswordEmail(user_.name || "", resetLink);
      const options_: SMSprops = {
        to: username,
        message: emailToSend.text,
      };
      await sendSms(options_);
      sentTo_ = NotificationChannel.SMS;
    }

    if (!sentTo_) {
      throw new Error(`Failed to send password reset message to ${username}.`);
    }

    return { username, sentTo: sentTo_ };
  }

  /**
   * 📧 Issue & send password reset token across channels
   */
  static async sendResetLink(data: {
    username: string;
    sendTo?: NotificationChannel;
  }): Promise<{
    username: string;
    sentTo: NotificationChannel;
  }> {
    const { username, sendTo: verificationMethod } = data;

    if (!username) {
      throw new Error("Username/identifier is required.");
    }

    const user_ = await UserService.getUserByKey(username);
    const usernameAttribute = user_.email === username ? "email" : "tel";
    const tokenObj = await generateResetToken();
    const resetLinkTail = await buildResetUrlTail(tokenObj.plain, username);
    const resetLink = `${BASE_URL}/${resetLinkTail}`;

    await prisma.token.upsert({
      where: {
        type_userId: {
          userId: user_.id,
          type: TokenType.RESET,
        },
      },
      update: {
        hashedToken: tokenObj.hashed,
        expiresAt: tokenObj.expiry,
        isActive: true,
        lastUsedAt: null,
      },
      create: {
        userId: user_.id,
        type: TokenType.RESET,
        hashedToken: tokenObj.hashed,
        expiresAt: tokenObj.expiry,
        description: "Password reset token",
      },
    });

    let sentTo_: NotificationChannel | undefined = undefined;

    if (usernameAttribute === "email" && user_.email) {
      const emailToSend = await resetPasswordEmail(user_.name || "", resetLink);
      const sendmailRes = await sendMail({
        to: user_.email,
        subject: "Reset Password: LOCi",
        html: emailToSend.html,
        text: emailToSend.text,
      });

      if (sendmailRes.error) {
        throw new Error(sendmailRes.error.message);
      }

      sentTo_ = NotificationChannel.EMAIL;
    } else if (
      verificationMethod === NotificationChannel.WHATSAPP &&
      user_.tel
    ) {
      const message: Message = {
        messaging_product: "whatsapp",
        recipient_type: "INDIVIDUAL",
        to: user_.tel,
        type: "TEMPLATE",
        template: {
          name: "reset_account_password",
          language: { code: TemplateLanguage.en_US },
          components: [
            {
              type: "header",
              parameters: [
                { type: "image", image: { link: BANNER_IMAGE_URL } },
              ],
            },
            {
              type: "body",
              parameters: [
                {
                  type: "text",
                  parameter_name: "name",
                  text: user_.name || "",
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0",
              parameters: [{ type: "text", text: resetLinkTail }],
            },
          ],
        },
      };

      await whatsapp.sendTemplate(message);
      sentTo_ = NotificationChannel.WHATSAPP;
    } else if (verificationMethod === NotificationChannel.SMS && user_.tel) {
      const emailToSend = await resetPasswordEmail(user_.name || "", resetLink);
      const options_: SMSprops = {
        to: user_.tel,
        message: emailToSend.text,
      };
      await sendSms(options_);
      sentTo_ = NotificationChannel.SMS;
    }

    if (!sentTo_) {
      throw new Error(`Failed to send password reset message to ${username}.`);
    }

    return { username, sentTo: sentTo_ };
  }

  /**
   * 🔑 Verify token validity
   */
  static async verifyToken(dto: {
    username: string;
    token: string;
    type: TokenType;
  }): Promise<{
    verification: boolean;
    message: string;
    user?: Pick<User, "id" | "name" | "email" | "tel">;
    verifiedChannel?: NotificationChannel;
  }> {
    const { username, token, type } = dto;

    const user = await UserService.getUserByKey(username, { tokens: true });

    if (!user || !user.tokens || user.tokens.length === 0) {
      return { verification: false, message: "Invalid reset link." };
    }

    const resetToken = user.tokens.find(
      (tk) => tk.type === type && tk.isActive,
    );
    if (!resetToken) {
      return { verification: false, message: "Invalid link or token expired." };
    }

    if (!(await bcryptCompare(token, resetToken.hashedToken))) {
      return { verification: false, message: "Invalid token." };
    }

    if (resetToken.expiresAt < new Date()) {
      return { verification: false, message: "Expired token." };
    }

    return {
      verification: true,
      user,
      message: "Valid token.",
      verifiedChannel: resetToken.channel || undefined,
    };
  }

  /**
   * 🧠 DTO mapper
   */
  private toUserDTO(user: any) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      tel: user.tel,
      role: user.role,
      status: user.status,
      image: user.image,
      createdAt: user.createdAt,
      stats: user._count
        ? {
            contacts: user._count.contacts,
            messages: user._count.messages,
            subscriptions: user._count.subscriptions,
          }
        : undefined,
      waba: user.waba
        ? {
            id: user.waba.id,
            name: user.waba.name,
            ownership: user.waba.ownership,
          }
        : null,
    };
  }
}
