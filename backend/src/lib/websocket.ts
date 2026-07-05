import type { ServerWebSocket } from "bun";
import type { WSContext } from "hono/ws";
import type { Context } from "hono";
import { prisma } from "./prisma";
import { requireCurrentUser } from "../modules/auth/auth.service";
import { AppError } from "../utils/app-error";

export const activeUsers = new Set<string>();

export async function getUserChats(userId: string): Promise<string[]> {
  const memberships = await prisma.chatMember.findMany({
    where: { userId },
    select: { chatId: true },
  });
  return memberships.map((m) => m.chatId);
}

export function broadcastStatus({
  userId,
  chatIds,
  isOnline,
  socket,
}: {
  userId: string;
  chatIds: string[];
  isOnline: boolean;
  socket: ServerWebSocket;
}) {
  const payload = JSON.stringify({
    type: "ONLINE_STATUS",
    userId,
    isOnline,
    timestamp: new Date(),
  });

  chatIds.forEach((chatId) => {
    socket.publish(`chat_${chatId}`, payload);
  });
}

export const getWebSocketHandlers = (c: Context) => {
  return {
    async onOpen(_:any, ws: WSContext) {
      const rawWs = ws.raw as ServerWebSocket;
      let user;

      try {
        user = await requireCurrentUser(c);
      } catch (e) {
        ws.close(4401, "No token provided");
        return;
      }

      if (!user) throw new AppError(500, "user not found");

      activeUsers.add(user.id);
      (ws as any).userId = user.id;

      // Subscribe to private channel
      rawWs.subscribe(`user_${user.id}`);

      const chatIds = await getUserChats(user.id);

      // Subscribe to all the user's chats
      chatIds.forEach((chatId) => {
        rawWs.subscribe(`chat_${chatId}`);
      });

      broadcastStatus({
        userId: user.id,
        chatIds,
        isOnline: true,
        socket: rawWs,
      });
    },

    onMessage(event:any, ws: WSContext) {
      console.log(`[WebSocket] Message from client: ${event.data}`);
      ws.send("pong");
    },

    async onClose(_:any, ws: WSContext) {
      const rawWs = ws.raw as ServerWebSocket;
      const userId = (ws as any).userId;
      if (!userId) return;

      const chatIds = await getUserChats(userId);
      activeUsers.delete(userId);

      broadcastStatus({
        userId,
        chatIds,
        isOnline: false,
        socket: rawWs,
      });

      console.log("[WebSocket] Connection closed");
    },
  };
};
