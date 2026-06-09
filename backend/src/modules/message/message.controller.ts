import type { Request, Response } from "express";
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

export async function listMessages(
  req: Request<{ chatId: string }>,
  res: Response,
) {
  const { id: userId } = await requireCurrentUser(req);
  const { chatId } = req.params;

  if (!chatId) {
    throw new AppError(400, "chat ID is required");
  }

  await requireChatRole(chatId, userId);

  const messages = await findMessagesByChatId(chatId);

  return res.status(200).json({
    messages: messages,
    length: messages.length,
  });
}

export async function sendMessage(
  req: Request<{ chatId: string }>,
  res: Response,
) {
  const { id: userId } = await requireCurrentUser(req);

  const { chatId } = req.params;
  const { content } = req.body;
  const image = req.file;

  if (!chatId || (!content && !image)) {
    throw new AppError(400, "chat ID and content is required");
  }

  await requireChatRole(chatId, userId);

  const mediaUrl = image ? image.path || image.filename : null;

  const message = await createChatMessage({
    chatId,
    userId,
    content,
    mediaUrl,
  });

  return res.status(201).json({ message });
}

export async function editMessage(
  req: Request<{ messageId: string }>,
  res: Response,
) {
  const { id: userId } = await requireCurrentUser(req);
  const { messageId } = req.params;
  const { content } = req.body;

  if (!messageId) {
    throw new AppError(400, "Message ID is required");
  }

  if (!content) {
    throw new AppError(400, "content or image is required");
  }

  await requireUserMessage(userId, messageId);

  const message = await updateMessageById({
    messageId,
    content,
  });

  return res.status(200).json({ message });
}

export async function removeMessage(
  req: Request<{ messageId: string }>,
  res: Response,
) {
  const { id: userId } = await requireCurrentUser(req);
  const { messageId } = req.params;

  if (!messageId) {
    throw new AppError(400, "Message ID is required");
  }

  await requireUserMessage(userId, messageId);
  await deleteMessageById(messageId);

  return res.status(200).json({ message: "Message deleted successfully" });
}

export async function clearChatMessages(
  req: Request<{ chatId: string }>,
  res: Response,
) {
  const { id: userId } = await requireCurrentUser(req);
  const { chatId } = req.params;

  if (!chatId) {
    throw new AppError(400, "chat ID is required");
  }

  await requireChatRole(chatId, userId, ["ADMIN", "SUPERADMIN"]);

  const result = await deleteMessagesByChatId(chatId);

  return res.status(200).json({
    message: "Messages deleted successfully",
    count: result.count,
  });
}
