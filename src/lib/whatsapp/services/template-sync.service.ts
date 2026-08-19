// // lib/services/template-sync.service.ts

// import "server-only";

// import prisma from "@/lib/prisma";
// import {
//   PhoneNumberStatus,
//   Prisma,
//   TemplateApprovalStatus,
//   TemplateCategory,
//   TemplateLanguage,
//   WabaOwnership,
//   WabaTemplate,
// } from "@/lib/prisma/generated";
// import { WabaService } from "@/services/waba/waba.service";
// import type { User } from "next-auth";
// import type { WhatsAppClient } from "./client";

// /**
//  * Service responsible for synchronizing WABA phone numbers and
//  * message templates between Meta Cloud API and the local database.
//  *
//  * IMPORTANT:
//  * Meta's phone_number_id is intentionally used as PhoneNumber.id.
//  *
//  * This gives us a direct mapping:
//  *
//  *   Meta phone_number_id
//  *          ↓
//  *   PhoneNumber.id
//  *
//  * Therefore Message.phoneNumberId can safely reference the
//  * Meta phone_number_id directly.
//  */
// export class MetaSyncService {
//   constructor(private readonly WaClient: WhatsAppClient) {}

//   /**
//    * Synchronize the connected WABA, phone numbers and templates
//    * from Meta into the local database.
//    */
//   async syncFromMeta(user?: User): Promise<{
//     created: number;
//     updated: number;
//     errors: string[];
//   }> {
//     console.log("Synchronizing Meta assets...");

//     const result = {
//       created: 0,
//       updated: 0,
//       errors: [] as string[],
//     };

//     // -----------------------------------------------------
//     // 1. SYNC WABA ACCOUNT
//     // -----------------------------------------------------

//     const ownedWabaInCloud = await this.WaClient.getWaba();
//     const wabaService = await WabaService.create(user);

//     let ownedWabaInDb: Awaited<
//       ReturnType<typeof wabaService.getWabaAccountById>
//     > | null = null;

//     try {
//       ownedWabaInDb = await wabaService.getWabaAccountById(ownedWabaInCloud.id);
//     } catch {
//       console.warn(
//         "No WABA found in DB for Meta Cloud ID:",
//         ownedWabaInCloud.id,
//       );
//     }

//     try {
//       if (!ownedWabaInDb) {
//         /**
//          * Prefer the authenticated user.
//          *
//          * The admin fallback is retained for backwards compatibility
//          * with system-level synchronization where no user is supplied.
//          */
//         let ownerId = user?.id;

//         if (!ownerId) {
//           const adminUser = await prisma.user.findFirst({
//             where: {
//               role: "ADMIN",
//             },
//             select: {
//               id: true,
//             },
//           });

//           ownerId = adminUser?.id;
//         }

//         if (!ownerId) {
//           throw new Error("No user available to assign WABA ownership.");
//         }

//         console.log(
//           `WABA ${ownedWabaInCloud.id} not found locally. Creating it for user ${ownerId}.`,
//         );

//         const wabaData: Prisma.WabaAccountUncheckedCreateInput = {
//           /**
//            * Meta WABA ID is intentionally used as our WABA primary key.
//            */
//           id: ownedWabaInCloud.id,

//           name: ownedWabaInCloud.name,

//           userId: ownerId,

//           ownership: WabaOwnership.OWNED,

//           timezoneId: ownedWabaInCloud.timezone_id ?? null,

//           messageTemplateNamespace:
//             ownedWabaInCloud.message_template_namespace ?? null,
//         };

//         ownedWabaInDb = await wabaService.createWabaAccount(wabaData);

//         result.created++;

//         console.log(` >> Created WABA Account: ${ownedWabaInDb.id}`);
//       } else {
//         /**
//          * Preserve the existing owner where possible.
//          *
//          * If the existing WABA has no owner, associate it with
//          * the authenticated user before falling back to an admin.
//          */
//         let ownerId = ownedWabaInDb.userId ?? user?.id;

//         if (!ownerId) {
//           const adminUser = await prisma.user.findFirst({
//             where: {
//               role: "ADMIN",
//             },
//             select: {
//               id: true,
//             },
//           });

//           ownerId = adminUser?.id;
//         }

//         const wabaData: Prisma.WabaAccountUpdateInput = {
//           name: ownedWabaInCloud.name,

