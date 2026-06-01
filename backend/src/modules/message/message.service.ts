import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function findMessagesByChatId(chatId: string) {
  return await prisma.message.findMany({
    where: {
      chatId,
    },
    include: {
      user: {
        select: {
          id: true,
          clerkId: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
    },
    orderBy: {
      createdAt: "asc",
    },
  });
}

interface CreateChatMessageInput {
  chatId: string;
  userId: string;
  content?: string | null;
  mediaUrl: string | null;
}

export async function createChatMessage(data: CreateChatMessageInput) {
  return await prisma.message.create({
    data: { ...data },
    include: {
      user: {
        select: {
          id: true,
          clerkId: true,
          firstName: true,
          lastName: true,
          imageUrl: true,
        },
      },
    },
  });
}

export async function requireUserMessage(userId: string, messageId: string) {
  const message = await prisma.message.findFirst({
    where: {
      id: messageId,
      userId,
    },
  });

  if (!message) throw new AppError(404, "message does not exist");

  return message;
}

interface UpdateMessageInput {
  messageId: string;
  content?: string;
}

export async function updateMessageById(data: UpdateMessageInput) {
  return await prisma.message.update({
    where: {
      id: data.messageId,
    },
    data: {
      content: data.content,
    },
  });
}

export async function deleteMessageById(messageId: string) {
  return await prisma.message.delete({
    where: {
      id: messageId,
    },
  });
}

export async function deleteMessagesByChatId(chatId: string) {
  return await prisma.message.deleteMany({
    where: {
      chatId,
    },
  });
}
