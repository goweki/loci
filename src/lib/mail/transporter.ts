import nodemailer from "nodemailer";

const gmailAccountUser = process.env.GMAIL_ACCOUNT_USER;
const gmailAccountKey = process.env.GMAIL_APP_KEY;

if (!gmailAccountUser || !gmailAccountKey) {
  throw new Error(
    "❌ Missing Africa's Talking credentials. Please set AFRICASTALKING_KEY and AFRICASTALKING_USERNAME in your .env.local file."
  );
}

// export const mailTransporter = nodemailer.createTransport({
//   host: process.env.SMTP_HOST,
//   port: Number(process.env.SMTP_PORT),
//   secure: false,
//   auth: {
//     user: process.env.SMTP_USER,
//     pass: process.env.SMTP_PASS,
//   },
// });

export const mailTransporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: gmailAccountUser,
    pass: gmailAccountKey,
  },
});