//           ownership: WabaOwnership.OWNED,

//           timezoneId: ownedWabaInCloud.timezone_id ?? null,

//           messageTemplateNamespace:
//             ownedWabaInCloud.message_template_namespace ?? null,

//           ...(ownerId
//             ? {
//                 user: {
//                   connect: {
//                     id: ownerId,
//                   },
//                 },
//               }
//             : {}),
//         };

//         ownedWabaInDb = await wabaService.updateWabaAccount(
//           ownedWabaInDb.id,
//           wabaData,
//         );

//         result.updated++;

//         console.log(` >> Updated WABA Account: ${ownedWabaInDb.id}`);
//       }
//     } catch (error) {
//       result.errors.push(
//         `Failed to sync WABA Account ${ownedWabaInCloud.name}: ${
//           error instanceof Error ? error.message : "Unknown error"
//         }`,
//       );
//     }

//     // -----------------------------------------------------
//     // 2. SYNC PHONE NUMBERS
//     // -----------------------------------------------------

//     try {
//       if (!ownedWabaInDb) {
//         throw new Error(
//           "No WABA account available in DB. Skipping phone number synchronization.",
//         );
//       }

//       const response = await this.WaClient.getPhoneNumbers();

//       const remotePhoneNumbers = response?.data ?? [];

//       if (remotePhoneNumbers.length === 0) {
//         console.log(`No phone numbers found in Meta WABA ${ownedWabaInDb.id}.`);
//       } else {
//         const wabaId = ownedWabaInDb.id;

//         console.log(
//           `Synchronizing ${remotePhoneNumbers.length} phone numbers for WABA ${wabaId}...`,
//         );

//         /**
//          * IMPORTANT:
//          *
//          * phone.id is Meta's phone_number_id.
//          *
//          * We intentionally use it as PhoneNumber.id.
//          *
//          * This means:
//          *
//          *   Meta phone.id === Prisma PhoneNumber.id
//          *
//          * This is what allows Message.phoneNumberId to reference
//          * Meta's phone_number_id directly.
//          */
//         const phoneNumberOperations = remotePhoneNumbers.map((phone) => {
//           if (!phone.id) {
//             throw new Error("Meta returned a phone number without an ID.");
//           }

//           if (!phone.display_phone_number) {
//             throw new Error(
//               `Meta phone number ${phone.id} has no display_phone_number.`,
//             );
//           }

//           return prisma.phoneNumber.upsert({
//             where: {
//               id: phone.id,
//             },

//             update: {
//               phoneNumber: phone.display_phone_number,

//               displayName: phone.verified_name ?? null,

//               status: PhoneNumberStatus.VERIFIED,

//               wabaId,
//             },

//             create: {
//               /**
//                * Meta phone_number_id becomes
//                * our local PhoneNumber primary key.
//                */
//               id: phone.id,

//               phoneNumber: phone.display_phone_number,

//               displayName: phone.verified_name ?? null,

//               status: PhoneNumberStatus.VERIFIED,

//               wabaId,
//             },
//           });
//         });

//         const existingPhoneNumbers = await prisma.phoneNumber.findMany({
//           where: {
//             id: {
//               in: remotePhoneNumbers.map((phone) => phone.id),
//             },
//           },
//           select: {
//             id: true,
//           },
//         });

//         const existingIds = new Set(
//           existingPhoneNumbers.map((phone) => phone.id),
//         );

//         await prisma.$transaction(phoneNumberOperations);

//         for (const phone of remotePhoneNumbers) {
//           if (existingIds.has(phone.id)) {
//             result.updated++;
//           } else {
//             result.created++;
//           }
//         }

//         console.log(
//           `Successfully synchronized ${remotePhoneNumbers.length} phone numbers for WABA ${wabaId}.`,
//         );
//       }
//     } catch (error) {
//       result.errors.push(
//         `Failed to sync phone numbers: ${
//           error instanceof Error ? error.message : "Unknown error"
//         }`,
//       );
//     }

//     // -----------------------------------------------------
//     // 3. SYNC TEMPLATES
//     // -----------------------------------------------------

//     try {
//       const localWabas = await wabaService.getAllWabaAccounts();

//       for (const waba of localWabas) {
//         try {
//           const remoteTemplates = await this.WaClient.getTemplates(waba.id);

