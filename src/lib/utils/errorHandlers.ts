import "server-only";

import { Prisma } from "../prisma/generated";

interface ErrorHandlerOptions {
  isDev?: boolean;
  logErrors?: boolean;
}

export function getFriendlyErrorMessage(
  error: unknown,
  options: ErrorHandlerOptions = {},
): string {
  const { isDev = false, logErrors = true } = options;

  // Log the original error for debugging (in development or if explicitly enabled)
  if (logErrors && (isDev || process.env.NODE_ENV === "development")) {
    console.error("ERROR:", error);
  }

  // Handle Prisma "known" errors
  if (
    !!Prisma.PrismaClientKnownRequestError &&
    error instanceof Prisma.PrismaClientKnownRequestError
  ) {
    switch (error.code) {
      // ===== UNIQUE CONSTRAINT VIOLATIONS =====
      case "P2002":
        if (error.meta?.target) {
          const fields = Array.isArray(error.meta.target)
            ? error.meta.target
            : [error.meta.target];
          const fieldNames = fields.join(", ");
          return `A record with the same ${fieldNames} already exists.`;
        }
        return "This record already exists.";

      // ===== FOREIGN KEY CONSTRAINT VIOLATIONS =====
      case "P2003":
        if (error.meta?.field_name) {
          return `Cannot delete this record because it's linked to other data via ${error.meta.field_name}.`;
        }
        return "This item cannot be removed because it is still linked to other records.";

      case "P2004":
        return "A constraint failed on the database.";

      // ===== RECORD NOT FOUND =====
      case "P2025":
        if (error.meta?.cause) {
          return `The requested record could not be found: ${error.meta.cause}`;
        }
        return "The requested record could not be found.";

      case "P2001":
        return "The record searched for in the where condition does not exist.";

      // ===== DATA VALIDATION ERRORS =====
      case "P2000":
        if (error.meta?.column_name) {
          return `The value provided for ${error.meta.column_name} is too long.`;
        }
        return "One of the provided values is too long.";

      case "P2005":
        if (error.meta?.field_name && error.meta?.field_value) {
          return `Invalid value '${error.meta.field_value}' provided for field '${error.meta.field_name}'.`;
        }
        return "One of the provided values is invalid for the database.";

      case "P2006":
        if (error.meta?.field_name) {
          return `The value provided for ${error.meta.field_name} is not valid.`;
        }
        return "The provided value is not valid for this field.";

      case "P2007":
        return "Data validation error on the database.";

      // ===== MISSING REQUIRED DATA =====
      case "P2011":
        if (error.meta?.constraint) {
          return `Required field '${error.meta.constraint}' is missing a value.`;
        }
        return "A required field is missing a value.";

      case "P2012":
        if (error.meta?.path) {
          return `Required value for '${error.meta.path}' was not provided.`;
        }
        return "A required value was not provided.";

      case "P2013":
        if (error.meta?.field_name) {
          return `Required field '${error.meta.field_name}' is missing from the query.`;
        }
        return "A required field is missing from the query.";

      case "P2014":
        if (error.meta?.relation_name) {
          return `The operation failed because the required relation '${error.meta.relation_name}' is missing.`;
        }
        return "The operation failed because a required related record is missing.";

      // ===== TRANSACTION ERRORS =====
      case "P2028":
        return "Transaction API error. Please try again.";

      case "P2034":
        return "Transaction failed due to a write conflict. Please try again.";

      // ===== CONNECTION AND TIMEOUT ERRORS =====
      case "P1001":
        return "Unable to connect to the database server. Please try again later.";

      case "P1002":
        return "The database server was reached but timed out.";

      case "P1008":
        return "The database operation timed out. Please try again.";

      case "P1010":
        return "Access denied for user. Please check your credentials.";

      case "P1011":
        return "Error opening a TLS connection to the database.";

      case "P1017":
        return "Server has closed the connection.";

      // ===== MIGRATION ERRORS =====
      case "P3006":
        return "Migration failed to apply cleanly to the shadow database.";

      // ===== QUERY ENGINE ERRORS =====
      case "P2009":
        return "Query validation failed at the database level.";

      case "P2010":
        return "Raw query failed to execute.";

      case "P2015":
        return "A related record could not be found.";

      case "P2016":
        return "Query interpretation error.";

      case "P2017":
        return "The records for relation are not connected.";

      case "P2018":
        return "The required connected records were not found.";

      case "P2019":
        return "Input error in the query.";

      case "P2020":
        return "Value out of range for the field type.";

      case "P2021":
        return "The table does not exist in the current database.";

      case "P2022":
        return "The column does not exist in the current database.";

      default:
        if (isDev) {
          return `Database error (${error.code}): ${error.message}`;
        }
        return "Something went wrong while processing your request. Please try again.";
    }
  }

  // Prisma validation errors (bad query structure or input shape)
  if (
    !!Prisma.PrismaClientValidationError &&
    error instanceof Prisma.PrismaClientValidationError
  ) {
    if (isDev) {
      return `Validation error: ${error.message}`;
    }
    return "Some of the provided data is invalid. Please check your input and try again.";
  }

  // Database connection/initialization errors
  if (
    !!Prisma.PrismaClientInitializationError &&
    error instanceof Prisma.PrismaClientInitializationError
  ) {
    if (isDev) {
      return `Database initialization error: ${error.message}`;
    }
    return "The database service is currently unavailable. Please try again later.";
  }

  // Prisma engine panic (very rare, usually indicates a bug)
  if (
    !!Prisma.PrismaClientRustPanicError &&
    error instanceof Prisma.PrismaClientRustPanicError
  ) {
    if (isDev) {
      return `Engine panic: ${error.message}`;
    }
    return "A critical server error occurred. Please contact support if this persists.";
  }

  // Generic JavaScript/TypeScript errors
  if (error instanceof Error) {
    if (isDev) {
      return `${error.message}`;
    }
    // In production, be more careful about exposing error details
    return error.message.includes("ECONNREFUSED") ||
      error.message.includes("ETIMEDOUT")
      ? "Database connection failed. Please try again later."
      : `${error.message}`;
  }

  // Handle string errors or other unknown error types
  if (typeof error === "string") {
    return isDev ? `ERROR [string]: ${error}` : error;
  }

  // Last resort fallback
  return isDev
    ? `Unknown error type: ${JSON.stringify(error)}`
    : "An unexpected error occurred. Please try again later.";
}

// Helper function for common usage patterns
export function handlePrismaError(error: unknown): never {
  const message = getFriendlyErrorMessage(error);
  throw new Error(message);
}

// Type guard helper
export function isPrismaError(
  error: unknown,
): error is Prisma.PrismaClientKnownRequestError {
  return error instanceof Prisma.PrismaClientKnownRequestError;
}

// Extract error code helper
export function getPrismaErrorCode(error: unknown): string | null {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return error.code;
  }
  return null;
}
