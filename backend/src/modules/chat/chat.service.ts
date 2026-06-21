import { prisma } from "../../lib/prisma";
import { AppError } from "../../utils/app-error";

export async function findChatsByUserId(userId: string) {
  const memberships = await prisma.chatMember.findMany({
    where: {
      userId,
    },
    include: {
      chat: {
        include: {
          members: {
            include: {
              user: true,
            },
          },
          lastMessage: {
            include: {
              user: true,
            },
          },
        },
      },
    },
  });

  return memberships.map((m) => m.chat);
}

export async function findChatById(chatId: string) {
  const chat = await prisma.chat.findUnique({
    where: { id: chatId },
    include: {
      members: {
        include: {
          user: true,
        },
      },
      lastMessage: true,
    },
  });

  if (!chat) {
    throw new AppError(404, "chat not found");
  }

  return chat;
}

interface CreateChatInput {
  currentUserId: string;
  name?: string;
  participantIds: string[];
}

export async function createNewChat(data: CreateChatInput) {
  const { currentUserId, name, participantIds } = data;

  const otherParticipantIds = participantIds.filter(
    (id) => id !== currentUserId,
  );
  const allMemberIds = [currentUserId, ...otherParticipantIds];

  return await prisma.$transaction(async (tx) => {
    const newChat = await tx.chat.create({
      data: {
        name: name || null,
      },
    });

    const memberData = allMemberIds.map((userId) => ({
      chatId: newChat.id,
      userId,
      role:
        userId === currentUserId
          ? ("SUPERADMIN" as const)
          : ("MEMBER" as const),
    }));

    await tx.chatMember.createMany({
      data: memberData,
    });

    return await tx.chat.findUnique({
      where: { id: newChat.id },
      include: { members: true },
    });
  });
}

interface UpdateChatInput {
  chatId: string;
  name: string;
}

export async function updateChatById(data: UpdateChatInput) {
  return await prisma.chat.update({
    where: { id: data.chatId },
    data: { name: data.name },
  });
}

export async function deleteChatById(chatId: string) {
  await prisma.chat.delete({
    where: { id: chatId },
  });
}
