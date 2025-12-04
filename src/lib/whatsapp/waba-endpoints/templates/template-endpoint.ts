// lib/services/template-endpoint.ts

import type {
  TemplateApprovalStatus,
  TemplateCategory,
  TemplateLanguage,
} from "@/lib/prisma/generated";

export type MetaTemplateComponent = {
  type: "HEADER" | "BODY" | "FOOTER" | "BUTTONS";
  format?: "TEXT" | "IMAGE" | "VIDEO" | "DOCUMENT" | "LOCATION";
  text?: string;
  example?: {
    header_text?: string[];
    body_text?: string[][];
    header_handle?: string[];
  };
  buttons?: Array<{
    type: "QUICK_REPLY" | "URL" | "PHONE_NUMBER" | "OTP" | "CATALOG" | "MPM";
    text: string;
    url?: string;
    phone_number?: string;
    otp_type?: "COPY_CODE" | "ONE_TAP";
    autofill_text?: string;
    package_name?: string;
    signature_hash?: string;
  }>;
  add_security_recommendation?: boolean;
  code_expiration_minutes?: number;
};

export type MetaTemplate = {
  id: string;
  name: string;
  status: TemplateApprovalStatus;
  category: TemplateCategory;
  language: string;
  components: MetaTemplateComponent[];
  previous_category?: string;
  rejected_reason?: string;
};

export type MetaTemplateListResponse = {
  data: MetaTemplate[];
  paging?: {
    cursors?: {
      before: string;
      after: string;
    };
  };
};

export type CreateTemplateInput = {
  name: string;
  language: string;
  category: TemplateCategory;
  components: MetaTemplateComponent[];
};

export type CreateTemplateResponse = {
  id: string;
  status: TemplateApprovalStatus;
  category: TemplateCategory;
};

export type WabaApiConfig = {
  accessToken: string;
  wabaId: string;
  apiVersion?: string;
};

/**
 * Service to interact with Meta WhatsApp Business API
 * Handles all external API calls to Meta's Graph API
 */
export class WabaApiService {
  private baseUrl: string;
  private accessToken: string;
  private wabaId: string;

  constructor(config: WabaApiConfig) {
    this.accessToken = config.accessToken;
    this.wabaId = config.wabaId;
    this.baseUrl = `https://graph.facebook.com/${config.apiVersion || "v18.0"}`;
  }

  /**
   * Get all templates from Meta WABA
   */
  async getAllTemplates(): Promise<MetaTemplate[]> {
    const url = `${this.baseUrl}/${this.wabaId}/message_templates`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.statusText}`);
    }

    const data: MetaTemplateListResponse = await response.json();
    return data.data;
  }

  /**
   * Get a template by name
   */
  async getTemplateByName(name: string): Promise<MetaTemplate | null> {
    const url = `${this.baseUrl}/${this.wabaId}/message_templates?name=${encodeURIComponent(name)}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }

    const data: MetaTemplateListResponse = await response.json();
    return data.data[0] || null;
  }

  /**
   * Get a template by ID
   */
  async getTemplateById(templateId: string): Promise<MetaTemplate> {
    const url = `${this.baseUrl}/${templateId}`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch template: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Create a new template
   */
  async createTemplate(
    input: CreateTemplateInput
  ): Promise<CreateTemplateResponse> {
    const url = `${this.baseUrl}/${this.wabaId}/message_templates`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to create template: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Update/edit an existing template
   */
  async updateTemplate(
    templateId: string,
    input: Partial<CreateTemplateInput>
  ): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/${templateId}`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Failed to update template: ${JSON.stringify(error)}`);
    }

    return response.json();
  }

  /**
   * Delete a template by name
   */
  async deleteTemplateByName(name: string): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/${this.wabaId}/message_templates?name=${encodeURIComponent(name)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Delete a template by ID
   */
  async deleteTemplateById(
    templateId: string,
    name: string
  ): Promise<{ success: boolean }> {
    const url = `${this.baseUrl}/${this.wabaId}/message_templates?hsm_id=${templateId}&name=${encodeURIComponent(name)}`;

    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to delete template: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Get the message template namespace
   */
  async getNamespace(): Promise<{
    message_template_namespace: string;
    id: string;
  }> {
    const url = `${this.baseUrl}/${this.wabaId}?fields=message_template_namespace`;

    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch namespace: ${response.statusText}`);
    }

    return response.json();
  }
}

/**
 * Factory function to create WabaApiService instance
 * Gets config from environment variables
 */
export function createWabaApiService(wabaId?: string): WabaApiService {
  const accessToken = process.env.META_ACCESS_TOKEN;
  const defaultWabaId = process.env.META_WABA_ID;
  const apiVersion = process.env.META_API_VERSION || "v18.0";

  if (!accessToken) {
    throw new Error("META_ACCESS_TOKEN environment variable is not set");
  }

  if (!wabaId && !defaultWabaId) {
    throw new Error("WABA ID must be provided or META_WABA_ID must be set");
  }

  return new WabaApiService({
    accessToken,
    wabaId: wabaId || defaultWabaId!,
    apiVersion,
  });
}

// Export convenience functions
export async function syncTemplatesFromMeta(
  wabaId: string
): Promise<MetaTemplate[]> {
  const service = createWabaApiService(wabaId);
  return service.getAllTemplates();
}

export async function createMetaTemplate(
  wabaId: string,
  input: CreateTemplateInput
): Promise<CreateTemplateResponse> {
  const service = createWabaApiService(wabaId);
  return service.createTemplate(input);
}

export async function deleteMetaTemplate(
  wabaId: string,
  name: string
): Promise<{ success: boolean }> {
  const service = createWabaApiService(wabaId);
  return service.deleteTemplateByName(name);
}
