import type { Handler } from "hono";
import {
  createChatMessage,
  deleteMessageById,
  deleteMessagesByChatId,
  findMessagesByChatId,
  requireUserMessage,
  updateMessageById,
} from "./message.service";
import { requireChatRole, requireCurrentUser } from "../auth/auth.service";
import { AppError } from "../../utils/app-error";
import { uploadToCloudinary } from "../../utils/cloudinary";

export const listMessages: Handler = async (c) => {
  const { id: userId } = await requireCurrentUser(c);
  const chatId = c.req.param("chatId");

  if (!chatId) {
    throw new AppError(400, "chat ID is required");
  }

  await requireChatRole(chatId, userId);

  const messages = await findMessagesByChatId(chatId);

  return c.json(
    {
      messages: messages,
      length: messages.length,
    },
    200,
  );
};

export const sendMessage: Handler = async (c) => {
  const { id: userId } = await requireCurrentUser(c);
  const chatId = c.req.param("chatId");

  let body;
  try {
    body = await c.req.parseBody();
  } catch {
    throw new AppError(400, "Failed to parse body");
  }

  const content = body.content as string | undefined;
  const image = body.image as File | undefined;

  if (!chatId || (!content && !image)) {
    throw new AppError(400, "chat ID and content is required");
  }

  await requireChatRole(chatId, userId);

  let mediaUrl: string | null = null;
  if (image && image.size > 0) {
    mediaUrl = await uploadToCloudinary(image);
  }

  const message = await createChatMessage({
    chatId,
    userId,
    content: content || null,
    mediaUrl,
  });

  return c.json({ message }, 201);
};

export const editMessage: Handler = async (c) => {
  const { id: userId } = await requireCurrentUser(c);
  const messageId = c.req.param("messageId");

  let body;
  try {
    body = await c.req.parseBody();
  } catch {
    throw new AppError(400, "Failed to parse body");
  }
  const content = body["content"] as string | undefined;

  if (!messageId) {
    throw new AppError(400, "Message ID is required");
  }

  if (!content) {
    throw new AppError(400, "content is required");
  }

  await requireUserMessage(userId, messageId);

  const message = await updateMessageById({
    messageId,
    content,
  });

  return c.json({ message }, 200);
};

export const removeMessage: Handler = async (c) => {
  const { id: userId } = await requireCurrentUser(c);
  const messageId = c.req.param("messageId");

  if (!messageId) {
    throw new AppError(400, "Message ID is required");
  }

  await requireUserMessage(userId, messageId);
  await deleteMessageById(messageId);

  return c.json({ message: "Message deleted successfully" }, 200);
};

export const clearChatMessages: Handler = async (c) => {
  const { id: userId } = await requireCurrentUser(c);
  const chatId = c.req.param("chatId");

  if (!chatId) {
    throw new AppError(400, "chat ID is required");
  }

  await requireChatRole(chatId, userId, ["ADMIN", "SUPERADMIN"]);

  const result = await deleteMessagesByChatId(chatId);

  return c.json(
    {
      message: "Messages deleted successfully",
      count: result.count,
    },
    200,
  );
};
