import sendEmail from "@/lib/sendEmail";
import sendSMS from "@/lib/sendSMS";

export async function POST(request) {
  if (!process.env.NOTIFY_CHANNELS)
    return Response.json({ error: "no notify channels defined" });
  else {
    console.log(
      "Sending to channels: " + process.env.NOTIFY_CHANNELS.split(" ")
    );
  }
  try {
    // sending channels
    const channels = process.env.NOTIFY_CHANNELS.split(" ");
    // request body
    const doc = await request.json();
    console.log(`POST REQUEST: to send an email/sms.`);
    let mailerRes = {}; // will hold responses
    //send Email
    if (channels.includes("email")) {
      const res_ = await sendEmail(doc);
      if (res_.success) {
        mailerRes.email = "success";
      } else {
        mailerRes.email = "failed";
      }
    }
    //send SMS
    if (channels.includes("sms")) {
      const res_ = await sendSMS(doc);
      if (res_.success) {
        mailerRes.sms = "success";
      } else {
        mailerRes.sms = "failed";
      }
    }
    //return
    if (Object.values(mailerRes).includes("success"))
      return Response.json({ success: mailerRes });
    else {
      console.error(
        " > Failure in route /mailer POST: " +
        JSON.stringify(mailerRes) +
        `\n.........................`
      );
      return Response.json({ error: mailerRes });
    }
  } catch (error) {
    // handle ERROR if caught
    console.log(
      `ERROR: error caught in route /mailer POST\n >> ${error}\n.........................`
    );
    return Response.json({ error: "Message not sent" });
  }
}
