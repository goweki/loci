import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

export type AppError = {
  message: string;
  code: string;
  status: number;
  details?: any;
};

/**
 * Generic error handler for Prisma, Zod, and runtime errors.
 * Returns a structured, uniform error response.
 */
export default function processError(error: unknown): AppError {
  console.error("handling error: ", error);
  if (!error) {
    return {
      message: `Unknown error`,
      code: "UNKNOWN_ERROR",
      status: 500,
    };
  }
  // Handle Prisma client known errors
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    switch (error.code) {
      case "P2002": {
        // Unique constraint violation
        const target = (error.meta?.target as string[])?.join(", ");
        return {
          message: `${target} already exists`,
          code: "DUPLICATE_FIELD",
          status: 409,
          details: { fields: error.meta?.target },
        };
      }

      case "P2003":
        return {
          message: "Foreign key constraint failed.",
          code: "FOREIGN_KEY_FAILED",
          status: 400,
        };

      case "P2025":
        return {
          message: "Record not found.",
          code: "RECORD_NOT_FOUND",
          status: 404,
        };

      default:
        return {
          message: error.message,
          code: "PRISMA_ERROR",
          status: 500,
        };
    }
  }

  // Handle Prisma validation errors
  if (error instanceof Prisma.PrismaClientValidationError) {
    return {
      message: "Invalid data sent to database.",
      code: "PRISMA_VALIDATION_ERROR",
      status: 400,
    };
  }

  // Handle Zod validation errors
  if (error instanceof ZodError) {
    return {
      message: "Validation failed.",
      code: "VALIDATION_ERROR",
      status: 422,
      details: error.flatten(),
    };
  }

  // Generic runtime error (custom Error, etc.)
  if (error instanceof Error) {
    return {
      message: error.message || "An unexpected error occurred.",
      code: "GENERAL_ERROR",
      status: 500,
    };
  }

  // Fallback for non-Error types
  return {
    message: "Unknown error.",
    code: "UNKNOWN_ERROR",
    status: 500,
  };
}
