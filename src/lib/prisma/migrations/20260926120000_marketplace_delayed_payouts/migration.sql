-- CreateEnum
CREATE TYPE "FulfillmentStatus" AS ENUM ('UNFULFILLED', 'PROCESSING', 'SHIPPED', 'DELIVERED', 'DISPUTED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PayoutStatus" AS ENUM ('NOT_DUE', 'QUEUED', 'PENDING', 'PAID', 'FAILED', 'REVERSED', 'ON_HOLD');

-- CreateEnum
CREATE TYPE "LedgerTransactionType" AS ENUM ('PAYMENT_RECEIVED', 'PAYOUT_SENT', 'REFUND_ISSUED', 'PAYOUT_REVERSED');

-- CreateEnum
CREATE TYPE "LedgerAccount" AS ENUM ('PAYMENT_CLEARING', 'SELLER_PAYABLE', 'PLATFORM_REVENUE', 'REFUND_CLEARING');

-- CreateEnum
CREATE TYPE "LedgerSide" AS ENUM ('DEBIT', 'CREDIT');

-- AlterTable
ALTER TABLE "orders" ADD COLUMN     "buyerEmail" TEXT,
ADD COLUMN     "buyerName" TEXT,
ADD COLUMN     "buyerPhone" TEXT,
ADD COLUMN     "deliveryConfirmedAt" TIMESTAMP(3),
ADD COLUMN     "deliveryTokenExpiresAt" TIMESTAMP(3),
ADD COLUMN     "deliveryTokenHash" TEXT,
ADD COLUMN     "disputeOpenedAt" TIMESTAMP(3),
ADD COLUMN     "disputeReason" TEXT,
ADD COLUMN     "fulfillmentStatus" "FulfillmentStatus" NOT NULL DEFAULT 'UNFULFILLED',
ADD COLUMN     "payoutStatus" "PayoutStatus" NOT NULL DEFAULT 'NOT_DUE',
ADD COLUMN     "platformFee" DECIMAL(10,2) NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "payments" ADD COLUMN     "metadata" JSONB;

-- AlterTable
ALTER TABLE "users" ADD COLUMN     "paystackRecipientCode" TEXT,
ADD COLUMN     "paystackRecipientCurrency" "Currency";

-- AlterTable
ALTER TABLE "webhook_events" ADD COLUMN     "error" TEXT,
ADD COLUMN     "eventKey" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "order_payouts" (
    "id" TEXT NOT NULL,
    "orderId" TEXT NOT NULL,
    "merchantId" TEXT NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "recipientCode" TEXT NOT NULL,
    "reference" TEXT NOT NULL,
    "transferCode" TEXT,
    "status" "PayoutStatus" NOT NULL DEFAULT 'NOT_DUE',
    "requestedAt" TIMESTAMP(3),
    "paidAt" TIMESTAMP(3),
    "lastError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "order_payouts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_transactions" (
    "id" TEXT NOT NULL,
    "eventKey" TEXT NOT NULL,
    "type" "LedgerTransactionType" NOT NULL,
    "orderId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ledger_entries" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "account" "LedgerAccount" NOT NULL,
    "side" "LedgerSide" NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ledger_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "order_payouts_orderId_key" ON "order_payouts"("orderId");

-- CreateIndex
CREATE UNIQUE INDEX "order_payouts_reference_key" ON "order_payouts"("reference");

-- CreateIndex
CREATE INDEX "order_payouts_status_createdAt_idx" ON "order_payouts"("status", "createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "ledger_transactions_eventKey_key" ON "ledger_transactions"("eventKey");

-- CreateIndex
CREATE INDEX "ledger_transactions_orderId_createdAt_idx" ON "ledger_transactions"("orderId", "createdAt");

-- CreateIndex
CREATE INDEX "ledger_entries_transactionId_idx" ON "ledger_entries"("transactionId");

-- CreateIndex
CREATE UNIQUE INDEX "orders_deliveryTokenHash_key" ON "orders"("deliveryTokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "webhook_events_eventKey_key" ON "webhook_events"("eventKey");

-- AddForeignKey
ALTER TABLE "order_payouts" ADD CONSTRAINT "order_payouts_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "order_payouts" ADD CONSTRAINT "order_payouts_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_transactions" ADD CONSTRAINT "ledger_transactions_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "orders"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ledger_entries" ADD CONSTRAINT "ledger_entries_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "ledger_transactions"("id") ON DELETE CASCADE ON UPDATE CASCADE;
