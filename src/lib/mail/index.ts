import { mailTransporter } from "./transporter";

export async function sendMail({
  to,
  subject,
  html,
  text,
}: {
  to: string;
  subject: string;
  html: string;
  text: string;
}) {
  const mailOptions = {
    from: process.env.MAIL_FROM || "no-reply@example.com",
    to,
    subject,
    html,
    text,
  };

  return await mailTransporter.sendMail(mailOptions);
}
