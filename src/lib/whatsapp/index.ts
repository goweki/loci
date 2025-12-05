// lib/whatsapp/index.ts

import { WhatsAppClient } from "./services/client";
import { env_ } from "./types/environment-variables";

const whatsapp = new WhatsAppClient(env_);

export default whatsapp;