//           if (!remoteTemplates || remoteTemplates.length === 0) {
//             continue;
//           }

//           for (const template of remoteTemplates) {
//             const status = template.status as TemplateApprovalStatus;

//             const category = template.category as TemplateCategory;

//             const language = template.language as TemplateLanguage;

//             const rejectedReason =
//               status === TemplateApprovalStatus.REJECTED
//                 ? "Rejected by Meta"
//                 : null;

//             const existing = await prisma.wabaTemplate.findUnique({
//               where: {
//                 id: template.id,
//               },
//               select: {
//                 id: true,
//               },
//             });

//             await prisma.wabaTemplate.upsert({
//               where: {
//                 id: template.id,
//               },

//               update: {
//                 name: template.name,

//                 wabaId: waba.id,

//                 status,

//                 category,

//                 language,

//                 components: template.components as Prisma.InputJsonValue,

//                 rejectedReason,
//               },

//               create: {
//                 id: template.id,

//                 name: template.name,

//                 wabaId: waba.id,

//                 status,

//                 category,

//                 language,

//                 components: template.components as Prisma.InputJsonValue,

//                 rejectedReason,
//               },
//             });

//             if (existing) {
//               result.updated++;
//             } else {
//               result.created++;
//             }
//           }

//           console.log(
//             `Successfully synchronized ${remoteTemplates.length} templates for WABA ${waba.id}.`,
//           );
//         } catch (error) {
//           result.errors.push(
//             `Failed to sync templates for WABA ${waba.id}: ${
//               error instanceof Error ? error.message : "Unknown error"
//             }`,
//           );
//         }
//       }
//     } catch (error) {
//       result.errors.push(
//         `Failed during template synchronization: ${
//           error instanceof Error ? error.message : "Unknown error"
//         }`,
//       );
//     }

//     console.log(
//       `Meta synchronization complete: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors.`,
//     );

//     return result;
//   }

//   // -------------------------------------------------------
//   // REFRESH TEMPLATE STATUS
//   // -------------------------------------------------------

//   /**
//    * Refresh the approval status of one local template
//    * directly from Meta.
//    */
//   async refreshTemplateStatus(templateId: string): Promise<WabaTemplate> {
//     const template = await prisma.wabaTemplate.findUnique({
//       where: {
//         id: templateId,
//       },
//     });

//     if (!template) {
//       throw new Error("Template not found in local database.");
//     }

//     const metaTemplate = await this.WaClient.getTemplateByName(template.name);

//     if (!metaTemplate) {
//       throw new Error(`Template "${template.name}" not found in Meta Cloud.`);
//     }

//     return prisma.wabaTemplate.update({
//       where: {
//         id: templateId,
//       },

//       data: {
//         status: metaTemplate.status as TemplateApprovalStatus,

//         rejectedReason:
//           metaTemplate.status === TemplateApprovalStatus.REJECTED
//             ? "Rejected by Meta"
//             : null,
//       },
//     });
//   }

//   // -------------------------------------------------------
//   // COMPARE LOCAL TEMPLATES WITH META
//   // -------------------------------------------------------

//   /**
//    * Compare local templates against templates currently
//    * available from Meta.
//    */
//   async compareWithMeta(): Promise<{
//     inSync: string[];
//     outOfSync: string[];
//     onlyInDatabase: string[];
//     onlyInMeta: string[];
//   }> {
//     const [localTemplates, metaTemplates] = await Promise.all([
//       prisma.wabaTemplate.findMany(),

//       this.WaClient.getTemplates(),
//     ]);

//     const localNames = new Set(localTemplates.map((template) => template.name));

//     const metaNames = new Set(metaTemplates.map((template) => template.name));

//     const onlyInDatabase = localTemplates
//       .filter((template) => !metaNames.has(template.name))
//       .map((template) => template.name);

//     const onlyInMeta = metaTemplates
//       .filter((template) => !localNames.has(template.name))
//       .map((template) => template.name);

//     const inSync: string[] = [];
//     const outOfSync: string[] = [];

//     for (const localTemplate of localTemplates) {
//       const metaTemplate = metaTemplates.find(
//         (template) => template.name === localTemplate.name,
//       );

//       if (!metaTemplate) {
//         continue;
//       }

//       if (localTemplate.status === metaTemplate.status) {
//         inSync.push(localTemplate.name);
//       } else {
//         outOfSync.push(localTemplate.name);
//       }
//     }

