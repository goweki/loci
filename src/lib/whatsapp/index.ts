// lib/whatsapp/index.ts

import { WhatsAppClient } from "./client";
import { WhatsAppQrService } from "./services/waba-qr.service";
import { env_ } from "./types/environment-variables";

const whatsapp = new WhatsAppClient(env_);

export default whatsapp;
