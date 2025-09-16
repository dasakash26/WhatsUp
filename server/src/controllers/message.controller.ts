import expressAsyncHandler from "express-async-handler";
import { Request, Response } from "express";
import { prisma } from "../lib/prisma";
import { clerkClient } from "@clerk/express";
import { Cache } from "../lib/cacheManager";

export const getConversationMessages = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const cacheKey = Cache.getMsgKey(conversationId);
    const cached = await Cache.get(cacheKey);

    if (cached) {
      console.log("Returning messages from cache");
      res.status(200).json(cached);
      return;
    }

    const msgs = await prisma.message.findMany({
      where: {
        conversationId: conversationId as string,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const resp = {
      messages: msgs,
      length: msgs.length,
    };

    await Cache.set(cacheKey, resp, Cache.MSG_TTL);

    res.status(200).json(resp);
    return;
  }
);

export const createMessage = expressAsyncHandler(
  async (req: Request, res: Response) => {
    //@ts-ignore
    const userId = req.auth.userId;
    const { conversationId } = req.params;
    const { text } = req.body;
    const image = req.file;

    if (!conversationId || (!text && !image)) {
      res.status(400).json({ error: "Conversation ID or content is required" });
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

    const sender = await clerkClient.users.getUser(userId);
    console.log(sender);

    const imagePath = image ? image.path || image.filename : null;

    const msg = await prisma.message.create({
      data: {
        text,
        image: imagePath,
        senderId: userId,
        senderName: sender.fullName,
        senderUsername: sender.username,
        senderAvatar: sender.imageUrl,
        conversationId: conversationId as string,
      },
    });

    await Cache.invalidateConvAndMsgs(conv.participants, conversationId);

    res.status(200).json(msg);
    return;
  }
);

export const updateMessage = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { messageId } = req.params;
    const { text, image, status } = req.body;

    if (!messageId) {
      res.status(400).json({ error: "Message ID is required" });
      return;
    }

    const existingMsg = await prisma.message.findUnique({
      where: {
        id: messageId as string,
      },
    });

    if (!existingMsg) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const updateData: any = {};
    if (text !== undefined) updateData.text = text;
    if (image !== undefined) updateData.image = image;
    if (status !== undefined) updateData.status = status;

    const msg = await prisma.message.update({
      where: {
        id: messageId as string,
      },
      data: updateData,
    });

    const conv = await prisma.conversation.findUnique({
      where: {
        id: existingMsg.conversationId,
      },
    });

    if (conv) {
      await Cache.invalidateConvAndMsgs(
        conv.participants,
        existingMsg.conversationId
      );
    }

    res.status(200).json(msg);
    return;
  }
);

export const deleteMessage = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { messageId } = req.params;

    if (!messageId) {
      res.status(400).json({ error: "Message ID is required" });
      return;
    }

    const msg = await prisma.message.findUnique({
      where: {
        id: messageId as string,
      },
    });

    if (!msg) {
      res.status(404).json({ error: "Message not found" });
      return;
    }

    const conv = await prisma.conversation.findUnique({
      where: {
        id: msg.conversationId,
      },
    });

    await prisma.message.delete({
      where: {
        id: messageId as string,
      },
    });

    if (conv) {
      await Cache.invalidateConvAndMsgs(conv.participants, msg.conversationId);
    }

    res.status(200).json({ message: "Message deleted successfully" });
    return;
  }
);

//Delete all messages in a conversation
export const deleteConversationMessages = expressAsyncHandler(
  async (req: Request, res: Response) => {
    const { conversationId } = req.params;

    //@ts-ignore
    const userId = req.auth.userId;
    const user = await clerkClient.users.getUser(userId);
    if (!conversationId) {
      res.status(400).json({ error: "Conversation ID is required" });
      return;
    }

    const messages = await prisma.message.deleteMany({
      where: {
        conversationId: conversationId as string,
      },
    });

    //system generated delete info message
    const message = await prisma.message.create({
      data: {
        text: `All messages in this conversation have been deleted by ${user.firstName} ${user.lastName} (@${user.username})`,
        senderId: "system",
        senderName: "System",
        senderUsername: "System",
        senderAvatar:
          "https://png.pngtree.com/png-vector/20201224/ourmid/pngtree-future-intelligent-technology-robot-ai-png-image_2588803.jpg",
        conversationId: conversationId as string,
      },
    });

    res.status(200).json(message);
  }
);
