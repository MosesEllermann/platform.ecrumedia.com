/*
  Warnings:

  - You are about to alter the column `quantity` on the `invoice_items` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,3)`.
  - You are about to alter the column `quantity` on the `quote_items` table. The data in that column could be lost. The data in that column will be cast from `Int` to `Decimal(10,3)`.

*/
-- AlterTable
ALTER TABLE `invoice_items` MODIFY `quantity` DECIMAL(10, 3) NOT NULL DEFAULT 1;

-- AlterTable
ALTER TABLE `quote_items` MODIFY `quantity` DECIMAL(10, 3) NOT NULL DEFAULT 1;
