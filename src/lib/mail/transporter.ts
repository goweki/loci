import { Resend } from "resend";

export interface SendMailOptions {
  to: string | string[];
  subject: string;
  message: { html: string; text: string };
  from?: string;
}

export class EmailService {
  private resend: Resend;
  private defaultFrom: string;

  constructor() {
    if (!process.env.RESEND_API_KEY || !process.env.RESEND_SYSTEM_SENDER) {
      throw new Error("RESEND_API_KEY or RESEND_SYSTEM_SENDER is not defined");
    }

    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.defaultFrom = process.env.RESEND_SYSTEM_SENDER;
  }

  async sendMail(options: SendMailOptions) {
    const { to, subject, message, from } = options;
    const html = message.html;

    const resendOptions = {
      from: from || this.defaultFrom,
      to,
      subject,
      html,
    };
    console.log("resend options:", resendOptions);

    return this.resend.emails.send(resendOptions);
  }
}

const emailService = new EmailService();

export default emailService;
