import AfricasTalking from "africastalking";
const apiUsername = process.env.AFRICASTALKING_USERNAME;
const apiKey = process.env.AFRICASTALKING_KEY;
const sendTo = process.env.AFRICASTALKING_TO;

const africastalking = AfricasTalking({
  username: apiUsername,
  apiKey: apiKey,
});

export default async function sendSMS(data) {
  try {
    const result = await africastalking.SMS.send({
      to: sendTo,
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
