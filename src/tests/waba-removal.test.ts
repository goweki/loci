import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  decrypt: vi.fn(),
  findPhone: vi.fn(),
  deletePhone: vi.fn(),
  findTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  updateCampaigns: vi.fn(),
  transaction: vi.fn(),
  deregister: vi.fn(),
  metaDelete: vi.fn(),
  events: [] as string[],
}));

vi.mock("@/lib/auth", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/lib/prisma", () => ({
  default: {
    phoneNumber: { findFirst: mocks.findPhone, delete: mocks.deletePhone },
    wabaTemplate: { findFirst: mocks.findTemplate },
    $transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/whatsapp", () => ({ default: {} }));
vi.mock("@/lib/whatsapp/credentials", () => ({
  decryptWhatsAppToken: mocks.decrypt,
  encryptWhatsAppToken: vi.fn(),
}));
vi.mock("@/lib/whatsapp/types/environment-variables", () => ({
  env_: {
    fbBusinessId: "business",
    fbAppId: "app",
    wabaAccessToken: "legacy-token",
    wabaId: "legacy-waba",
    verifyToken: "verify",
    appSecret: "secret",
    phoneNumberId: "legacy-phone",
    apiVersion: "v99.0",
  },
}));
vi.mock("@/lib/whatsapp/services/client", () => ({
  WhatsAppClient: class {
    deregisterPhoneNumber = mocks.deregister;
    deleteTemplate = mocks.metaDelete;
  },
}));

import { deleteWabaTemplateAction } from "@/actions/template-library.actions";
import { deleteWhatsAppPhoneNumberAction } from "@/actions/waba.actions";

describe("Meta-backed WhatsApp asset removal", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mocks.events.length = 0;
    mocks.requireUser.mockResolvedValue({ id: "owner-1", role: "USER" });
    mocks.decrypt.mockReturnValue("decrypted-token");
    mocks.deregister.mockImplementation(async () => { mocks.events.push("meta-deregister"); });
    mocks.metaDelete.mockImplementation(async () => { mocks.events.push("meta-delete"); });
    mocks.findPhone.mockResolvedValue({
      id: "123456789",
      waba: { id: "waba-1", accessTokenEncrypted: "encrypted" },
    });
    mocks.deletePhone.mockImplementation(async () => { mocks.events.push("local-phone-delete"); });
    mocks.findTemplate.mockResolvedValue({
      id: "meta-template-1",
      name: "welcome_message",
      waba: { id: "waba-1", accessTokenEncrypted: "encrypted" },
    });
    mocks.updateCampaigns.mockResolvedValue({ count: 0 });
    mocks.transaction.mockImplementation(async (callback: (tx: unknown) => unknown) => callback({
      whatsAppCampaign: { updateMany: mocks.updateCampaigns },
      wabaTemplate: {
        delete: async () => { mocks.events.push("local-template-delete"); return {}; },
      },
    }));
  });

  it("deregisters an owner-scoped number on Meta before removing its local data", async () => {
    await expect(deleteWhatsAppPhoneNumberAction("123456789")).resolves.toMatchObject({ ok: true });
    expect(mocks.findPhone).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "123456789", waba: { userId: "owner-1" } },
    }));
    expect(mocks.events).toEqual(["meta-deregister", "local-phone-delete"]);
  });

  it("does not delete the local phone if Meta deregistration fails", async () => {
    mocks.deregister.mockRejectedValue(new Error("Meta unavailable"));
    await expect(deleteWhatsAppPhoneNumberAction("123456789")).resolves.toMatchObject({ ok: false });
    expect(mocks.deletePhone).not.toHaveBeenCalled();
  });

  it("deletes a local template and cancels scheduled campaigns only after Meta succeeds", async () => {
    await deleteWabaTemplateAction("meta-template-1");
    expect(mocks.findTemplate).toHaveBeenCalledWith(expect.objectContaining({
      where: { id: "meta-template-1", waba: { userId: "owner-1" } },
    }));
    expect(mocks.metaDelete).toHaveBeenCalledWith("welcome_message", "meta-template-1");
    expect(mocks.updateCampaigns).toHaveBeenCalledWith(expect.objectContaining({
      where: { templateId: "meta-template-1", status: { in: ["SCHEDULED", "PROCESSING"] } },
      data: expect.objectContaining({ status: "CANCELLED", templateId: null }),
    }));
    expect(mocks.events).toEqual(["meta-delete", "local-template-delete"]);
  });

  it("keeps the local template if Meta rejects deletion", async () => {
    mocks.metaDelete.mockRejectedValue(new Error("Meta unavailable"));
    await expect(deleteWabaTemplateAction("meta-template-1")).rejects.toThrow("Meta unavailable");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
