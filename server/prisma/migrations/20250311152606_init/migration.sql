/*
  Warnings:

  - You are about to drop the column `SenderName` on the `Message` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Message" DROP COLUMN "SenderName",
ADD COLUMN     "senderName" TEXT;
