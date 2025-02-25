import { Prisma } from "@prisma/client";
import { prismaErrorMessages } from "@/lib/configs";

export function getPrismaErrorMessage(error: unknown): string {
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    return (
      prismaErrorMessages[error.code] ||
      "An unexpected database error occurred."
    );
  }
  return "An unknown error occurred.";
}
