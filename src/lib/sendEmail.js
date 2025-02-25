import nodemailer from "nodemailer";

export default async function sendEmail(data) {
  try {
    // nodemailer transporter obj
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_ACCOUNT_USER,
        pass: process.env.GMAIL_APP_KEY,
      },
    });
    // nodemailer options
    const mailOptions = {
      from: process.env.GMAIL_ACCOUNT_FROM,
      to: process.env.GMAIL_ACCOUNT_TO,
      subject: data.subject,
      text: data.text,
      cc: data.cc,
    };
    // console.log(` > CHECKPOINT: Sending email`);
    // send email
    const result = await transporter.sendMail(mailOptions);
    if (result.accepted.length > 0) return { success: result };
    else {
      console.error(" > ERROR: email not sent ");
      return { error: "Email not sent " };
    }
  } catch (error) {
    console.error(" > ERROR: email not sent ");
    return { error: "Email not sent" };
  }
}
