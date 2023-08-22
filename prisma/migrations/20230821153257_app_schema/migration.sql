-- CreateEnum
CREATE TYPE "SplitType" AS ENUM ('EQUAL', 'EXACT');

-- CreateTable
CREATE TABLE "tbl__user" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,

    CONSTRAINT "tbl__user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl__group" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "tbl__group_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl__group_user" (
    "userId" INTEGER NOT NULL,
    "groupId" INTEGER NOT NULL,

    CONSTRAINT "tbl__group_user_pkey" PRIMARY KEY ("userId","groupId")
);

-- CreateTable
CREATE TABLE "tbl__transaction" (
    "id" SERIAL NOT NULL,
    "description" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "groupId" INTEGER NOT NULL,
    "payerId" INTEGER NOT NULL,
    "total" INTEGER NOT NULL,
    "splitType" "SplitType" NOT NULL,

    CONSTRAINT "tbl__transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tbl__transaction_payee" (
    "id" SERIAL NOT NULL,
    "payeeId" INTEGER NOT NULL,
    "amount" INTEGER NOT NULL,
    "transactionId" INTEGER NOT NULL,

    CONSTRAINT "tbl__transaction_payee_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "tbl__user_email_key" ON "tbl__user"("email");

-- AddForeignKey
ALTER TABLE "tbl__group_user" ADD CONSTRAINT "tbl__group_user_userId_fkey" FOREIGN KEY ("userId") REFERENCES "tbl__user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl__group_user" ADD CONSTRAINT "tbl__group_user_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "tbl__group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl__transaction" ADD CONSTRAINT "tbl__transaction_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "tbl__group"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl__transaction" ADD CONSTRAINT "tbl__transaction_payerId_fkey" FOREIGN KEY ("payerId") REFERENCES "tbl__user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl__transaction_payee" ADD CONSTRAINT "tbl__transaction_payee_payeeId_fkey" FOREIGN KEY ("payeeId") REFERENCES "tbl__user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tbl__transaction_payee" ADD CONSTRAINT "tbl__transaction_payee_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "tbl__transaction"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
