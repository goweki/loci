import mailService, { SendMailOptions } from "./transporter";

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
  const mailOptions: SendMailOptions = {
    from: process.env.MAIL_FROM || "no-reply@example.com",
    to,
    subject,
    message: { html, text },
  };

  return await mailService.sendMail(mailOptions);
}
