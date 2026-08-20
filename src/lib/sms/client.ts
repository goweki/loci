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

export interface SMSRecipient {
  statusCode: number;
  number: string;
  status: string; // e.g., "Success", "Failed", "RiskHold"
  cost: string; // e.g., "KES 0.8000"
  messageId: string;
}

export interface SMSResponse {
  SMSMessageData: {
    Message: string;
    Recipients: SMSRecipient[]; // Array instead of single object
  };
}

const africasTalking = AfricasTalking({
  apiKey,
  username,
});

export const sms = africasTalking.SMS;
