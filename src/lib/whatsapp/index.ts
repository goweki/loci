// lib/whatsapp/index.ts

import { WhatsAppClient } from "./services/client";
import { MetaSyncService } from "./services/template-sync.service";
import { env_ } from "./types/environment-variables";

const whatsapp = new WhatsAppClient(env_);
const metaSyncService = new MetaSyncService(whatsapp);

export { metaSyncService };
export default whatsapp;
