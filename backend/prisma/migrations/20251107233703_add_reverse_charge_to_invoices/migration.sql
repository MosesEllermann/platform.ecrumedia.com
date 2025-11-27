-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "isReverseCharge" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "reverseChargeNote" TEXT,
ALTER COLUMN "taxRate" SET DEFAULT 20;
