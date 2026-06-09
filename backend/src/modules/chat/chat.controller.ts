import type { Request, Response } from "express";
import { requireChatRole, requireCurrentUser } from "../auth/auth.service";
import {
  createNewChat,
  deleteChatById,
  findChatById,
  findChatsByUserId,
  updateChatById,
} from "./chat.service";
import { AppError } from "../../utils/app-error";

export async function getChats(req: Request, res: Response) {
  const user = await requireCurrentUser(req);
  const chats = await findChatsByUserId(user.id);
  return res.status(200).json(chats);
}

export async function getChat(req: Request<{ chatId: string }>, res: Response) {
  const user = await requireCurrentUser(req);
  const { chatId } = req.params;

  if (!chatId) {
    throw new AppError(400, "Chat ID is required");
  }

  await requireChatRole(chatId, user.id);

  const chat = await findChatById(chatId);
  return res.status(200).json(chat);
}

export async function createChat(req: Request, res: Response) {
  const user = await requireCurrentUser(req);
  const { name, participants } = req.body;

  if (!participants || participants.length === 0) {
    throw new AppError(400, "Participants are required");
  }

  const chat = await createNewChat({
    currentUserId: user.id,
    name,
    participantIds: participants,
  });

  return res.status(201).json(chat);
}

export async function updateChat(
  req: Request<{ chatId: string }>,
  res: Response,
) {
  const user = await requireCurrentUser(req);
  const { chatId } = req.params;
  const { name } = req.body;

  if (!chatId) {
    throw new AppError(400, "Chat ID is required");
  }

  if (!name || name.trim() === "") {
    throw new AppError(400, "Chat name is required");
  }

  await requireChatRole(chatId, user.id, ["ADMIN", "SUPERADMIN"]);

  const chat = await updateChatById({ chatId, name });
  return res.status(200).json(chat);
}

export async function deleteChat(
  req: Request<{ chatId: string }>,
  res: Response,
) {
  const user = await requireCurrentUser(req);
  const { chatId } = req.params;

  if (!chatId) {
    throw new AppError(400, "Chat ID is required");
  }

  await requireChatRole(chatId, user.id, ["ADMIN", "SUPERADMIN"]);

  await deleteChatById(chatId);
  return res.status(204).send();
}
