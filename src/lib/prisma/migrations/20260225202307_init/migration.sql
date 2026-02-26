/*
  Warnings:

  - A unique constraint covering the columns `[name,wabaId]` on the table `waba_templates` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "waba_templates_name_wabaId_key" ON "waba_templates"("name", "wabaId");
