import { requireUser } from "@/lib/auth";
import { sendMail } from "@/lib/mail";
import { resetPasswordEmail } from "@/lib/mail/email-render";
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
import { compareHash } from "@/lib/utils/passwordHandlers";
import { buildResetUrlTail, generateResetToken } from "@/lib/utils/resetToken";
import { Message } from "@/lib/validations";
import whatsapp from "@/lib/whatsapp";

export type UserServiceContext = {
  userId: string;
  role: UserRole;
};

export class UserService {
  private userId: string;
  private role: UserRole;

  private constructor({ userId, role }: UserServiceContext) {
    this.userId = userId;
    this.role = role;
  }

  static async create() {
    const user = await requireUser();

    return new UserService({
      userId: user.id,
      role: user.role as UserRole,
    });
  }

  /**
   * 🔐 Centralized access control
   * (Admins see all users, normal users only see themselves if needed)
   */
  private scope<T extends Prisma.UserWhereInput>(
    where: T = {} as T,
  ): Prisma.UserWhereInput {
    if (this.role === UserRole.ADMIN) {
      return where;
    }

    // usually users shouldn't browse all users
    return {
      ...where,
      id: this.userId,
    };
  }

  /**
   * 👤 Get ADMIN user
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
      select: { id: true, email: true, phone: true },
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }

  /**
   * 👥 Get all users (ADMIN only effective)
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
   * 🔎 Get single user by ID
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
      throw new Error("User not found");
    }

    return user as any;
  }

  /**
   * 🔎 Get single user by ID / email / phone
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
        OR: [{ id: key }, { email: key }, { tel: key }],
      },

      include: userInclude,
    });

    if (!user) {
      throw new Error("User not found");
    }

    return user as any;
  }

  /**
   * 📊 Get user stats (dashboard use)
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
      throw new Error("User not found");
    }

    return {
      totalContacts: user._count.contacts,
      totalMessages: user._count.messages,
    };
  }

  static async sendResetLink(data: {
    username: string;
    sendTo?: NotificationChannel;
  }): Promise<{
    username: string;
    sentTo: NotificationChannel;
  }> {
    const { username, sendTo: verificationMethod } = data;
    console.log(`Sending ResetToken to: ${username}`);

    if (!username) {
      throw new Error("No username provided in generating resetToken");
    }

    const user_ = await UserService.getUserByKey(username);
    if (!user_) {
      throw new Error(`User not found`);
    }

    const usernameAttribute = user_.email === username ? "email" : "tel";
    const tokenObj = await generateResetToken();
    const resetLinkTail = await buildResetUrlTail(tokenObj.plain, username);
    const resetLink = `${BASE_URL}/${resetLinkTail}`;

    // save new token
    await prisma.token.upsert({
      where: {
        type_userId: {
          userId: user_.id,
          type: TokenType.RESET,
        },
      },
      // If the record exists, update
      update: {
        hashedToken: tokenObj.hashed,
        expiresAt: tokenObj.expiry,
        isActive: true,
        lastUsedAt: null, // Reset usage
      },
      // If the record doesn't exist, create
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

      const { data, error } = sendmailRes;

      if (error) {
        console.error("Resend ERROR:", error);
        throw new Error(error.message);
      }
      console.log("Email sent successfully:", data);

      sentTo_ = NotificationChannel.EMAIL;
    } else if (
      verificationMethod === NotificationChannel.WHATSAPP &&
      user_.tel
    ) {
      const message: Message = {
        messaging_product: "whatsapp",
        recipient_type: "INDIVIDUAL",
        to: user_.tel,
        type: "template",
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
                { type: "text", parameter_name: "name", text: user_.name },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0", // first button
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
      throw new Error(`Message not sent to ${username}`);
    }

    return { username, sentTo: sentTo_ };
  }

  /**
   * verify token
   */

  static async verifyToken(dto: {
    username: string;
    token: string;
    type: TokenType;
  }): Promise<{
    verification: boolean;
    user?: Pick<User, "id" | "name" | "email" | "tel">;
    message: string;
  }> {
    const { username, token, type } = dto;

    console.log(`verifying token for user: ${username} \ntype:${type}\n`);

    const user = await UserService.getUserByKey(username, { tokens: true });

    if (!user || !user.tokens || user.tokens.length == 0) {
      return { verification: false, message: "Invalid reset-link" };
    }

    const resetToken = user.tokens.find((tk) => tk.type === type);
    if (!resetToken) {
      return { verification: false, message: "Invalid link" };
    }

    if (!(await compareHash(token, resetToken.hashedToken))) {
      return { verification: false, message: "Invalid token" };
    }

    if (resetToken.expiresAt < new Date()) {
      return { verification: false, message: "Expired token" };
    }

    return { verification: true, user, message: "Valid token" };
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
