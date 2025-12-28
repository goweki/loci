// lib/services/template-sync.service.ts

"use server";

import {
  WabaTemplateFilters,
  WabaTemplateRepository,
} from "@/data/repositories/waba-template";

import {
  WabaTemplate,
  TemplateApprovalStatus,
  TemplateCategory,
  TemplateLanguage,
  WabaOwnership,
  WabaAccount,
  Prisma,
} from "@/lib/prisma/generated";
import type { WhatsAppClient } from "./client";
import whatsapp from "..";
import { Template as WabaTemplateCreateRequest } from "../types/waba-template";
import { WhatsAppClientEnv } from "../types/environment-variables";
import { getAdminUsers } from "@/data/user";
import {
  createWabaAccount,
  getAllWabaAccounts,
  getWabaAccountById,
  updateWabaAccount,
} from "@/data/waba";

/**
 * Service that syncs templates between Meta's API and our database
 * Combines WabaApiService (external API) with WabaTemplateRepository (database)
 */
export class TemplateSyncService {
  private WaClient: WhatsAppClient;

  constructor(private env: WhatsAppClientEnv) {
    this.WaClient = whatsapp;
  }

  /**
   * Sync all templates from Meta to local database
   * This will fetch templates from Meta and update/create them in the database
   */
  async syncFromMeta(): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    const result = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    //sync owned waba
    const ownedWabaInCloud = await this.WaClient.getWaba();
    const ownedWabaInDb = await getWabaAccountById(ownedWabaInCloud.id);
    const adminUsers = await getAdminUsers();

    try {
      if (!ownedWabaInDb) {
        const adminId = adminUsers[0].id;
        const appendedWaba: Prisma.WabaAccountUncheckedCreateInput = {
          id: ownedWabaInCloud.id,
          name: ownedWabaInCloud.name,
          userId: adminId,
          ownership: WabaOwnership.OWNED,
          timezoneId: ownedWabaInCloud.timezone_id,
          messageTemplateNamespace: ownedWabaInCloud.message_template_namespace,
        };
        createWabaAccount(appendedWaba);
        result.created++;
      } else {
        const adminId = ownedWabaInDb.userId ?? adminUsers[0].id;
        const appendedWaba: Partial<WabaAccount> = {
          name: ownedWabaInCloud.name,
          userId: adminId,
          ownership: WabaOwnership.OWNED,
          timezoneId: ownedWabaInCloud.timezone_id,
          messageTemplateNamespace: ownedWabaInCloud.message_template_namespace,
        };

        updateWabaAccount(ownedWabaInDb.id, appendedWaba);
        result.updated++;
      }
    } catch (error) {
      result.errors.push(
        `Failed to update Waba Account ${ownedWabaInCloud.name}: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    //sync shared wabas
    const sharedWabas = await this.WaClient.getSharedWabas();
    for (const waba of sharedWabas) {
      try {
        const sharedWabaInDb = await getWabaAccountById(waba.id);
        if (!sharedWabaInDb) {
          const appendedWaba: Prisma.WabaAccountUncheckedCreateInput = {
            id: ownedWabaInCloud.id,
            name: ownedWabaInCloud.name,
            ownership: WabaOwnership.OWNED,
            timezoneId: ownedWabaInCloud.timezone_id,
            messageTemplateNamespace:
              ownedWabaInCloud.message_template_namespace,
          };
          createWabaAccount(appendedWaba);
          result.created++;
        } else {
          const appendedWaba: Partial<WabaAccount> = {
            name: ownedWabaInCloud.name,
            ownership: WabaOwnership.OWNED,
            timezoneId: ownedWabaInCloud.timezone_id,
            messageTemplateNamespace:
              ownedWabaInCloud.message_template_namespace,
          };

          updateWabaAccount(sharedWabaInDb.id, appendedWaba);
          result.updated++;
        }
      } catch (error) {
        result.errors.push(
          `Failed to update Waba Account ${waba.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    // sync templates
    const syncedWabas = await getAllWabaAccounts();
    const templates: (Prisma.WabaTemplateUncheckedCreateInput & {
      id: string;
    })[] = [];

    for (const waba of syncedWabas) {
      const wabaTemplates = await this.WaClient.getTemplates(waba.id);
      if (wabaTemplates.length > 0) {
        const appendedTemplates: (Prisma.WabaTemplateUncheckedCreateInput & {
          id: string;
        })[] = wabaTemplates.map(
          ({ id, name, language, category, status, components }) => ({
            id,
            name,
            wabaId: waba.id,
            status: status as TemplateApprovalStatus,
            category: category as TemplateCategory,
            language: language as TemplateLanguage,
            components,
          })
        );
        templates.push(...appendedTemplates);
      }
    }

    for (const template of templates) {
      try {
        const existingTemplate = await WabaTemplateRepository.findById(
          template.id
        );
        if (existingTemplate) {
          // Update existing template
          await WabaTemplateRepository.update(existingTemplate.id, {
            status: template.status as TemplateApprovalStatus,
            components: template.components || undefined,
            rejectedReason:
              template.status == TemplateApprovalStatus.REJECTED
                ? "template rejected - shrug"
                : null,
            language: template.language as TemplateLanguage,
            category: template.category,
          });
          result.updated++;
        } else {
          // Create new template
          await WabaTemplateRepository.create(template);
          result.created++;
        }
      } catch (error) {
        result.errors.push(
          `Failed to sync template ${template.name}: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }

    return result;
  }

  /**
   * Update template status from Meta (useful for checking approval status)
   */
  async refreshTemplateStatus(templateId: string): Promise<WabaTemplate> {
    // Get template from database
    const template = await WabaTemplateRepository.findById(templateId);

    if (!template) {
      throw new Error("Template not found or access denied");
    }

    // Fetch latest status from Meta
    const metaTemplate = await this.WaClient.getTemplateByName(template.name);

    if (!metaTemplate) {
      throw new Error("Template not found in Meta");
    }

    // Update database with latest status
    const updated = await WabaTemplateRepository.update(templateId, {
      status: metaTemplate.status as TemplateApprovalStatus,
      rejectedReason:
        metaTemplate.status == TemplateApprovalStatus.REJECTED
          ? "template rejected - shrug"
          : null,
    });

    return updated;
  }

  /**
   * Compare local templates with Meta templates
   * Returns templates that are out of sync
   */
  async compareWithMeta(): Promise<{
    inSync: string[];
    outOfSync: string[];
    onlyInDatabase: string[];
    onlyInMeta: string[];
  }> {
    const [localTemplates, metaTemplates] = await Promise.all([
      WabaTemplateRepository.findMany(),
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
        (t) => t.name === localTemplate.name
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
