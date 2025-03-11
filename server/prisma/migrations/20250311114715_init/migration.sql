-- DropIndex
DROP INDEX "Message_senderId_idx";

-- AlterTable
ALTER TABLE "Message" ADD COLUMN     "SenderName" TEXT,
ADD COLUMN     "senderAvatar" TEXT,
ADD COLUMN     "senderUsername" TEXT;
