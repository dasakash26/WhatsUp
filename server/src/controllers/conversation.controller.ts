import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import expressAsyncHandler from "express-async-handler";
import { clerkClient } from "@clerk/express";

interface ExtendedConversation {
  name?: string;
  lastMessage?: string | null;
  lastMessageTime?: Date | null;
  lastMessageSenderId?: string | null;
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
      const extendedConvo = conversation as unknown as ExtendedConversation;

      if (conversation.messages.length > 0) {
        // Sort messages by creation time to ensure we get the latest
        const sortedMessages = [...conversation.messages].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );

        const lastMessage = sortedMessages[0];

        // Add properly formatted last message data
        extendedConvo.lastMessage = lastMessage.text;
        extendedConvo.lastMessageTime = lastMessage.createdAt;
        extendedConvo.lastMessageSenderId = lastMessage.senderId;
      } else {
        // Handle conversations with no messages
        extendedConvo.lastMessage = null;
        extendedConvo.lastMessageTime = null;
        extendedConvo.lastMessageSenderId = null;
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
