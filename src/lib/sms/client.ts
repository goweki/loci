import AfricasTalking from "africastalking";

const apiKey = process.env.AFRICASTALKING_KEY;
const username = process.env.AFRICASTALKING_USERNAME;

if (!apiKey || !username) {
  throw new Error(
    "❌ Missing Africa's Talking credentials. Please set AFRICASTALKING_KEY and AFRICASTALKING_USERNAME in your .env.local file."
  );
}

const africasTalking = AfricasTalking({
  apiKey,
  username,
});

export const sms = africasTalking.SMS;
