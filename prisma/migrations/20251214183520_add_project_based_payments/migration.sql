-- AlterTable
ALTER TABLE "Payment" ADD COLUMN     "projectId" TEXT,
ALTER COLUMN "subscriptionId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "paymentRequired" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "paymentStatus" TEXT NOT NULL DEFAULT 'Not Required',
ADD COLUMN     "previewUrl" TEXT,
ADD COLUMN     "price" INTEGER NOT NULL DEFAULT 150;

-- CreateIndex
CREATE INDEX "Payment_projectId_idx" ON "Payment"("projectId");

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE;
