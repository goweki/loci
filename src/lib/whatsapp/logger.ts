// lib/whatsapp/logger.ts

interface LogOptions {
  maskSecrets?: boolean;
}

const mask = (value: string) =>
  value ? value.slice(0, 4) + "****" + value.slice(-2) : value;

export class WhatsAppLogger {
  constructor(private opts: LogOptions = { maskSecrets: true }) {}

  private baseLog(level: string, message: string, meta?: any) {
    console.log(
      JSON.stringify({
        level,
        time: new Date().toISOString(),
        message,
        meta,
      })
    );
  }

  info(message: string, meta?: any) {
    this.baseLog("info", message, meta);
  }

  warn(message: string, meta?: any) {
    this.baseLog("warn", message, meta);
  }

  error(message: string, meta?: any) {
    this.baseLog("error", message, meta);
  }

  maskIfNeeded(obj: any) {
    if (!this.opts.maskSecrets) return obj;

    const cloned = JSON.parse(JSON.stringify(obj));
    if (cloned?.Authorization)
      cloned.Authorization = mask(cloned.Authorization);
    return cloned;
  }
}
