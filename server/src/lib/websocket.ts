import { WebSocketServer, WebSocket } from "ws";
import { Server } from "http";
import { Request } from "express";
import { User } from "./User";
import jwt from "jsonwebtoken";
import { CLERK_PEM_PUBLIC_KEY } from "@/utils/secrets";
import { UserJwtPayload } from "./websocket.types";
import { clerkClient } from "@clerk/express";
import { Cache } from "./cacheManager";
import { prisma } from "./prisma";
import { MessageHandler } from "./MessageHandler";

const ONLINE_STATUS_INTERVAL = 5 * 60 * 1000; // 5 minutes
export const Users: Map<string, User> = new Map(); // userId -> User
const Conversations: Map<string, Set<string>> = new Map(); // conversationId -> Set<userId>

/* -- HELPERS FUNCTIONS -- */
async function getUserConversations(userId: string): Promise<Set<string>> {
  let convs: Set<string> | undefined;

  // Try to get from cache
  const userConvIdsKey = Cache.getConvIdKey(userId);
  try {
    const cached = await Cache.get(userConvIdsKey);
    if (cached && Array.isArray(cached) && cached.length > 0) {
      convs = new Set(cached);
      const dbConvs = await prisma.conversation.findMany({
        where: {
          id: {
            in: cached,
          },
        },
        select: {
          id: true,
          participants: true,
        },
      });

      dbConvs.forEach((conv) => {
        Conversations.set(conv.id, new Set(conv.participants));
      });

      return convs;
    }
  } catch (error) {
    console.error("Error getting cached conversation IDs:", error);
  }

  // Cache miss - fetch from database
  convs = new Set<string>();
  try {
    const dbConvs = await prisma.conversation.findMany({
      where: {
        participants: {
          has: userId,
        },
      },
      select: {
        id: true,
        participants: true,
      },
    });

    dbConvs.forEach((conv) => {
      convs!.add(conv.id);
      Conversations.set(conv.id, new Set(conv.participants));
    });

    // Cache only the conversation IDs (not full objects)
    await Cache.set(userConvIdsKey, Array.from(convs));
  } catch (error) {
    console.error("Error fetching conversations for user:", error);
  }

  return convs;
}

export async function broadcastInConv(convId: string, payload: any) {
  const participants = Conversations.get(convId);
  if (participants) {
    participants.forEach((participantId) => {
      const participant = Users.get(participantId);
      if (participant && participant.isOnline()) {
        participant.send(payload);
      }
    });
  }
}

async function broadcastOnlineStatus(userId: string, isOnline: boolean) {
  const convs = await getUserConversations(userId);
  const time = new Date();

  convs.forEach((convId) =>
    broadcastInConv(convId, {
      type: "ONLINE_STATUS",
      userId: userId,
      isOnline: isOnline,
      timestamp: time,
    })
  );
}

async function sendOnlineUsers(userId: string) {
  const userConvs = await getUserConversations(userId);
  userConvs.forEach((convId) => {
    const participants = Conversations.get(convId);
    const user = Users.get(userId);
    if (participants && user && user.isOnline()) {
      const onlineUsers = Array.from(participants).filter((pid) => {
        const pUser = Users.get(pid);
        return pUser?.isOnline();
      });

      onlineUsers.forEach((onlineUser) => {
        user.send({
          type: "ONLINE_STATUS",
          isOnline: true,
          userId: onlineUser,
          timestamp: new Date(),
        });
      });
    }
  });
}

async function doAuth(token: string): Promise<User | null> {
  try {
    const decodedToken = jwt.verify(token, CLERK_PEM_PUBLIC_KEY, {
      algorithms: ["RS256"],
    }) as UserJwtPayload;

    if (!decodedToken.sub) {
      console.error("Invalid token: missing subject");
      return null;
    }

    const userDetails = await clerkClient.users.getUser(decodedToken.sub);

    const user: User = new User(
      userDetails.id,
      userDetails.firstName || "",
      userDetails.lastName || "",
      userDetails.username || "",
      userDetails.imageUrl
    );
    // console.log("Authenticated user:", user);
    return user;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

/* -- WSS LOGIC -- */
export default async function createWebSocketServer(server: Server) {
  const wss = new WebSocketServer({ server });

  wss.on("connection", async (ws: WebSocket, req: Request) => {
    //get token
    let user: User | null = null;
    const url = new URL(req.url ?? "", `http://${req.headers.host}`);
    const clerkToken = url.searchParams.get("clerkToken");

    if (!clerkToken) {
      ws.close(4401, "No token provided");
      return;
    }

    try {
      user = await doAuth(clerkToken);
      if (!user) {
        ws.close(4403, "Authentication failed");
        return;
      }
      user.setSocket(ws);
      user.ackConnection();
      Users.set(user.id, user);
      broadcastOnlineStatus(user.id, true);
      sendOnlineUsers(user.id);

      console.log(`> User ${user.id} connected via WebSocket`);
    } catch (error) {
      ws.close(4403, "Authentication error");
      return;
    }

    ws.on("message", (message) => {
      try {
        MessageHandler.handleMessage(user, message);
      } catch (err) {
        console.error("Error handling message:", err);
        MessageHandler.handleError(message);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
      ws.close(1011, "WebSocket error");
    });

    ws.on("close", () => {
      console.log("WebSocket connection closed");
      if (user) {
        user.clearSocket();
        broadcastOnlineStatus(user.id, false);
      }
    });
  });

  setInterval(async () => {
    console.log(
      `Running scheduled online status check. Active users: ${Users.size}`
    );
    for (const userId of Users.keys()) {
      await sendOnlineUsers(userId);
    }
  }, ONLINE_STATUS_INTERVAL);
}
