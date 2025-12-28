"use server";

import { WabaTemplateRepository } from "@/data/repositories/waba-template";

export async function createWabaTemplateAction(
  data: Parameters<typeof WabaTemplateRepository.create>[0]
) {
  return WabaTemplateRepository.create(data);
}

export async function findWabaTemplateByIdAction(id: string) {
  return WabaTemplateRepository.findById(id);
}

export async function findWabaTemplatesAction(
  filters?: Parameters<typeof WabaTemplateRepository.findMany>[0]
) {
  return WabaTemplateRepository.findMany(filters);
}

export async function updateWabaTemplateAction(
  id: string,
  data: Parameters<typeof WabaTemplateRepository.update>[1]
) {
  return WabaTemplateRepository.update(id, data);
}

export async function deleteWabaTemplateAction(id: string) {
  return WabaTemplateRepository.delete(id);
}

export async function getWabaTemplateStatsAction(userId: string) {
  return WabaTemplateRepository.getStatsByUserId(userId);
}
