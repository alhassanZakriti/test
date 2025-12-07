/*
  Warnings:

  - A unique constraint covering the columns `[paymentAlias]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "User" ADD COLUMN     "paymentAlias" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_paymentAlias_key" ON "User"("paymentAlias");
