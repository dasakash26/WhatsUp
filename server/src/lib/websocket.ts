import { WebSocketServer, WebSocket } from "ws";
import type { Server as HTTPServer } from "http";
import { prisma } from "./prisma";
import jwt from "jsonwebtoken";
import { CLERK_PEM_PUBLIC_KEY } from "../utils/secrets";
import { clerkClient } from "@clerk/express";
import {
  UserJwtPayload,
  User,
  WebSocketMessage,
  MessagePayload,
  CompleteMessage,
  ConversationCache,
  ErrorPayload,
  ConnectionEstablishedPayload,
  TypingPayload,
  ReadReceiptPayload,
  OnlineStatusPayload,
} from "./websocket.types";
import { upload } from "@/middleware/multer.middleware";

async function authenticateUser(token: string): Promise<User | null> {
  try {
    const decodedToken = jwt.verify(token, CLERK_PEM_PUBLIC_KEY, {
      algorithms: ["RS256"],
    }) as UserJwtPayload;

    if (!decodedToken.sub) {
      console.error("Invalid token: missing subject");
      return null;
    }

    const userDetails = await clerkClient.users.getUser(decodedToken.sub);

    return {
      id: userDetails.id,
      firstName: userDetails.firstName || "Unknown",
      lastName: userDetails.lastName || "",
      username: userDetails.username,
      imageUrl: userDetails.imageUrl,
    };
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export default function createWebSocketServer(server: HTTPServer) {
  const wss = new WebSocketServer({
    server,
    clientTracking: true,
    perMessageDeflate: {
      zlibDeflateOptions: {
        chunkSize: 1024,
        memLevel: 7,
        level: 3,
      },
      zlibInflateOptions: {
        chunkSize: 10 * 1024,
      },
      concurrencyLimit: 10,
      threshold: 1024,
    },
  });
  const clients = new Map<string, WebSocket>();
  const onlineUsers = new Set<string>();
  const conversationCache = new Map<string, ConversationCache>();

  const CACHE_TTL = 5 * 60 * 1000;
  const ONLINE_STATUS_CHECK_INTERVAL = 60 * 1000; // 20 seconds

  async function cacheConversation(conversationId: string): Promise<boolean> {
    try {
      const conversation = await prisma.conversation.findUnique({
        where: { id: conversationId },
      });

      if (!conversation) {
        return false;
      }

      conversationCache.set(conversationId, {
        participants: conversation.participants,
        lastUpdated: new Date(),
      });

      return true;
    } catch (error) {
      console.error("Error caching conversation:", error);
      return false;
    }
  }

  function isValidCache(cached: ConversationCache): boolean {
    const now = new Date();
    return now.getTime() - cached.lastUpdated.getTime() < CACHE_TTL;
  }

  async function cacheUserConversations(userId: string): Promise<void> {
    console.log(`Attempting to cache conversations for user ${userId}`);
    try {
      const userConversations = await prisma.conversation.findMany({
        where: {
          participants: {
            hasSome: [userId],
          },
        },
      });

      userConversations.forEach((conversation) => {
        conversationCache.set(conversation.id, {
          participants: conversation.participants,
          lastUpdated: new Date(),
        });
      });

      console.log(
        `Cached ${userConversations.length} conversations for user ${userId}`
      );
    } catch (error) {
      console.error(`Error caching conversations for user ${userId}:`, error);
    }
  }

  function broadcastToAllClients(data: any): void {
    console.log(`Broadcasting to all clients: ${data.type || "unknown type"}`);
    clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(data));
      }
    });
  }

  async function broadcastToConversationParticipants(
    conversationId: string,
    message: any
  ): Promise<void> {
    console.log(
      `Broadcasting ${
        message.type || "message"
      } to conversation ${conversationId}`
    );
    try {
      let cachedConversation = conversationCache.get(conversationId);

      if (!cachedConversation || !isValidCache(cachedConversation)) {
        console.log(
          `Cache miss for conversation ${conversationId}, refreshing cache`
        );
        const success = await cacheConversation(conversationId);
        if (!success) {
          console.error(`Conversation ${conversationId} not found`);
          return;
        }
        cachedConversation = conversationCache.get(conversationId);
      } else {
        console.log(`Cache hit for conversation ${conversationId}`);
      }

      let sentCount = 0;
      cachedConversation?.participants.forEach((participantId) => {
        const client = clients.get(participantId);
        if (client && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify(message));
          sentCount++;
        }
      });
      console.log(
        `Message sent to ${sentCount}/${
          cachedConversation?.participants.length || 0
        } participants in conversation ${conversationId}`
      );
    } catch (error) {
      console.error("Error broadcasting to conversation:", error);
    }
  }

  async function handleIncomingMessage(
    userId: string,
    userData: UserJwtPayload,
    data: MessagePayload
  ): Promise<void> {
    const { conversationId, text, imageUrl } = data;

    try {
      const username = userData.username || userData.preferred_username;
      const name = userData.name || username;
      const avatarUrl = userData.image_url || userData.picture;

      const newMessage = await prisma.message.create({
        data: {
          text,
          image: imageUrl || null,
          senderId: userId,
          senderName: name,
          senderUsername: username,
          senderAvatar: avatarUrl,
          conversationId,
          status: "SENT",
        },
      });

      const completeMessage: CompleteMessage = {
        type: "NEW_MESSAGE",
        id: newMessage.id,
        text: newMessage.text,
        image: newMessage.image,
        status: newMessage.status,
        senderId: userId,
        senderName: newMessage.senderName || "",
        senderUsername: newMessage.senderUsername || "",
        senderAvatar: newMessage.senderAvatar,
        conversationId,
        createdAt: newMessage.createdAt,
      };

      await broadcastToConversationParticipants(
        conversationId,
        completeMessage
      );
    } catch (error) {
      console.error(`Error handling message from user ${userId}:`, error);
    }
  }

  async function handleTyping(userId: string, data: any): Promise<void> {
    if ("conversationId" in data) {
      const typingPayload: TypingPayload = {
        type: "TYPING",
        userId,
        conversationId: data.conversationId,
        isTyping: data.isTyping === true,
        timestamp: new Date(),
      };

      console.log(
        `User ${userId} typing status in conversation ${data.conversationId}: ${data.isTyping}`
      );
      await broadcastToConversationParticipants(
        data.conversationId,
        typingPayload
      );
    } else {
      console.warn("Missing conversationId in TYPING message");
    }
  }

  async function handleReadReceipt(userId: string, data: any): Promise<void> {
    if ("conversationId" in data && "messageId" in data) {
      try {
        await prisma.message.update({
          where: { id: data.messageId },
          data: { status: "READ" },
        });

        const readReceiptPayload: ReadReceiptPayload = {
          type: "READ_RECEIPT",
          userId,
          conversationId: data.conversationId,
          messageId: data.messageId,
          timestamp: new Date(),
        };

        await broadcastToConversationParticipants(
          data.conversationId,
          readReceiptPayload
        );
      } catch (err) {
        console.error("Error processing read receipt:", err);
      }
    } else {
      console.warn("Invalid READ_RECEIPT message format");
    }
  }

  async function broadcastOnlineStatus(
    userId: string,
    isOnline: boolean
  ): Promise<void> {
    try {
      // Find all conversations this user participates in
      const userConversations = await prisma.conversation.findMany({
        where: {
          participants: {
            hasSome: [userId],
          },
        },
        select: {
          id: true,
          participants: true,
        },
      });

      const onlineStatusPayload: OnlineStatusPayload = {
        type: "ONLINE_STATUS",
        userId,
        isOnline,
        timestamp: new Date(),
      };

      // Broadcast to all participants in all conversations
      for (const conversation of userConversations) {
        await broadcastToConversationParticipants(
          conversation.id,
          onlineStatusPayload
        );
      }

      console.log(`Broadcast online status for user ${userId}: ${isOnline}`);
    } catch (error) {
      console.error("Error broadcasting online status:", error);
    }
  }

  // Send current online users to the specified client
  async function sendOnlineUsersToClient(userId: string): Promise<void> {
    const client = clients.get(userId);
    if (!client || client.readyState !== WebSocket.OPEN) return;

    try {
      // Get all conversations for this user
      const userConversations = await prisma.conversation.findMany({
        where: {
          participants: {
            hasSome: [userId],
          },
        },
        select: {
          id: true,
          participants: true,
        },
      });

      // Collect all unique participants from all conversations
      const allParticipants = new Set<string>();
      userConversations.forEach((conv) => {
        conv.participants.forEach((p) => {
          if (p !== userId) {
            allParticipants.add(p);
          }
        });
      });

      let sentStatusCount = 0;
      // For each online participant, send their status
      for (const participantId of allParticipants) {
        if (onlineUsers.has(participantId)) {
          const onlineStatusPayload: OnlineStatusPayload = {
            type: "ONLINE_STATUS",
            userId: participantId,
            isOnline: true,
            timestamp: new Date(),
          };
          client.send(JSON.stringify(onlineStatusPayload));
          sentStatusCount++;
        }
      }

      console.log(`Sent ${sentStatusCount} online users to client ${userId}`);
    } catch (error) {
      console.error(`Error sending online users to client ${userId}:`, error);
    }
  }

  async function handleRequestOnlineUsers(userId: string): Promise<void> {
    await sendOnlineUsersToClient(userId);
  }

  wss.on("connection", async (ws, req) => {
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const clerkToken = url.searchParams.get("clerkToken");
    if (!clerkToken) {
      ws.close(4401, "No token provided");
      return;
    }

    try {
      const user = await authenticateUser(clerkToken);
      if (!user) {
        ws.close(4403, "Authentication failed");
        return;
      }

      const userId = user.id;

      clients.set(String(userId), ws);
      onlineUsers.add(userId); // Mark user as online
      console.log("Client connected:", userId);

      await cacheUserConversations(userId);
      await broadcastOnlineStatus(userId, true); // Broadcast online status to others
      await sendOnlineUsersToClient(userId); // Send online users to this client

      ws.on("message", async (message) => {
        try {
          const data = JSON.parse(message.toString()) as WebSocketMessage;
          console.log("Received data:", data);

          switch (data.type) {
            case "MESSAGE":
              await handleIncomingMessage(
                userId,
                {
                  sub: user.id,
                  name: `${user.firstName} ${user.lastName}`.trim(),
                  username: user.username || undefined,
                  image_url: user.imageUrl,
                },
                data as MessagePayload
              );
              break;
            case "TYPING":
              await handleTyping(userId, data);
              break;
            case "READ_RECEIPT":
              await handleReadReceipt(userId, data);
              break;
            case "REQUEST_ONLINE_STATUS":
              await handleRequestOnlineUsers(userId);
              break;
            default:
              console.warn(`Unknown message type: ${data.type}`);
          }
        } catch (err) {
          console.error("Error parsing or handling message:", err);

          const errorPayload: ErrorPayload = {
            type: "ERROR",
            message: "Failed to process your message",
            timestamp: new Date(),
          };

          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify(errorPayload));
          }
        }
      });

      // Send connection confirmation
      const connectionPayload: ConnectionEstablishedPayload = {
        type: "CONNECTION_ESTABLISHED",
        userId,
        timestamp: new Date(),
      };
      ws.send(JSON.stringify(connectionPayload));

      ws.on("error", (error) => {
        console.error(`WebSocket error for user ${userId}:`, error);
      });

      ws.on("close", (code, reason) => {
        clients.delete(String(userId));
        onlineUsers.delete(userId); // Mark user as offline
        broadcastOnlineStatus(userId, false).catch((err) =>
          console.error("Error broadcasting offline status:", err)
        );
        console.log(
          `Client disconnected: ${userId}, Code: ${code}, Reason: ${reason.toString()}`
        );
      });
    } catch (error) {
      console.error("Connection error:", error);
      ws.close(4500, "Internal server error");
    }
  });

  setInterval(() => {
    const now = new Date().getTime();
    let removedCount = 0;
    for (const [id, cache] of conversationCache.entries()) {
      if (now - cache.lastUpdated.getTime() > CACHE_TTL) {
        conversationCache.delete(id);
        removedCount++;
      }
    }
    if (removedCount > 0) {
      console.log(
        `Cache cleanup: removed ${removedCount} stale conversation entries`
      );
    }
  }, CACHE_TTL);

  // Periodic online status check and broadcast
  setInterval(async () => {
    console.log(
      `Running scheduled online status check. Active users: ${onlineUsers.size}`
    );
    for (const userId of clients.keys()) {
      await sendOnlineUsersToClient(userId);
    }
  }, ONLINE_STATUS_CHECK_INTERVAL);
}
