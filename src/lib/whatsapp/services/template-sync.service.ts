// lib/services/template-sync.service.ts

import "server-only";

import prisma from "@/lib/prisma";
import {
  PhoneNumberStatus,
  Prisma,
  TemplateApprovalStatus,
  TemplateCategory,
  TemplateLanguage,
  WabaAccount,
  WabaOwnership,
  WabaTemplate,
} from "@/lib/prisma/generated";
import { WabaService } from "@/services/waba/waba.service";
import { User } from "next-auth";
import type { WhatsAppClient } from "./client";

/**
 * Service that syncs templates and assets between Meta's API and our database
 */
export class MetaSyncService {
  constructor(private WaClient: WhatsAppClient) {}

  /**
   * Sync all templates and assets from Meta to the local database
   */
  async syncFromMeta(user?: User): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    console.log("Synchronizing Meta assets...");
    const result = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    // -----------------------------------------------------
    // 1. SYNC WABA ACCOUNT
    // -----------------------------------------------------
    const ownedWabaInCloud = await this.WaClient.getWaba();
    const wabaService = await WabaService.create(user);

    let ownedWabaInDb: Awaited<
      ReturnType<typeof wabaService.getWabaAccountById>
    > | null = null;

    try {
      ownedWabaInDb = await wabaService.getWabaAccountById(ownedWabaInCloud.id);
    } catch {
      console.warn("No WABA found in DB for Cloud ID:", ownedWabaInCloud.id);
    }

