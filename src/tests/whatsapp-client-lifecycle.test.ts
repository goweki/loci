import { beforeAll, afterAll, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/whatsapp/actions", () => ({
  createPreVerifiedNumber: vi.fn(),
  requestVerificationCode: vi.fn(),
  verifyPreVerifiedNumber: vi.fn(),
  getTokenUsingWabaAuthCode: vi.fn(),
}));

describe("WhatsApp Cloud API asset lifecycle requests", () => {
  let WhatsAppClient: typeof import("@/lib/whatsapp/services/client").WhatsAppClient;
  const originalEnv = {
    NEXT_PUBLIC_META_APP_ID: process.env.NEXT_PUBLIC_META_APP_ID,
    WHATSAPP_ACCESS_TOKEN: process.env.WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_WEBHOOK_VERIFY_TOKEN: process.env.WHATSAPP_WEBHOOK_VERIFY_TOKEN,
    META_APP_SECRET: process.env.META_APP_SECRET,
    WHATSAPP_PHONE_NUMBER_ID: process.env.WHATSAPP_PHONE_NUMBER_ID,
    META_BUSINESS_ID: process.env.META_BUSINESS_ID,
    META_API_VERSION: process.env.META_API_VERSION,
    WABA_ID: process.env.WABA_ID,
  };

  beforeAll(async () => {
    vi.stubEnv("NEXT_PUBLIC_META_APP_ID", "app-12345");
    vi.stubEnv("WHATSAPP_ACCESS_TOKEN", "token-12345");
    vi.stubEnv("WHATSAPP_WEBHOOK_VERIFY_TOKEN", "verify-12345");
    vi.stubEnv("META_APP_SECRET", "secret-12345");
    vi.stubEnv("WHATSAPP_PHONE_NUMBER_ID", "phone-12345");
    vi.stubEnv("META_BUSINESS_ID", "business-12345");
    vi.stubEnv("META_API_VERSION", "v99.0");
    vi.stubEnv("WABA_ID", "waba-12345");
    WhatsAppClient = (await import("@/lib/whatsapp/services/client")).WhatsAppClient;
  });

  afterAll(() => {
    for (const [key, value] of Object.entries(originalEnv)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
    vi.unstubAllGlobals();
  });

  it("deletes a specific template by WABA, name, and Meta template ID", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new WhatsAppClient({
      fbBusinessId: "business-1",
      fbAppId: "app-1",
      wabaAccessToken: "connected-token",
      wabaId: "connected-waba",
      verifyToken: "verify",
      appSecret: "secret",
      phoneNumberId: "phone-1",
      apiVersion: "v99.0",
    });

    await client.deleteTemplate("welcome_message", "template-42");

    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v99.0/connected-waba/message_templates?name=welcome_message&hsm_id=template-42");
    expect(init.method).toBe("DELETE");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer connected-token");
  });

  it("deregisters a specific phone number through its Cloud API endpoint", async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ success: true }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);
    const client = new WhatsAppClient({
      fbBusinessId: "business-1",
      fbAppId: "app-1",
      wabaAccessToken: "connected-token",
      wabaId: "connected-waba",
      verifyToken: "verify",
      appSecret: "secret",
      phoneNumberId: "phone-1",
      apiVersion: "v99.0",
    });

    await expect(client.deregisterPhoneNumber("phone-42")).resolves.toEqual({ success: true });
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://graph.facebook.com/v99.0/phone-42/deregister");
    expect(init.method).toBe("POST");
    expect(new Headers(init.headers).get("Authorization")).toBe("Bearer connected-token");
  });
});
