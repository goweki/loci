import whatsapp from "@/lib/whatsapp";
import sendSms from "@/lib/sms";
import { Message } from "@/lib/validations";
import { TemplateLanguage } from "@/lib/prisma/generated";
import { BANNER_IMAGE_URL } from "@/lib/utils/getUrl";

export class CommunicationService {
  static async sendInvoiceLink(dto: {
    phone: string;
    customerName?: string;
    invoiceNumber: string;
    amount: number;
    paymentLink: string;
    channel: "WHATSAPP" | "SMS";
  }) {
    const message = `
Hello ${dto.customerName ?? ""}

Invoice: ${dto.invoiceNumber}
Amount: KES ${dto.amount}

Pay here:
${dto.paymentLink}
`;

    if (dto.channel === "WHATSAPP") {
      const message: Message = {
        messaging_product: "whatsapp",
        recipient_type: "INDIVIDUAL",
        to: dto.phone,
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
                {
                  type: "text",
                  parameter_name: "name",
                  text: dto.customerName,
                },
              ],
            },
            {
              type: "button",
              sub_type: "url",
              index: "0", // first button
              parameters: [{ type: "text", text: dto.paymentLink }],
            },
          ],
        },
      };

      return whatsapp.sendMessage(message);
    }

    return sendSms({
      to: dto.phone,
      message,
    });
  }
}
