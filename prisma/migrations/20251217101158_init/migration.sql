-- CreateEnum
CREATE TYPE "OrderStatus" AS ENUM ('pending', 'routing', 'building', 'submitted', 'confirmed', 'failed');

-- CreateEnum
CREATE TYPE "OrderType" AS ENUM ('market');

-- CreateTable
CREATE TABLE "Order" (
    "id" TEXT NOT NULL,
    "orderType" "OrderType" NOT NULL DEFAULT 'market',
    "status" "OrderStatus" NOT NULL DEFAULT 'pending',
    "tokenIn" TEXT NOT NULL,
    "tokenOut" TEXT NOT NULL,
    "amountIn" DECIMAL(65,30) NOT NULL,
    "slippageBps" INTEGER NOT NULL DEFAULT 50,
    "chosenDex" TEXT,
    "quotes" JSONB,
    "executedPrice" DECIMAL(65,30),
    "txHash" TEXT,
    "errorReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Order_status_idx" ON "Order"("status");

-- CreateIndex
CREATE INDEX "Order_createdAt_idx" ON "Order"("createdAt");
