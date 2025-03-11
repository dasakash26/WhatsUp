import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { clerkClient } from "@clerk/express";

// Get messages for a conversation
export const getConversationMessages = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const messages = await prisma.message.findMany({
      where: {
        conversationId: conversationId as string,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.status(200).json({
      messages,
      length: messages.length,
    });
    return;
  }
);

// Create a new message
export const createMessage = expressAsyncHandler(
  async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.auth.userId;
    const { conversationId } = req.params;
    const { text, image } = req.body;

    if (!conversationId || (!text && !image)) {
      res
        .status(400)
        .json({ error: "Conversation ID and content are required" });
      return;
    }

    const conversation = await prisma.conversation.findUnique({
      where: {
        id: conversationId as string,
      },
    });

    if (!conversation) {
      res.status(404).json({ error: "Conversation not found" });
      return;
    }

    const sender = await clerkClient.users.getUser(userId);
    console.log(sender);
    const message = await prisma.message.create({
      data: {
        text,
        image,
        senderId: userId,
        // @ts-ignore
        senderName: sender.fullName,
        // @ts-ignore
        senderUsername: sender.username,
        // @ts-ignore
        senderAvatar: sender.imageUrl,
        conversationId: conversationId as string,
      },
    });

    res.status(200).json(message);
    return;
  }
);

// Update a message
export const updateMessage = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { text, image, status } = req.body;

    if (!messageId) {
      res.status(400).json({ error: "Message ID is required" });
      return;
    }

    //conditionally update the message if not null
    const message = await prisma.message.update({
      where: {
        id: messageId as string,
      },
      data: {
        text,
        image,
        status,
      },
    });
  }
);

// Delete a message
export const deleteMessage = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { messageId } = req.params;

    if (!messageId) {
      res.status(400).json({ error: "Message ID is required" });
      return;
    }

    const message = await prisma.message.delete({
      where: {
        id: messageId as string,
      },
    });

    res.status(200).json(message);
    return;
  }
);
