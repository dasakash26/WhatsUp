import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import expressAsyncHandler from "express-async-handler";
import { clerkClient } from "@clerk/express";

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

    const conversations = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      include: {
        messages: true,
      },
    });

    for (const conversation of conversations) {
      if (conversation.isGroup === false) {
        const otherParticipant =
          userId === conversation.participants[0]
            ? conversation.participants[1]
            : conversation.participants[0];
        const userData = await clerkClient.users.getUser(otherParticipant);
        conversation.name = userData.firstName
          ? `${userData.firstName} ${userData.lastName}`
          : userData.username;
      }
    }

    for (const conversation of conversations) {
      const extendedConv = conversation as ExtendedConversation;

      if (conversation.messages.length > 0) {
        const _messages = conversation.messages.sort(
          (a, b) => a.createdAt.getTime() - b.createdAt.getTime()
        );
        const lastMessage = _messages[_messages.length - 1];
        extendedConv.lastMessage = lastMessage.text;
        extendedConv.lastMessageTime = new Date(lastMessage.createdAt);
        extendedConv.lastMessageSenderId = lastMessage.senderId;

        // Add sender information for the last message
        if (lastMessage.senderId && lastMessage.senderId !== "system") {
          try {
            const senderData = await clerkClient.users.getUser(
              lastMessage.senderId
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
              `Error fetching sender data for ID ${lastMessage.senderId}:`,
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

    res.status(200).json(conversations);
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

// Create a new conversation
export const createConversation = expressAsyncHandler(
  async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.auth.userId;
    const { name, participants } = req.body;

    if (!participants || participants.length === 0) {
      throw new Error("Participants are required");
    }
    participants.filter((participant: string) => participant !== userId);
    const users = await clerkClient.users.getUserList({
      username: participants,
    });

    const participantIds = users.data.map((user) => user.id);

    if (participantIds.length !== participants.length) {
      throw new Error("One or more usernames were not found");
    }

    if (participantIds.length === 1) {
      // Create direct message conversation
      const existingConversation = await prisma.conversation.findFirst({
        where: {
          isGroup: false,
          participants: {
            hasEvery: [userId, participantIds[0]],
          },
        },
      });

      if (existingConversation) {
        res.status(200).json(existingConversation);
        return;
      }

      // Get the other user's details
      const otherUser = await clerkClient.users.getUser(participantIds[0]);
      const otherUserName = otherUser.firstName
        ? `${otherUser.firstName} ${otherUser.lastName || ""}`
        : otherUser.username || "Unknown User";

      const newConversation = await prisma.conversation.create({
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

      res.status(201).json(newConversation);
      return;
    } else {
      // Create group conversation
      const newConversation = await prisma.conversation.create({
        data: {
          name: name || "Group chat",
          isGroup: true,
          participants: [userId, ...participantIds],
        },
      });

      res.status(201).json(newConversation);
      return;
    }
  }
);

// Update a conversation
export const updateConversation = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;
    const { name } = req.body;

    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const conversation = await prisma.conversation.update({
      where: {
        id: conversationId as string,
      },
      data: {
        name,
      },
    });

    res.status(200).json(conversation);
    return;
  }
);

// Delete a conversation
export const deleteConversation = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    await prisma.conversation.delete({
      where: {
        id: conversationId as string,
      },
    });

    res.status(204).send();
    return;
  }
);