//     return {
//       inSync,
//       outOfSync,
//       onlyInDatabase,
//       onlyInMeta,
//     };
//   }
// }

import "server-only";

import prisma from "@/lib/prisma";
import {
  PhoneNumber,
  PhoneNumberStatus,
  Prisma,
  TemplateApprovalStatus,
  TemplateCategory,
  TemplateLanguage,
  UserRole,
  WabaOwnership,
  WabaTemplate,
} from "@/lib/prisma/generated";
import { WabaService } from "@/services/waba/waba.service";
import type { User } from "next-auth";
import type { WhatsAppClient } from "./client";

/**
 * Synchronizes WhatsApp / Meta Cloud resources with the local database.
 *
 * IMPORTANT ID MAPPING
 * --------------------
 *
 * Meta WABA ID
 *     ↓
 * WabaAccount.id
 *
 * Meta phone_number_id
 *     ↓
 * PhoneNumber.id
 *
 * Meta template ID
 *     ↓
 * WabaTemplate.id
 *
 * This gives us stable direct references between Meta and our database.
 */
export class MetaSyncService {
  constructor(private readonly WaClient: WhatsAppClient) {}

  // =========================================================
  // WABA
  // =========================================================

  /**
   * Synchronize the currently connected Meta WABA.
   *
   * Creates the WABA if it does not exist locally, otherwise
   * updates the existing record.
   */
  async syncWaba(user?: { id: string; role: UserRole }): Promise<{
    waba: Awaited<
      ReturnType<
        Awaited<ReturnType<typeof WabaService.create>>["getWabaAccountById"]
      >
    >;
    created: boolean;
    updated: boolean;
  }> {
    const remoteWaba = await this.WaClient.getWaba();

    const wabaService = await WabaService.create(user);

    let localWaba: Awaited<
      ReturnType<typeof wabaService.getWabaAccountById>
    > | null = null;

    try {
      localWaba = await wabaService.getWabaAccountById(remoteWaba.id);
    } catch {
      console.warn(
        `WABA ${remoteWaba.id} was not found locally. It will be created.`,
      );
    }

    // -------------------------------------------------------
    // CREATE
    // -------------------------------------------------------

    if (!localWaba) {
      let ownerId = user?.id;

      if (!ownerId) {
        const admin = await prisma.user.findFirst({
          where: {
            role: "ADMIN",
          },
          select: {
            id: true,
          },
        });

        ownerId = admin?.id;
      }

      if (!ownerId) {
        throw new Error("No user available to assign WABA ownership.");
      }

      const data: Prisma.WabaAccountUncheckedCreateInput = {
        /**
         * Meta WABA ID is our local WABA primary key.
         */
        id: remoteWaba.id,

        name: remoteWaba.name,

        userId: ownerId,

        ownership: WabaOwnership.OWNED,

        timezoneId: remoteWaba.timezone_id ?? null,

        messageTemplateNamespace: remoteWaba.message_template_namespace ?? null,
      };

      localWaba = await wabaService.createWabaAccount(data);

      console.log(`Created WABA: ${localWaba.id}`);

      return {
        waba: localWaba,
        created: true,
        updated: false,
      };
    }

    // -------------------------------------------------------
    // UPDATE
    // -------------------------------------------------------

    let ownerId = localWaba.userId ?? user?.id;

    if (!ownerId) {
      const admin = await prisma.user.findFirst({
        where: {
          role: "ADMIN",
        },
        select: {
          id: true,
        },
      });

      ownerId = admin?.id;
    }

    const data: Prisma.WabaAccountUpdateInput = {
      name: remoteWaba.name,

      ownership: WabaOwnership.OWNED,

      timezoneId: remoteWaba.timezone_id ?? null,

      messageTemplateNamespace: remoteWaba.message_template_namespace ?? null,

      ...(ownerId
        ? {
            user: {
              connect: {
                id: ownerId,
              },
            },
          }
        : {}),
    };

    localWaba = await wabaService.updateWabaAccount(localWaba.id, data);

    console.log(`Updated WABA: ${localWaba.id}`);

    return {
      waba: localWaba,
      created: false,
      updated: true,
    };
  }

  // =========================================================
  // PHONE NUMBERS
  // =========================================================

