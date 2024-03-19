import AfricasTalking from "africastalking";

const africastalking = AfricasTalking({
  username: process.env.AFRICASTALKING_USERNAME,
  apiKey: process.env.AFRICASTALKING_KEY,
});

export default async function sendSMS(data) {
  try {
    const result = await africastalking.SMS.send({
      to: process.env.AFRICASTALKING_TO,
      message: data.subject + ": " + data.text,
      //   from: '[Your_sender_ID_goes_here]'
    });
    console.log(" > SUCCESS: sms sent " + JSON.stringify(result));
    return { success: result };
  } catch (err) {
    console.error(" > ERROR: sms not sent - ", err.error ?? err);
    return { error: err };
  }
}