    try {
      if (!ownedWabaInDb) {
        console.log(
          `WABA ID ${ownedWabaInCloud.id} not found in DB. Resolving admin fallback...`,
        );

        // Get fallback admin if no user is assigned
        const adminUser = await prisma.user.findFirst({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        if (!adminUser) {
          throw new Error(
            "No admin user found in database to assign WABA ownership.",
          );
        }

        const appendedWaba: Prisma.WabaAccountUncheckedCreateInput = {
          id: ownedWabaInCloud.id,
          name: ownedWabaInCloud.name,
          userId: adminUser.id,
          ownership: WabaOwnership.OWNED,
          timezoneId: ownedWabaInCloud.timezone_id,
          messageTemplateNamespace: ownedWabaInCloud.message_template_namespace,
        };

        // Reassign to outer scope variable so Phone Number sync can access it
        ownedWabaInDb = await wabaService.createWabaAccount(appendedWaba);
        result.created++;

        console.log(` >> Created WABA Account:`, ownedWabaInDb.id);
      } else {
        const adminUser = await prisma.user.findFirst({
          where: { role: "ADMIN" },
          select: { id: true },
        });

        const adminId = ownedWabaInDb.userId ?? adminUser?.id;

        const appendedWaba: Prisma.WabaAccountUpdateInput = {
          name: ownedWabaInCloud.name,
          ownership: WabaOwnership.OWNED,
          timezoneId: ownedWabaInCloud.timezone_id,
          messageTemplateNamespace: ownedWabaInCloud.message_template_namespace,
          ...(adminId ? { user: { connect: { id: adminId } } } : {}),
        };

        ownedWabaInDb = await wabaService.updateWabaAccount(
          ownedWabaInDb.id,
          appendedWaba,
        );
        result.updated++;

        console.log(` >> Updated WABA Account:`, ownedWabaInDb.id);
      }
    } catch (error) {
      result.errors.push(
        `Failed to update WABA Account ${ownedWabaInCloud.name}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    // -----------------------------------------------------
    // 2. SYNC PHONE NUMBERS
    // -----------------------------------------------------
    let ownedWabaPhoneNumbersInCloud: any[] = [];
    try {
      const response = await this.WaClient.getPhoneNumbers();
      ownedWabaPhoneNumbersInCloud = response?.data || [];

      if (!ownedWabaInDb) {
        throw new Error(
          "No WABA account available in DB. Skipping phone numbers sync.",
        );
      }

      if (ownedWabaPhoneNumbersInCloud.length === 0) {
        console.log(`No owned phone numbers found in Meta Cloud.`);
      } else {
        const wabaId = ownedWabaInDb.id;
        console.log(
          `Saving ${ownedWabaPhoneNumbersInCloud.length} phone numbers for WABA ID: ${wabaId}`,
        );

        const phoneNumberOperations = ownedWabaPhoneNumbersInCloud.map(
          (phone) => {
            return prisma.phoneNumber.upsert({
              where: { id: phone.id },
              update: {
                phoneNumber: phone.display_phone_number,
                displayName: phone.verified_name,
                status: PhoneNumberStatus.VERIFIED,
                wabaId,
              },
              create: {
                id: phone.id,
                phoneNumber: phone.display_phone_number,
                displayName: phone.verified_name,
                wabaId,
                status: PhoneNumberStatus.VERIFIED,
              },
            });
          },
        );

        await prisma.$transaction(phoneNumberOperations);
        result.created += ownedWabaPhoneNumbersInCloud.length;
        console.log(`Successfully synced phone numbers for WABA: ${wabaId}`);
      }
    } catch (error) {
      result.errors.push(
        `Failed to sync phone numbers: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    // -----------------------------------------------------
    // 3. SYNC TEMPLATES
    // -----------------------------------------------------
    try {
      const localWabas = await wabaService.getAllWabaAccounts();
      const templatesToSync: (Prisma.WabaTemplateUncheckedCreateInput & {
        id: string;
      })[] = [];

      for (const waba of localWabas) {
        const remoteTemplates = await this.WaClient.getTemplates(waba.id);

        if (remoteTemplates && remoteTemplates.length > 0) {
          const formatted = remoteTemplates.map(
            ({ id, name, language, category, status, components }) => ({
              id,
              name,
              wabaId: waba.id,
              status: status as TemplateApprovalStatus,
              category: category as TemplateCategory,
              language: language as TemplateLanguage,
              components: components as Prisma.InputJsonValue,
            }),
          );
          templatesToSync.push(...formatted);
        }
      }

      if (templatesToSync.length > 0) {
        const templateOperations = templatesToSync.map((template) => {
          const rejectedReason =
            template.status === TemplateApprovalStatus.REJECTED
              ? "Rejected by Meta"
              : null;

          return prisma.wabaTemplate.upsert({
            where: { id: template.id },
            update: {
              status: template.status,
              category: template.category,
              language: template.language,
              components: template.components,
              rejectedReason,
            },
            create: {
              id: template.id,
              name: template.name,
              wabaId: template.wabaId,
              status: template.status,
              category: template.category,
              language: template.language,
              components: template.components,
              rejectedReason,
            },
          });
        });

        const syncedTemplates = await prisma.$transaction(templateOperations);
        result.updated += syncedTemplates.length;
        console.log(
          `Successfully batch-synced ${syncedTemplates.length} templates.`,
        );
      }
    } catch (error) {
      result.errors.push(
        `Failed during template batch sync: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    return result;
  }

  /**
   * Refresh template approval status directly from Meta
   */
  async refreshTemplateStatus(templateId: string): Promise<WabaTemplate> {
    const template = await prisma.wabaTemplate.findUnique({
      where: { id: templateId },
    });

    if (!template) {
      throw new Error("Template not found in local database.");
    }

    const metaTemplate = await this.WaClient.getTemplateByName(template.name);

    if (!metaTemplate) {
      throw new Error(`Template "${template.name}" not found in Meta Cloud.`);
    }

    return prisma.wabaTemplate.update({
      where: { id: templateId },
      data: {
        status: metaTemplate.status as TemplateApprovalStatus,
        rejectedReason:
          metaTemplate.status === TemplateApprovalStatus.REJECTED
            ? "Rejected by Meta"
            : null,
      },
    });
  }

  /**
   * Compare local templates against Meta Cloud templates
   */
  async compareWithMeta(): Promise<{
    inSync: string[];
    outOfSync: string[];
    onlyInDatabase: string[];
    onlyInMeta: string[];
  }> {
    const [localTemplates, metaTemplates] = await Promise.all([
      prisma.wabaTemplate.findMany(),
      this.WaClient.getTemplates(),
    ]);

    const localNames = new Set(localTemplates.map((t) => t.name));
    const metaNames = new Set(metaTemplates.map((t) => t.name));

    const onlyInDatabase = localTemplates
      .filter((t) => !metaNames.has(t.name))
      .map((t) => t.name);

    const onlyInMeta = metaTemplates
      .filter((t) => !localNames.has(t.name))
      .map((t) => t.name);

    const inSync: string[] = [];
    const outOfSync: string[] = [];

    for (const localTemplate of localTemplates) {
      const metaTemplate = metaTemplates.find(
        (t) => t.name === localTemplate.name,
      );

      if (metaTemplate) {
        if (localTemplate.status === metaTemplate.status) {
          inSync.push(localTemplate.name);
        } else {
          outOfSync.push(localTemplate.name);
        }
      }
    }

    return {
      inSync,
      outOfSync,
      onlyInDatabase,
      onlyInMeta,
    };
  }
}
