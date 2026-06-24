import { requireChatRole, requireCurrentUser } from "../auth/auth.service";
import {
  createNewChat,
  deleteChatById,
  findChatById,
  findChatsByUserId,
  updateChatById,
} from "./chat.service";
import { AppError } from "../../utils/app-error";
import type { Context } from "hono";

export async function getChats(c: Context) {
  const user = await requireCurrentUser(c);
  const chats = await findChatsByUserId(user.id);
  return c.json(chats, 200);
}

export async function getChat(c: Context) {
  const user = await requireCurrentUser(c);
  const chatId = c.req.param("chatId");

  if (!chatId) {
    throw new AppError(400, "Chat ID is required");
  }

  await requireChatRole(chatId, user.id);

  const chat = await findChatById(chatId);

  return c.json(chat, 200);
}

export async function createChat(c: Context) {
  const user = await requireCurrentUser(c);
  const { name, participants } = await c.req.json();

  if (!participants || !Array.isArray(participants) || participants.length === 0) {
    throw new AppError(400, "Participants are required and must be an array");
  }

  const chat = await createNewChat({
    currentUserId: user.id,
    name,
    participantIds: participants,
  });

  return c.json(chat, 200);
}

export async function updateChat(c: Context) {
  const user = await requireCurrentUser(c);
  const chatId = c.req.param("chatId");
  const { name } = await c.req.json();

  if (!chatId) {
    throw new AppError(400, "Chat ID is required");
  }

  if (!name || name.trim() === "") {
    throw new AppError(400, "Chat name is required");
  }

  await requireChatRole(chatId, user.id, ["ADMIN", "SUPERADMIN"]);

  const chat = await updateChatById({ chatId, name });

  return c.json(chat, 200);
}

export async function deleteChat(c: Context) {
  const user = await requireCurrentUser(c);
  const chatId = c.req.param("chatId");

  if (!chatId) {
    throw new AppError(400, "Chat ID is required");
  }

  await requireChatRole(chatId, user.id, ["ADMIN", "SUPERADMIN"]);

  await deleteChatById(chatId);
  return c.json({ success: "true" });
}
