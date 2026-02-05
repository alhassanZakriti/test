/*
  Warnings:

  - You are about to drop the column `paymentDeadline` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "paymentDeadline",
ADD COLUMN     "websiteType" TEXT NOT NULL DEFAULT 'basic',
ALTER COLUMN "status" SET DEFAULT 'NEW';
