import type { Context } from "hono";
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

export async function listMessages(c: Context) {
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
}

export async function sendMessage(c: Context) {
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

  const server = c.env as any;
  server?.publish(`chat_${chatId}`, JSON.stringify({
    type: "NEW_MESSAGE",
    message,
  }));

  return c.json({ message }, 201);
}

export async function editMessage(c: Context) {
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

  const server = c.env as any;
  server?.publish(`chat_${message.chatId}`, JSON.stringify({
    type: "EDIT_MESSAGE",
    message,
  }));

  return c.json({ message }, 200);
}

export async function removeMessage(c: Context) {
  const { id: userId } = await requireCurrentUser(c);
  const messageId = c.req.param("messageId");

  if (!messageId) {
    throw new AppError(400, "Message ID is required");
  }

  const message = await requireUserMessage(userId, messageId);
  await deleteMessageById(messageId);

  const server = c.env as any;
  server?.publish(`chat_${message.chatId}`, JSON.stringify({
    type: "DELETE_MESSAGE",
    messageId,
    chatId: message.chatId,
  }));

  return c.json({ message: "Message deleted successfully" }, 200);
}

export async function clearChatMessages(c: Context) {
  const { id: userId } = await requireCurrentUser(c);
  const chatId = c.req.param("chatId");

  if (!chatId) {
    throw new AppError(400, "chat ID is required");
  }

  await requireChatRole(chatId, userId, ["ADMIN", "SUPERADMIN"]);

  const result = await deleteMessagesByChatId(chatId);

  const server = c.env as any;
  server?.publish(`chat_${chatId}`, JSON.stringify({
    type: "CLEAR_CHAT_MESSAGES",
    chatId,
  }));

  return c.json(
    {
      message: "Messages deleted successfully",
      count: result.count,
    },
    200,
  );
}
