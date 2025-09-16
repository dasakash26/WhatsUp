import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import expressAsyncHandler from "express-async-handler";
import { clerkClient } from "@clerk/express";
import { Cache } from "../lib/cacheManager";

interface ExtendedConversation {
  name?: string;
  lastMessage?: string | null;
  lastMessageTime?: Date | null;
  lastMessageSenderId?: string | null;
  lastMessageSenderName?: string | null;
  lastMessageSenderUsername?: string | null;
  lastMessageSenderAvatar?: string | null;
}

export const getConversations = expressAsyncHandler(
  async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.auth.userId;
    const cacheKey = Cache.getConvKey(userId);
    const cached = await Cache.get(cacheKey);

    if (cached) {
      console.log("Returning conversations from cache");
      res.status(200).json(cached);
      return;
    }

    const convs = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      include: {
        messages: true,
      },
    });

    for (const conv of convs) {
      if (conv.isGroup === false) {
        const otherParticipant =
          userId === conv.participants[0]
            ? conv.participants[1]
            : conv.participants[0];
        const userData = await clerkClient.users.getUser(otherParticipant);
        conv.name = userData.firstName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.username;
      }
    }

    for (const conv of convs) {
      const extendedConv = conv as ExtendedConversation;

      if (conv.messages.length > 0) {
        const msgs = conv.messages.sort(
          (a: any, b: any) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const lastMsg = msgs[msgs.length - 1];
        extendedConv.lastMessage = lastMsg.text;
        extendedConv.lastMessageTime = new Date(lastMsg.createdAt);
        extendedConv.lastMessageSenderId = lastMsg.senderId;

        if (lastMsg.senderId && lastMsg.senderId !== "system") {
          try {
            const senderData = await clerkClient.users.getUser(
              lastMsg.senderId
            );
            extendedConv.lastMessageSenderName =
              senderData.firstName && senderData.lastName
                ? `${senderData.firstName} ${senderData.lastName}`
                : null;
            extendedConv.lastMessageSenderUsername =
              senderData.username || null;
            extendedConv.lastMessageSenderAvatar = senderData.imageUrl || null;
          } catch (error) {
            console.error(
              `Error fetching sender data for ID ${lastMsg.senderId}:`,
              error
            );
            extendedConv.lastMessageSenderName = null;
            extendedConv.lastMessageSenderUsername = null;
            extendedConv.lastMessageSenderAvatar = null;
          }
        }
      } else {
        extendedConv.lastMessage = null;
        extendedConv.lastMessageTime = null;
        extendedConv.lastMessageSenderId = null;
        extendedConv.lastMessageSenderName = null;
        extendedConv.lastMessageSenderUsername = null;
        extendedConv.lastMessageSenderAvatar = null;
      }
    }

    await Cache.set(cacheKey, convs);
    res.status(200).json(convs);
    return;
  }
);

export const getConversation = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId as string,
      },
    });

    res.status(200).json(conversation);
    return;
  }
);

export const createConversation = expressAsyncHandler(
  async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.auth.userId;
    const { name, participants } = req.body;

    if (!participants || participants.length === 0) {
      throw new Error("Participants are required");
    }
    participants.filter((p: string) => p !== userId);
    const users = await clerkClient.users.getUserList({
      username: participants,
    });

    const participantIds = users.data.map((u) => u.id);

    if (participantIds.length !== participants.length) {
      throw new Error("One or more usernames were not found");
    }

    if (participantIds.length === 1) {
      const existingConv = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            hasEvery: [userId, participantIds[0]],
          },
        },
      });

      if (existingConv) {
        res.status(200).json(existingConv);
        return;
      }

      const otherUser = await clerkClient.users.getUser(participantIds[0]);
      const otherUserName = otherUser.firstName
        ? `${otherUser.firstName} ${otherUser.lastName || ""}`
        : otherUser.username || "Unknown User";

      const newConv = await prisma.conversation.create({
        data: {
          name:
            name ||
            `Direct message ${
              //@ts-ignore
              req.auth?.username || req.auth.userId
            } - ${otherUserName}`,
          isGroup: false,
          participants: [userId, participantIds[0]],
        },
      });

      await Cache.invalidateConvCache([userId, participantIds[0]]);

      res.status(201).json(newConv);
      return;
    } else {
      const newConv = await prisma.conversation.create({
        data: {
          name: name || "Group chat",
          isGroup: true,
          participants: [userId, ...participantIds],
        },
      });

      await Cache.invalidateConvCache([userId, ...participantIds]);

      res.status(201).json(newConv);
      return;
    }
  }
);

export const updateConversation = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { name } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const conv = await prisma.conversation.update({
      where: {
        id: conversationId as string,
      },
      data: {
        name,
      },
    });

    await Cache.invalidateConvCache(conv.participants);

    res.status(200).json(conv);
    return;
  }
);

export const deleteConversation = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const conv = await prisma.conversation.findUnique({
      where: {
        id: conversationId as string,
      },
    });

    if (!conv) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    await prisma.conversation.delete({
      where: {
        id: conversationId as string,
      },
    });

    await Cache.invalidateConvCache(conv.participants);

    res.status(204).send();
    return;
  }
);
