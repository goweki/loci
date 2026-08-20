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
  cost: string; // e.g., "KES 0.8000"
  messageId: string; // e.g., "ATXid_..."
  messageParts: number; // Missing in your original interface (e.g., 1)
  number: string; // e.g., "+254700833003"
  status: string; // e.g., "Success"
  statusCode: number; // e.g., 100 (Processed) or 101 (Sent)
}

export interface SMSResponse {
  SMSMessageData: {
    Message: string;
    Recipients: SMSRecipient[];
  };
}

export interface SendSMSOptions {
  to: string | string[];
  message: string;
  from?: string;
}

class AfricasTalkingSMSClient {
  private apiKey: string;
  private username: string;
  private defaultSenderId: string;
  private baseUrl: string;

  constructor(apiKey: string, username: string, defaultSenderId: string) {
    this.apiKey = apiKey;
    this.username = username;
    this.defaultSenderId = defaultSenderId;

    this.baseUrl =
      this.username.toLowerCase() === "sandbox"
        ? "https://api.sandbox.africastalking.com/version1/messaging"
        : "https://api.africastalking.com/version1/messaging";
  }

  /**
   * Replaces sdk.SMS.send() while mimicking the API response shape
   */
  public async send(options: SendSMSOptions): Promise<SMSResponse> {
    const recipientsList = Array.isArray(options.to)
      ? options.to
      : [options.to];
    const activeSender = options.from || this.defaultSenderId;

    const requestBody = {
      username: this.username,
      message: options.message,
      phoneNumbers: recipientsList,
      ...(activeSender ? { senderId: activeSender } : {}),
    };

    const response = await fetch(`${this.baseUrl}/bulk`, {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
        apiKey: this.apiKey,
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(
        `Africa's Talking API Error (${response.status}): ${errorText}`,
      );
    }

    const data = await response.json();

    // Normalizes top-level error payloads (e.g. InvalidSenderId) to match the expected shape
    if (!data.SMSMessageData) {
      return {
        SMSMessageData: {
          Message: data.Message || "Unknown Error",
          Recipients: Array.isArray(data.Recipients) ? data.Recipients : [],
        },
      };
    }

    return data as SMSResponse;
  }
}

// Export `sms` matching the official SDK's export shape
export const sms = new AfricasTalkingSMSClient(apiKey, username, senderId);