  /**
   * Synchronize all phone numbers from Meta.
   *
   * Meta's phone_number_id is intentionally used as the
   * local PhoneNumber.id.
   *
   * This method is independently reusable and does not require
   * syncFromMeta() to have been called first.
   */
  async syncPhoneNumbers(
    wabaId?: string,
    user?: { id: string; role: UserRole },
  ): Promise<{
    phoneNumbers: PhoneNumber[];
    created: number;
    updated: number;
  }> {
    /**
     * Make sure the WABA exists locally before creating
     * PhoneNumber records that reference it.
     *
     * If a WABA ID was explicitly supplied, use it.
     * Otherwise resolve the connected Meta WABA.
     */
    let resolvedWabaId = wabaId;

    if (!resolvedWabaId) {
      const wabaResult = await this.syncWaba(user);

      resolvedWabaId = wabaResult.waba.id;
    } else {
      /**
       * Verify that the WABA exists locally.
       *
       * This prevents a foreign-key failure when this method
       * is called independently.
       */
      const localWaba = await prisma.wabaAccount.findUnique({
        where: {
          id: resolvedWabaId,
        },
        select: {
          id: true,
        },
      });

      if (!localWaba) {
        /**
         * The supplied ID may be a valid Meta WABA ID that has
         * not yet been synchronized locally.
         *
         * syncWaba() resolves the currently connected Meta WABA.
         */
        const wabaResult = await this.syncWaba(user);

        if (wabaResult.waba.id !== resolvedWabaId) {
          throw new Error(
            `WABA ${resolvedWabaId} does not exist locally and is not the currently connected Meta WABA.`,
          );
        }

        resolvedWabaId = wabaResult.waba.id;
      }
    }

    // -------------------------------------------------------
    // Fetch Meta phone numbers
    // -------------------------------------------------------

    const response = await this.WaClient.getPhoneNumbers();

    const remotePhoneNumbers = response?.data ?? [];

    if (remotePhoneNumbers.length === 0) {
      console.log(`No phone numbers found in Meta WABA ${resolvedWabaId}.`);

      return {
        phoneNumbers: [],
        created: 0,
        updated: 0,
      };
    }

    // -------------------------------------------------------
    // Validate Meta response
    // -------------------------------------------------------

    for (const phone of remotePhoneNumbers) {
      if (!phone.id) {
        throw new Error("Meta returned a phone number without an ID.");
      }

      if (!phone.display_phone_number) {
        throw new Error(
          `Meta phone number ${phone.id} has no display_phone_number.`,
        );
      }
    }

    // -------------------------------------------------------
    // Determine existing records
    // -------------------------------------------------------

    const remoteIds = remotePhoneNumbers.map((phone) => phone.id);

    const existing = await prisma.phoneNumber.findMany({
      where: {
        id: {
          in: remoteIds,
        },
      },
      select: {
        id: true,
      },
    });

    const existingIds = new Set(existing.map((phone) => phone.id));

    // -------------------------------------------------------
    // Upsert
    // -------------------------------------------------------

    const operations = remotePhoneNumbers.map((phone) =>
      prisma.phoneNumber.upsert({
        where: {
          /**
           * Meta phone_number_id === local PhoneNumber.id
           */
          id: phone.id,
        },

        update: {
          phoneNumber: phone.display_phone_number,

          displayName: phone.verified_name ?? null,

          status: PhoneNumberStatus.VERIFIED,

          wabaId: resolvedWabaId!,
        },

        create: {
          /**
           * Meta phone_number_id becomes the local primary key.
           */
          id: phone.id,

          phoneNumber: phone.display_phone_number,

          displayName: phone.verified_name ?? null,

          status: PhoneNumberStatus.VERIFIED,

          wabaId: resolvedWabaId!,
        },
      }),
    );

    const phoneNumbers = await prisma.$transaction(operations);

    // -------------------------------------------------------
    // Counts
    // -------------------------------------------------------

    let created = 0;
    let updated = 0;

    for (const phone of remotePhoneNumbers) {
      if (existingIds.has(phone.id)) {
        updated++;
      } else {
        created++;
      }
    }

    console.log(
      `Phone synchronization complete: ${created} created, ${updated} updated.`,
    );

    return {
      phoneNumbers,
      created,
      updated,
    };
  }

