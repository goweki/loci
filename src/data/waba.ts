"use server";

import prisma from "@/lib/prisma";
import { Prisma } from "@/lib/prisma/generated";

/**
 * Create a new WABA account
 */
export async function createWabaAccount(
  data: Prisma.WabaAccountCreateInput | Prisma.WabaAccountUncheckedCreateInput
) {
  return await prisma.wabaAccount.create({
    data,
    include: {
      user: true,
      phoneNumbers: true,
      templates: true,
    },
  });
}

/**
 * Get WABA account by ID
 */
export async function getWabaAccountById(id: string) {
  return await prisma.wabaAccount.findUnique({
    where: { id },
    include: {
      user: true,
      phoneNumbers: true,
      templates: true,
    },
  });
}

/**
 * Get WABA account by user ID
 */
export async function getWabaAccountByUserId(userId: string) {
  return await prisma.wabaAccount.findUnique({
    where: { userId },
    include: {
      phoneNumbers: true,
      templates: true,
    },
  });
}

/**
 * Update WABA account
 */
export async function updateWabaAccount(
  id: string,
  data: Prisma.WabaAccountUpdateInput
) {
  return await prisma.wabaAccount.update({
    where: { id },
    data,
    include: {
      phoneNumbers: true,
      templates: true,
    },
  });
}

/**
 * Delete WABA account
 */
export async function deleteWabaAccount(id: string) {
  return await prisma.wabaAccount.delete({
    where: { id },
  });
}

/**
 * Get all WABA accounts
 */
