import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  subscription: vi.fn(),
  phoneNumber: vi.fn(),
  template: vi.fn(),
  contacts: vi.fn(),
  campaignCreate: vi.fn(),
}));

vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/prisma", () => ({
  default: {
    subscription: { findFirst: mocks.subscription },
    phoneNumber: { findFirst: mocks.phoneNumber },
    wabaTemplate: { findFirst: mocks.template },
    contact: { findMany: mocks.contacts },
    whatsAppCampaign: { create: mocks.campaignCreate },
  },
}));

import { createWhatsAppCampaign } from "@/actions/whatsapp-notification.actions";

describe("WhatsApp notification campaigns", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.requireUser.mockResolvedValue({ id: "owner-1" });
    mocks.subscription.mockResolvedValue({ id: "subscription-1" });
    mocks.phoneNumber.mockResolvedValue({ id: "phone-1", wabaId: "waba-1" });
    mocks.template.mockResolvedValue({ id: "template-1", wabaId: "waba-1", language: "en_US", components: [{ type: "BODY", text: "Hello {{1}}" }] });
    mocks.contacts.mockResolvedValue([{ id: "contact-1" }]);
    mocks.campaignCreate.mockResolvedValue({ id: "campaign-1", status: "SCHEDULED" });
  });

  it("creates recipients only after checking consent and template ownership", async () => {
    const scheduledAt = new Date(Date.now() + 5 * 60_000);
    await createWhatsAppCampaign({
      phoneNumberId: "phone-1",
      templateId: "template-1",
      name: "New arrivals",
      contactIds: ["contact-1"],
      bodyParameters: ["Amina"],
      scheduledAt,
    });

    expect(mocks.contacts).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        userId: "owner-1",
        whatsappOptInAt: { not: null },
        whatsappOptOutAt: null,
      }),
    }));
    expect(mocks.campaignCreate).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        userId: "owner-1",
        phoneNumberId: "phone-1",
        templateId: "template-1",
        bodyParameters: ["Amina"],
        recipients: { create: [{ contactId: "contact-1" }] },
      }),
    }));
  });

  it("rejects recipients without recorded opt-in", async () => {
    mocks.contacts.mockResolvedValue([]);
    await expect(createWhatsAppCampaign({
      phoneNumberId: "phone-1",
      templateId: "template-1",
      name: "New arrivals",
      contactIds: ["contact-1"],
      bodyParameters: ["Amina"],
      scheduledAt: new Date(Date.now() + 5 * 60_000),
    })).rejects.toThrow("recorded WhatsApp consent");
    expect(mocks.campaignCreate).not.toHaveBeenCalled();
  });

  it("rejects the wrong number of template body parameters", async () => {
    await expect(createWhatsAppCampaign({
      phoneNumberId: "phone-1",
      templateId: "template-1",
      name: "New arrivals",
      contactIds: ["contact-1"],
      bodyParameters: [],
      scheduledAt: new Date(Date.now() + 5 * 60_000),
    })).rejects.toThrow("requires 1 body value");
    expect(mocks.campaignCreate).not.toHaveBeenCalled();
  });
});
