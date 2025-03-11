/*
  Warnings:

  - You are about to drop the `ConversationUser` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "ConversationUser" DROP CONSTRAINT "ConversationUser_conversationId_fkey";

-- AlterTable
ALTER TABLE "Conversation" ADD COLUMN     "participants" TEXT[];

-- DropTable
DROP TABLE "ConversationUser";