export async function getAllWabaAccounts() {
  return await prisma.wabaAccount.findMany({
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
      phoneNumbers: true,
      templates: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

// =====================================================
// WABA Template Functions
// =====================================================

/**
 * Create a new WABA template
 */
export async function createWabaTemplate(data: Prisma.WabaTemplateCreateInput) {
  return await prisma.wabaTemplate.create({
    data,
    include: {
      waba: true,
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get template by ID
 */
export async function getWabaTemplateById(id: string) {
  return await prisma.wabaTemplate.findUnique({
    where: { id },
    include: {
      waba: true,
      createdBy: true,
    },
  });
}

/**
 * Get all templates for a WABA account
 */
export async function getWabaTemplatesByWabaId(wabaId: string) {
  return await prisma.wabaTemplate.findMany({
    where: { wabaId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get templates by status
 */
export async function getWabaTemplatesByStatus(
  wabaId: string,
  status: Prisma.EnumTemplateApprovalStatusFilter
) {
  return await prisma.wabaTemplate.findMany({
    where: {
      wabaId,
      status,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Get templates by category
 */
export async function getWabaTemplatesByCategory(
  wabaId: string,
  category: Prisma.EnumTemplateCategoryFilter
) {
  return await prisma.wabaTemplate.findMany({
    where: {
      wabaId,
      category,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Update WABA template
 */
export async function updateWabaTemplate(
  id: string,
  data: Prisma.WabaTemplateUpdateInput
) {
  return await prisma.wabaTemplate.update({
    where: { id },
    data,
    include: {
      waba: true,
      createdBy: true,
    },
  });
}

/**
 * Delete WABA template
 */
export async function deleteWabaTemplate(id: string) {
  return await prisma.wabaTemplate.delete({
    where: { id },
  });
}

/**
 * Search templates by name
 */
export async function searchWabaTemplates(wabaId: string, searchQuery: string) {
  return await prisma.wabaTemplate.findMany({
    where: {
      wabaId,
      name: {
        contains: searchQuery,
        mode: "insensitive",
      },
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Bulk create or update templates (useful for syncing from Cloud API)
 */
export async function syncWabaTemplates(
  wabaId: string,
  templates: Array<Prisma.WabaTemplateCreateInput>
) {
  const operations = templates.map((template) =>
    prisma.wabaTemplate.upsert({
      where: {
        id: template.id as string,
      },
      create: template,
      update: {
        name: template.name,
        status: template.status,
        category: template.category,
        language: template.language,
        components: template.components,
        rejectedReason: template.rejectedReason,
      },
    })
  );

  return await prisma.$transaction(operations);
}

// =====================================================
// Phone Number Functions
// =====================================================

/**
 * Create a new phone number
 */
export async function createPhoneNumber(data: Prisma.PhoneNumberCreateInput) {
  return await prisma.phoneNumber.create({
    data,
    include: {
      waba: true,
      messages: false,
      autoReplyRules: false,
    },
  });
}

/**
 * Get phone number by ID
 */
export async function getPhoneNumberById(id: string) {
  return await prisma.phoneNumber.findUnique({
    where: { id },
    include: {
      waba: true,
      autoReplyRules: true,
    },
  });
}

/**
 * Get phone number by phone number string
 */
export async function getPhoneNumberByNumber(phoneNumber: string) {
  return await prisma.phoneNumber.findUnique({
    where: { phoneNumber },
    include: {
      waba: true,
      autoReplyRules: true,
    },
  });
}

/**
 * Get all phone numbers for a WABA account
 */
export async function getPhoneNumbersByWabaId(wabaId: string) {
  return await prisma.phoneNumber.findMany({
    where: { wabaId },
    include: {
      autoReplyRules: true,
    },
    orderBy: {
      createdAt: "desc",
    },
  });
}

/**
 * Update phone number
 */
export async function updatePhoneNumber(
  id: string,
  data: Prisma.PhoneNumberUpdateInput
) {
  return await prisma.phoneNumber.update({
    where: { id },
    data,
    include: {
      waba: true,
      autoReplyRules: true,
    },
  });
}

/**
 * Verify phone number
 */
export async function verifyPhoneNumber(id: string) {
  return await prisma.phoneNumber.update({
    where: { id },
    data: {
      status: "VERIFIED",
      verifiedAt: new Date(),
    },
  });
}

/**
 * Delete phone number
 */
export async function deletePhoneNumber(id: string) {
  return await prisma.phoneNumber.delete({
    where: { id },
  });
}

/**
 * Get verified phone numbers for a WABA account
 */
export async function getVerifiedPhoneNumbers(wabaId: string) {
  return await prisma.phoneNumber.findMany({
    where: {
      wabaId,
      status: "VERIFIED",
    },
    orderBy: {
      verifiedAt: "desc",
    },
  });
}

// =====================================================
// Auto Reply Rule Functions
// =====================================================

/**
 * Create a new auto reply rule
 */
export async function createAutoReplyRule(
  data: Prisma.AutoReplyRuleCreateInput
) {
  return await prisma.autoReplyRule.create({
    data,
    include: {
      phoneNumber: true,
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get auto reply rule by ID
 */
export async function getAutoReplyRuleById(id: string) {
  return await prisma.autoReplyRule.findUnique({
    where: { id },
    include: {
      phoneNumber: true,
      createdBy: true,
    },
  });
}

/**
 * Get all auto reply rules for a phone number
 */
export async function getAutoReplyRulesByPhoneNumberId(phoneNumberId: string) {
  return await prisma.autoReplyRule.findMany({
    where: { phoneNumberId },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: {
      priority: "asc",
    },
  });
}

/**
 * Get active auto reply rules for a phone number
 */
export async function getActiveAutoReplyRules(phoneNumberId: string) {
  return await prisma.autoReplyRule.findMany({
    where: {
      phoneNumberId,
      isActive: true,
      active: true,
    },
    orderBy: {
      priority: "asc",
    },
  });
}

/**
 * Update auto reply rule
 */
export async function updateAutoReplyRule(
  id: string,
  data: Prisma.AutoReplyRuleUpdateInput
) {
  return await prisma.autoReplyRule.update({
    where: { id },
    data,
    include: {
      phoneNumber: true,
      createdBy: true,
    },
  });
}

/**
 * Toggle auto reply rule active status
 */
export async function toggleAutoReplyRule(id: string) {
  const rule = await prisma.autoReplyRule.findUnique({
    where: { id },
  });

  if (!rule) {
    throw new Error("Auto reply rule not found");
  }

  return await prisma.autoReplyRule.update({
    where: { id },
    data: {
      isActive: !rule.isActive,
    },
  });
}

/**
 * Delete auto reply rule
 */
export async function deleteAutoReplyRule(id: string) {
  return await prisma.autoReplyRule.delete({
    where: { id },
  });
}

/**
 * Get auto reply rules by trigger type
 */
export async function getAutoReplyRulesByTriggerType(
  phoneNumberId: string,
  triggerType: Prisma.EnumTriggerTypeFilter
) {
  return await prisma.autoReplyRule.findMany({
    where: {
      phoneNumberId,
      triggerType,
      isActive: true,
    },
    orderBy: {
      priority: "asc",
    },
  });
}

/**
 * Get all auto reply rules for a user
 */
export async function getAutoReplyRulesByUserId(userId: string) {
  return await prisma.autoReplyRule.findMany({
    where: {
      createdById: userId,
    },
    include: {
      phoneNumber: {
        select: {
          phoneNumber: true,
          displayName: true,
        },
      },
    },
    orderBy: [
      {
        phoneNumberId: "asc",
      },
      {
        priority: "asc",
      },
    ],
  });
}

// =====================================================
// Contact Functions
// =====================================================

/**
 * Create a new contact
 */
export async function createContact(data: Prisma.ContactCreateInput) {
  return await prisma.contact.create({
    data,
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
}

/**
 * Get contact by ID
 */
export async function getContactById(id: string) {
  return await prisma.contact.findUnique({
    where: { id },
    include: {
      messages: {
        orderBy: {
          timestamp: "desc",
        },
        take: 10,
      },
    },
  });
}

/**
 * Get or create contact
 */
export async function getOrCreateContact(
  userId: string,
  phoneNumber: string,
  name?: string
) {
  return await prisma.contact.upsert({
    where: {
      userId_phoneNumber: {
        userId,
        phoneNumber,
      },
    },
    create: {
      userId,
      phoneNumber,
      name,
    },
    update: {
      lastMessageAt: new Date(),
    },
  });
}

/**
 * Get all contacts for a user
 */
export async function getContactsByUserId(userId: string) {
  return await prisma.contact.findMany({
    where: { userId },
    orderBy: {
      lastMessageAt: "desc",
    },
  });
}

/**
 * Update contact
 */
export async function updateContact(
  id: string,
  data: Prisma.ContactUpdateInput
) {
  return await prisma.contact.update({
    where: { id },
    data,
  });
}

/**
 * Delete contact
 */
export async function deleteContact(id: string) {
  return await prisma.contact.delete({
    where: { id },
  });
}

/**
 * Search contacts
 */
export async function searchContacts(userId: string, searchQuery: string) {
  return await prisma.contact.findMany({
    where: {
      userId,
      OR: [
        {
          name: {
            contains: searchQuery,
            mode: "insensitive",
          },
        },
        {
          phoneNumber: {
            contains: searchQuery,
          },
        },
      ],
    },
    orderBy: {
      lastMessageAt: "desc",
    },
  });
}

// =====================================================
// Message Functions
// =====================================================

/**
 * Create a new message
 */
export async function createMessage(data: Prisma.MessageCreateInput) {
  return await prisma.message.create({
    data,
    include: {
      contact: true,
      phoneNumber: true,
      user: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  });
}

/**
 * Get message by ID
 */
export async function getMessageById(id: string) {
  return await prisma.message.findUnique({
    where: { id },
    include: {
      contact: true,
      phoneNumber: true,
    },
  });
}

/**
 * Get messages for a contact
 */
export async function getMessagesByContactId(
  contactId: string,
  limit: number = 50
) {
  return await prisma.message.findMany({
    where: { contactId },
    include: {
      phoneNumber: {
        select: {
          phoneNumber: true,
          displayName: true,
        },
      },
    },
    orderBy: {
      timestamp: "desc",
    },
    take: limit,
  });
}

/**
 * Update message status
 */
export async function updateMessageStatus(
  id: string,
  status: Prisma.EnumMessageStatusFieldUpdateOperationsInput
) {
  return await prisma.message.update({
    where: { id },
    data: { status },
  });
}

/**
 * Get unread messages count for a user
 */
export async function getUnreadMessagesCount(userId: string) {
  return await prisma.message.count({
    where: {
      userId,
      direction: "INBOUND",
      status: {
        not: "READ",
      },
    },
  });
}

/**
 * Mark messages as read
 */
export async function markMessagesAsRead(contactId: string) {
  return await prisma.message.updateMany({
    where: {
      contactId,
      direction: "INBOUND",
      status: {
        not: "READ",
      },
    },
    data: {
      status: "READ",
    },
  });
}

// =====================================================
// Utility Functions
// =====================================================

/**
 * Get dashboard statistics for a user
 */
export async function getWabaDashboardStats(userId: string) {
  const wabaAccount = await getWabaAccountByUserId(userId);

  if (!wabaAccount) {
    return null;
  }

  const [
    totalPhoneNumbers,
    verifiedPhoneNumbers,
    totalTemplates,
    approvedTemplates,
    totalContacts,
    totalMessages,
    activeAutoReplyRules,
  ] = await Promise.all([
    prisma.phoneNumber.count({ where: { wabaId: wabaAccount.id } }),
    prisma.phoneNumber.count({
      where: { wabaId: wabaAccount.id, status: "VERIFIED" },
    }),
    prisma.wabaTemplate.count({ where: { wabaId: wabaAccount.id } }),
    prisma.wabaTemplate.count({
      where: { wabaId: wabaAccount.id, status: "APPROVED" },
    }),
    prisma.contact.count({ where: { userId } }),
    prisma.message.count({ where: { userId } }),
    prisma.autoReplyRule.count({
      where: {
        createdById: userId,
        isActive: true,
        active: true,
      },
    }),
  ]);

  return {
    wabaAccount,
    stats: {
      totalPhoneNumbers,
      verifiedPhoneNumbers,
      totalTemplates,
      approvedTemplates,
      totalContacts,
      totalMessages,
      activeAutoReplyRules,
    },
  };
}
