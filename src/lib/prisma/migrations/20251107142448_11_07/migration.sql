/*
  Warnings:

  - A unique constraint covering the columns `[tel]` on the table `users` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "users" ADD COLUMN     "tel" TEXT,
ADD COLUMN     "telVerified" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "users_tel_key" ON "users"("tel");
