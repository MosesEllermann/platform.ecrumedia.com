-- AlterTable
ALTER TABLE `invoice_items` ADD COLUMN `discount` DECIMAL(5, 2) NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `invoices` ADD COLUMN `globalDiscount` DECIMAL(5, 2) NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `quote_items` ADD COLUMN `discount` DECIMAL(5, 2) NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `quotes` ADD COLUMN `globalDiscount` DECIMAL(5, 2) NULL DEFAULT 0;
