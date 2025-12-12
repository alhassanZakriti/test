/*
  Warnings:

  - A unique constraint covering the columns `[currentSubscriptionId]` on the table `User` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "receiptData" TEXT,
ADD COLUMN     "receiptUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "currentSubscriptionId" TEXT;

-- CreateIndex
CREATE INDEX "Payment_verified_idx" ON "Payment"("verified");

-- CreateIndex
CREATE UNIQUE INDEX "User_currentSubscriptionId_key" ON "User"("currentSubscriptionId");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_currentSubscriptionId_fkey" FOREIGN KEY ("currentSubscriptionId") REFERENCES "Subscription"("id") ON DELETE SET NULL ON UPDATE CASCADE;
