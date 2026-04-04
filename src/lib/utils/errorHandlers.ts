import "server-only";

const IS_DEV = process.env.NODE_ENV === "development";

/**
 * We use 'any' here because Prisma's exported types can sometimes
 * mismatch with the actual error object at runtime in Next.js.
 */
export function getFriendlyErrorMessage(error: any): string {
  // 1. EXTRACT DATA BY PROPERTY (Most Reliable)
  const code = error?.code; // e.g., 'P2002'
  const message = error?.message || "";
  const meta = error?.meta || {};

  // 2. LOG FOR DEVELOPER
  if (IS_DEV) {
    console.error("--- DB ERROR DEBUG ---");
    console.error(`Code: ${code}`);
    console.error(`Message:`, message);
    console.error("----------------------");
  }

  // 3. HANDLE UNIQUE CONSTRAINT (P2002)
  if (code === "P2002") {
    const target = meta?.target || "";
    const fieldString = Array.isArray(target) ? target.join(", ") : target;

    if (fieldString.includes("email")) {
      return "This email is already in use.";
    }
    if (fieldString.includes("username")) {
      return "That username is taken.";
    }
    return "This record already exists.";
  }

  // 4. HANDLE RECORD NOT FOUND (P2025)
  if (code === "P2025") {
    return "The requested item could not be found.";
  }

  // 5. HANDLE FOREIGN KEY FAILURES (P2003)
  if (code === "P2003") {
    return "This action cannot be completed because this record is linked to other data.";
  }

  // 6. HANDLE CONNECTION ISSUES
  if (code?.startsWith("P10")) {
    return "Database connection error. Please try again later.";
  }

  // 7. FALLBACK FOR UNKNOWN ERRORS
  // If it's a Prisma error but we didn't catch the code,
  // we strip the "Invalid invocation" header manually.
  if (message.includes("invocation:")) {
    // If we're in dev, show the cleaned up technical error
    if (IS_DEV) {
      const parts = message.split("invocation:");
      return parts[1] ? parts[1].trim() : "Database validation failed.";
    }
    // In production, keep it strictly generic
    return "An unexpected database error occurred.";
  }

  // 8. FINAL GLOBAL FALLBACK
  return IS_DEV ? message : "Something went wrong. Please try again.";
}
