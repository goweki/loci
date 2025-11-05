import { mailTransporter } from "./transporter";

export async function sendMail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}) {
  const mailOptions = {
    from: process.env.MAIL_FROM || "no-reply@example.com",
    to,
    subject,
    html,
  };

  const info = await mailTransporter.sendMail(mailOptions);
  console.log("Mail sent:", info.messageId);
  return info;
}