  /**
   * Ensure one specific Meta phone_number_id exists locally.
   *
   * Fast path:
   *   Return existing local record.
   *
   * Slow path:
   *   Synchronize Meta phone numbers and return the requested one.
   */
  async ensurePhoneNumber(
    phoneNumberId: string,
    user?: { id: string; role: UserRole },
  ): Promise<PhoneNumber> {
    const id = phoneNumberId?.trim();

    if (!id) {
      throw new Error("WhatsApp phone number ID is required.");
    }

    // 1. Fast path: Check local DB
    const existing = await prisma.phoneNumber.findUnique({
      where: { id },
    });

    if (existing) {
      return existing;
    }

    console.log(
      `Phone number ${id} is not locally registered. Fetching directly from Meta...`,
    );

    // 2. Fetch user's WABA Account to get their access token if needed
    const wabaAccount = user?.id
      ? await prisma.wabaAccount.findFirst({ where: { userId: user.id } })
      : null;

    try {
      // 3. Query Meta directly for THIS specific phone number ID
      const phoneDetails = await this.WaClient.getPhoneNumberDetails(
        id,
        // wabaAccount?.accessToken,
      );

      if (!phoneDetails) {
        throw new Error(`WhatsApp phone number ${id} was not found in Meta.`);
      }

      // 4. Save/Upsert the phone number directly to Prisma
      const phoneNumber = await prisma.phoneNumber.upsert({
        where: { id },
        update: {
          displayName: phoneDetails.verified_name || null,
          status: PhoneNumberStatus.VERIFIED,
          verifiedAt: new Date(),
          wabaId: wabaAccount?.id,
        },
        create: {
          id: id, // Ensure this matches Meta's phone_number_id
          phoneNumber: phoneDetails.display_phone_number || id,
          displayName: phoneDetails.verified_name || null,
          status: PhoneNumberStatus.VERIFIED,
          verifiedAt: new Date(),
          wabaId: wabaAccount?.id,
        },
      });

      return phoneNumber;
    } catch (error: any) {
      console.error(`Failed to fetch phone number ${id} from Meta:`, error);
      throw new Error(
        `WhatsApp phone number ${id} was not found in Meta or access was denied.`,
      );
    }
  }

  /**
   * Ensure the configured system/default WhatsApp phone number
   * exists in the local database.
   *
   * Uses:
   *
   *   WHATSAPP_PHONE_NUMBER_ID
   */
  async ensureDefaultPhoneNumber(user?: User): Promise<PhoneNumber> {
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID?.trim();

    if (!phoneNumberId) {
      throw new Error(
        "[MISSING ENV] WHATSAPP_PHONE_NUMBER_ID is not configured.",
      );
    }

    return this.ensurePhoneNumber(phoneNumberId, user);
  }

  // =========================================================
  // TEMPLATES
  // =========================================================

  /**
   * Synchronize templates for all locally registered WABAs.
   *
   * The method signature is intentionally retained for
   * backwards compatibility.
   */
  async syncTemplates(
    wabaService: Awaited<ReturnType<typeof WabaService.create>>,
  ): Promise<{
    created: number;
    updated: number;
    errors: string[];
  }> {
    const result = {
      created: 0,
      updated: 0,
      errors: [] as string[],
    };

    const localWabas = await wabaService.getAllWabaAccounts();

    for (const waba of localWabas) {
      try {
        const remoteTemplates = await this.WaClient.getTemplates(waba.id);

        if (!remoteTemplates?.length) {
          continue;
        }

        /**
         * Determine existing templates in one query rather than
         * performing findUnique() for every template.
         */
        const templateIds = remoteTemplates.map((template) => template.id);

        const existingTemplates = await prisma.wabaTemplate.findMany({
          where: {
            id: {
              in: templateIds,
            },
          },
          select: {
            id: true,
          },
        });

        const existingIds = new Set(
          existingTemplates.map((template) => template.id),
        );

        const operations = remoteTemplates.map((template) => {
          const status = template.status as TemplateApprovalStatus;

          const category = template.category as TemplateCategory;

          const language = template.language as TemplateLanguage;

          const rejectedReason =
            status === TemplateApprovalStatus.REJECTED
              ? "Rejected by Meta"
              : null;

          return prisma.wabaTemplate.upsert({
            where: {
              /**
               * Meta template ID === local WabaTemplate.id
               */
              id: template.id,
            },

            update: {
              name: template.name,

              wabaId: waba.id,

              status,

              category,

              language,

              components: template.components as Prisma.InputJsonValue,

              rejectedReason,
            },

            create: {
              id: template.id,

              name: template.name,

              wabaId: waba.id,

              status,

              category,

              language,

              components: template.components as Prisma.InputJsonValue,

              rejectedReason,
            },
          });
        });

        await prisma.$transaction(operations);

        for (const template of remoteTemplates) {
          if (existingIds.has(template.id)) {
            result.updated++;
          } else {
            result.created++;
          }
        }

        console.log(
          `Synchronized ${remoteTemplates.length} templates for WABA ${waba.id}.`,
        );
      } catch (error) {
        result.errors.push(
          `Failed to sync templates for WABA ${waba.id}: ${
            error instanceof Error ? error.message : "Unknown error"
          }`,
        );
      }
    }

    return result;
  }

