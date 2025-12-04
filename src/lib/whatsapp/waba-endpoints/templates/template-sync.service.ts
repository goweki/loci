// lib/services/template-sync.service.ts

import { WabaTemplateRepository } from "@/data/repositories/waba-template";
import type {
  WabaTemplate,
  TemplateApprovalStatus,
} from "@/lib/prisma/generated";
import {
  WabaApiService,
  createWabaApiService,
  type MetaTemplate,
  type CreateTemplateInput,
} from "./template-endpoint";

/**
 * Service that syncs templates between Meta's API and our database
 * Combines WabaApiService (external API) with WabaTemplateRepository (database)
 */
export class TemplateSyncService {
  private apiService: WabaApiService;
  private userId: string;
  private wabaAccountId: string;

  constructor(userId: string, wabaAccountId: string) {
    this.userId = userId;
    this.wabaAccountId = wabaAccountId;
    this.apiService = createWabaApiService(wabaAccountId);
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

    try {
      // Fetch all templates from Meta
      const metaTemplates = await this.apiService.getAllTemplates();

      for (const metaTemplate of metaTemplates) {
        try {
          // Check if template exists in database
          const existing = await WabaTemplateRepository.findMany({
            userId: this.userId,
            wabaAccountId: this.wabaAccountId,
            searchQuery: metaTemplate.name,
          });

          const existingTemplate = existing.find(
            (t) => t.name === metaTemplate.name
          );

          if (existingTemplate) {
            // Update existing template
            await WabaTemplateRepository.update(existingTemplate.id, {
              status: metaTemplate.status as TemplateApprovalStatus,
              components: metaTemplate.components as any,
              rejectedReason: metaTemplate.rejected_reason || null,
              language: metaTemplate.language as any,
              category: metaTemplate.category,
            });
            result.updated++;
          } else {
            // Create new template
            await WabaTemplateRepository.create({
              name: metaTemplate.name,
              status: metaTemplate.status as TemplateApprovalStatus,
              category: metaTemplate.category,
              language: metaTemplate.language as any,
              components: metaTemplate.components as any,
              wabaAccountId: this.wabaAccountId,
              userId: this.userId,
              rejectedReason: metaTemplate.rejected_reason || null,
            });
            result.created++;
          }
        } catch (error) {
          result.errors.push(
            `Failed to sync template ${metaTemplate.name}: ${error instanceof Error ? error.message : "Unknown error"}`
          );
        }
      }
    } catch (error) {
      result.errors.push(
        `Failed to fetch templates from Meta: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    }

    return result;
  }

  /**
   * Create a template in Meta and save to database
   */
  async createTemplate(input: CreateTemplateInput): Promise<WabaTemplate> {
    // Create in Meta first
    const metaResponse = await this.apiService.createTemplate(input);

    // Save to database
    const template = await WabaTemplateRepository.create({
      name: input.name,
      status: metaResponse.status as TemplateApprovalStatus,
      category: metaResponse.category,
      language: input.language as any,
      components: input.components as any,
      wabaAccountId: this.wabaAccountId,
      userId: this.userId,
    });

    return template;
  }

  /**
   * Delete a template from both Meta and database
   */
  async deleteTemplate(templateId: string): Promise<void> {
    // Get template from database
    const template = await WabaTemplateRepository.findByIdAndUserId(
      templateId,
      this.userId
    );

    if (!template) {
      throw new Error("Template not found or access denied");
    }

    // Delete from Meta
    await this.apiService.deleteTemplateByName(template.name);

    // Delete from database
    await WabaTemplateRepository.delete(templateId);
  }

  /**
   * Update template status from Meta (useful for checking approval status)
   */
  async refreshTemplateStatus(templateId: string): Promise<WabaTemplate> {
    // Get template from database
    const template = await WabaTemplateRepository.findByIdAndUserId(
      templateId,
      this.userId
    );

    if (!template) {
      throw new Error("Template not found or access denied");
    }

    // Fetch latest status from Meta
    const metaTemplate = await this.apiService.getTemplateByName(template.name);

    if (!metaTemplate) {
      throw new Error("Template not found in Meta");
    }

    // Update database with latest status
    const updated = await WabaTemplateRepository.update(templateId, {
      status: metaTemplate.status as TemplateApprovalStatus,
      rejectedReason: metaTemplate.rejected_reason || null,
    });

    return updated;
  }

  /**
   * Get all templates for this user (from database)
   */
  async getTemplates(): Promise<WabaTemplate[]> {
    return WabaTemplateRepository.findMany({
      userId: this.userId,
      wabaAccountId: this.wabaAccountId,
    });
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
      WabaTemplateRepository.findMany({
        userId: this.userId,
        wabaAccountId: this.wabaAccountId,
      }),
      this.apiService.getAllTemplates(),
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

/**
 * Factory function to create TemplateSyncService
 */
export function createTemplateSyncService(
  userId: string,
  wabaAccountId: string
): TemplateSyncService {
  return new TemplateSyncService(userId, wabaAccountId);
}

// Example usage in API routes or server actions:

/**
 * Example: Sync templates for a user
 */
export async function syncUserTemplates(userId: string, wabaAccountId: string) {
  const syncService = createTemplateSyncService(userId, wabaAccountId);
  return syncService.syncFromMeta();
}

/**
 * Example: Create template
 */
export async function createUserTemplate(
  userId: string,
  wabaAccountId: string,
  input: CreateTemplateInput
) {
  const syncService = createTemplateSyncService(userId, wabaAccountId);
  return syncService.createTemplate(input);
}

/**
 * Example: Delete template
 */
export async function deleteUserTemplate(
  userId: string,
  wabaAccountId: string,
  templateId: string
) {
  const syncService = createTemplateSyncService(userId, wabaAccountId);
  return syncService.deleteTemplate(templateId);
}
