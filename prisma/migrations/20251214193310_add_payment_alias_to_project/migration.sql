/*
  Warnings:

  - You are about to drop the column `paymentAlias` on the `User` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[paymentAlias]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "User_paymentAlias_key";

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "paymentAlias" TEXT;

-- AlterTable
ALTER TABLE "User" DROP COLUMN "paymentAlias";

-- CreateIndex
CREATE UNIQUE INDEX "Project_paymentAlias_key" ON "Project"("paymentAlias");
