import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  findMany: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({
  default: { product: { findMany: mocks.findMany } },
}));

import { matchAutoReplyRule } from "@/services/autoReply/match-rule";
import { AgentRuntimeService } from "@/services/agent/agent-runtime.service";
import { AutoReplyRule } from "@/lib/prisma/generated";
import { createHmac } from "node:crypto";
import { isValidMetaWebhookSignature } from "@/lib/whatsapp/webhook-signature";

function rule(overrides: Partial<AutoReplyRule>): AutoReplyRule {
  return {
    id: "rule-1",
    phoneNumberId: "phone-1",
    name: "Rule",
    triggerType: "KEYWORD",
    triggerValue: "help",
    replyMessage: "How can I help?",
    isActive: true,
    priority: 100,
    createdAt: new Date("2026-01-01T00:00:00Z"),
    updatedAt: new Date("2026-01-01T00:00:00Z"),
    createdById: "owner-1",
    ...overrides,
  };
}

describe("WhatsApp assistant capabilities", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("matches specific rules before the default regardless of default priority", () => {
    const fallback = rule({ id: "default", triggerType: "DEFAULT", triggerValue: null, priority: 0 });
    const keyword = rule({ id: "keyword", priority: 100 });

    expect(matchAutoReplyRule([fallback, keyword], { text: "I need HELP", messageType: "TEXT" })?.id).toBe("keyword");
    expect(matchAutoReplyRule([fallback], { text: "hello", messageType: "TEXT" })?.id).toBe("default");
  });

  it("ignores inactive rules and matches message types case-insensitively", () => {
    const inactive = rule({ isActive: false });
    const byType = rule({ triggerType: "MESSAGE_TYPE", triggerValue: "IMAGE" });

    expect(matchAutoReplyRule([inactive, byType], { messageType: "image" })?.id).toBe(byType.id);
    expect(matchAutoReplyRule([inactive], { text: "help", messageType: "TEXT" })).toBeNull();
  });

  it("executes catalogue search only for the assistant owner and returns minimal catalogue facts", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "test-key");
    mocks.findMany.mockResolvedValue([{
      id: "product-1",
      name: "Blue shirt",
      description: "Cotton shirt",
      sku: "SHIRT-BLUE",
      price: { toString: () => "1200" },
      currency: "KES",
      stockQty: 3,
      imageUrl: null,
    }]);

    const fetchMock = vi.fn()
      .mockResolvedValueOnce(new Response(JSON.stringify({
        content: [{ type: "tool_use", id: "tool-1", name: "search_catalogue", input: { query: "blue shirt" } }],
        stop_reason: "tool_use",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        content: [{ type: "text", text: "The blue shirt is KES 1,200." }],
        stop_reason: "end_turn",
      }), { status: 200 }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await new AgentRuntimeService().respond({
      ownerId: "owner-1",
      phoneNumberId: "phone-1",
      systemPrompt: "Be accurate about products.",
      profileContext: null,
      enabledTools: ["search_catalogue"],
      temperature: 0.4,
      maxTokens: 500,
      history: [{ role: "user", content: "Do you have a blue shirt?" }],
    });

    expect(response).toBe("The blue shirt is KES 1,200.");
    expect(mocks.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ userId: "owner-1", isActive: true }),
      select: expect.objectContaining({ name: true, price: true, stockQty: true }),
      take: 5,
    }));
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
});

describe("Meta webhook signature validation", () => {
  it("accepts a valid signature and rejects changed payloads or malformed headers", () => {
    const body = '{"object":"whatsapp_business_account"}';
    const secret = "meta-app-secret";
    const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;

    expect(isValidMetaWebhookSignature(body, signature, secret)).toBe(true);
    expect(isValidMetaWebhookSignature(`${body} `, signature, secret)).toBe(false);
    expect(isValidMetaWebhookSignature(body, "sha256=xyz", secret)).toBe(false);
    expect(isValidMetaWebhookSignature(body, null, secret)).toBe(false);
  });
});
