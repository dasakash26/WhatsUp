import express, { Request, Response } from "express";
import cors from "cors";
import http, { get } from "http";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";
import { PORT, STREAM_API_KEY, STREAM_API_SECRET } from "./utils/secrets";
import { clerkClient, requireAuth } from "@clerk/express";
import createWebSocketServer from "./lib/websocket";
import { getUserFromId } from "./controllers/user.controller";
import { StreamClient, StreamVideoClient } from "@stream-io/node-sdk";
import expressAsyncHandler from "express-async-handler";
import { Cache } from "./lib/cacheManager";

const app = express();
const server = http.createServer(app);

createWebSocketServer(server);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://client:5173",
      "http://client:3001",
      "https://whatsup-chat.onrender.com",
      "http://localhost:4173",
      "ws://whatsup-chat.onrender.com",
      "wss://whatsup-chat.onrender.com",
      "https://whatsup.akashd.online",
    ],
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
  // Log the request path and method
  console.log(`> ${req.method} ${req.path}`);
  next();
});

app.use("/api/conversation", requireAuth(), conversationRoutes);
app.use("/api/message", requireAuth(), messageRoutes);
app.get("/api/user/:userId", requireAuth(), getUserFromId);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

app.get(
  "/api/get-token",
  expressAsyncHandler(async (req, res) => {
    const { user_id } = req.query;

    if (!user_id) {
      res.status(400).json({ error: "user_id is required" });
      return;
    }

    // Try to get user from cache first
    const cacheKey = Cache.getUserKey(user_id as string);
    let user = await Cache.get(cacheKey);

    if (!user) {
      user = await clerkClient.users.getUser(user_id as string);
      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }
      await Cache.set(cacheKey, user, Cache.USER_TTL);
    }

    const newUser = {
      id: user_id as string,
      role: "user",
      name: user.fullName || user.username || "Unknown User",
      image:
        user.imageUrl ||
        "https://getstream.io/random_svg/?id=whatsup&name=whatsup",
    };

    await client.upsertUsers([newUser]);

    const token = client.generateUserToken({ user_id: user_id as string });
    res.status(200).json({
      apiKey: STREAM_API_KEY,
      userId: user_id,
      token,
    });
    return;
  })
);

server.listen(PORT, () => {
  console.log(`> Server running on port ${PORT}`);
});
