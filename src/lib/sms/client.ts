import AfricasTalking from "africastalking";

const apiKey = process.env.AFRICASTALKING_KEY;
const username = process.env.AFRICASTALKING_USERNAME;
const senderId = process.env.AFRICASTALKING_SENDER_ID;

if (!apiKey || !username) {
  throw new Error(
    "❌ Missing Africa's Talking env values. Please set AFRICASTALKING_KEY and AFRICASTALKING_USERNAME",
  );
}

if (!senderId) {
  throw new Error(
    "❌ Missing Africa's Talking env value: Please set AFRICASTALKING_SENDER_ID",
  );
}

const africasTalking = AfricasTalking({
  apiKey,
  username,
});

export const sms = africasTalking.SMS;
