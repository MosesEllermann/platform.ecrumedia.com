-- AlterTable
ALTER TABLE "invoice_items" ADD COLUMN     "productName" TEXT,
ADD COLUMN     "taxRate" DECIMAL(5,2),
ADD COLUMN     "unitName" TEXT;
