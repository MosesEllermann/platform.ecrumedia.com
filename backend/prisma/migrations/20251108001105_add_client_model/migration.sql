-- CreateEnum
CREATE TYPE "ClientType" AS ENUM ('COMPANY', 'PRIVATE');

-- AlterTable
ALTER TABLE "invoices" ADD COLUMN     "clientId" TEXT;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "country" SET DEFAULT 'Österreich';

-- CreateTable
CREATE TABLE "clients" (
    "id" TEXT NOT NULL,
    "clientNumber" INTEGER NOT NULL,
    "type" "ClientType" NOT NULL DEFAULT 'COMPANY',
    "name" TEXT NOT NULL,
    "vatNumber" TEXT,
    "address" TEXT,
    "countryCode" TEXT NOT NULL DEFAULT 'AT',
    "phone" TEXT,
    "email" TEXT,
    "homepage" TEXT,
    "fixedNote" TEXT,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "clients_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "clients_clientNumber_key" ON "clients"("clientNumber");

-- CreateIndex
CREATE UNIQUE INDEX "clients_userId_key" ON "clients"("userId");

-- AddForeignKey
ALTER TABLE "clients" ADD CONSTRAINT "clients_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "clients"("id") ON DELETE SET NULL ON UPDATE CASCADE;