  // =========================================================
  // COMPLETE SYNC
  // =========================================================

  /**
   * Synchronize:
   *
   *   WABA
   *   ↓
   *   Phone Numbers
   *   ↓
   *   Templates
   *
   * from Meta into the local database.
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

    const wabaService = await WabaService.create(user);

    // -------------------------------------------------------
    // 1. WABA
    // -------------------------------------------------------

    try {
      const wabaResult = await this.syncWaba(user);

      if (wabaResult.created) {
        result.created++;
      }

      if (wabaResult.updated) {
        result.updated++;
      }
    } catch (error) {
      result.errors.push(
        `Failed to sync WABA: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    // -------------------------------------------------------
    // 2. PHONE NUMBERS
    // -------------------------------------------------------

    try {
      const phoneResult = await this.syncPhoneNumbers(undefined, user);

      result.created += phoneResult.created;
      result.updated += phoneResult.updated;
    } catch (error) {
      result.errors.push(
        `Failed to sync phone numbers: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    // -------------------------------------------------------
    // 3. TEMPLATES
    // -------------------------------------------------------

    try {
      const templateResult = await this.syncTemplates(wabaService);

      result.created += templateResult.created;
      result.updated += templateResult.updated;
      result.errors.push(...templateResult.errors);
    } catch (error) {
      result.errors.push(
        `Failed to sync templates: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }

    console.log(
      `Meta synchronization complete: ${result.created} created, ${result.updated} updated, ${result.errors.length} errors.`,
    );

    return result;
  }

  // =========================================================
  // TEMPLATE STATUS
  // =========================================================

  /**
   * Refresh one template's approval status from Meta.
   */
  async refreshTemplateStatus(templateId: string): Promise<WabaTemplate> {
    const template = await prisma.wabaTemplate.findUnique({
      where: {
        id: templateId,
      },
    });

    if (!template) {
      throw new Error("Template not found in local database.");
    }

    const metaTemplate = await this.WaClient.getTemplateByName(template.name);

    if (!metaTemplate) {
      throw new Error(`Template "${template.name}" not found in Meta Cloud.`);
    }

    return prisma.wabaTemplate.update({
      where: {
        id: templateId,
      },

      data: {
        status: metaTemplate.status as TemplateApprovalStatus,

        rejectedReason:
          metaTemplate.status === TemplateApprovalStatus.REJECTED
            ? "Rejected by Meta"
            : null,
      },
    });
  }

  // =========================================================
  // TEMPLATE COMPARISON
  // =========================================================

  /**
   * Compare local templates against Meta templates.
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

    const localNames = new Set(localTemplates.map((template) => template.name));

    const metaNames = new Set(metaTemplates.map((template) => template.name));

    const onlyInDatabase = localTemplates
      .filter((template) => !metaNames.has(template.name))
      .map((template) => template.name);

    const onlyInMeta = metaTemplates
      .filter((template) => !localNames.has(template.name))
      .map((template) => template.name);

    const inSync: string[] = [];
    const outOfSync: string[] = [];

    for (const localTemplate of localTemplates) {
      const metaTemplate = metaTemplates.find(
        (template) => template.name === localTemplate.name,
      );

      if (!metaTemplate) {
        continue;
      }

      if (localTemplate.status === metaTemplate.status) {
        inSync.push(localTemplate.name);
      } else {
        outOfSync.push(localTemplate.name);
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
