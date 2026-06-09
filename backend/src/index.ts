import express from "express";
import cors from "cors";
import http from "http";
import chatRoutes from "./modules/chat/chat.route.ts";
import messageRoutes from "./modules/message/message.route.ts";
import { PORT, STREAM_API_KEY, STREAM_API_SECRET } from "./utils/secrets";
import { clerkClient, requireAuth } from "@clerk/express";
import createWebSocketServer from "./lib/websocket";
import { getUserFromId } from "./modules/user/user.controller.ts";
import { StreamClient } from "@stream-io/node-sdk";
import clerkWebhookRouter from "./modules/user/clerk-webhook";
import morgan from "morgan";
import { errorHandler } from "./middleware/error.moddleware.ts";

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: ["*"],
    credentials: true,
  }),
);

app.use(morgan("dev"));

app.use("/api/webhook/clerk", clerkWebhookRouter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

createWebSocketServer(server);

app.use("/api/chat", requireAuth(), chatRoutes);
app.use("/api/message", messageRoutes);
app.get("/api/user/:userId", getUserFromId);

app.get("/", (req, res) => {
  res.send("WhatsUp backend is running");
});

const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);

app.get("/api/get-token", async (req, res) => {
  const { user_id } = req.query;

  if (!user_id) {
    res.status(400).json({ error: "user_id is required" });
    return;
  }

  try {
    const user = await clerkClient.users.getUser(user_id as string);
    if (!user) {
      res.status(404).json({ error: "User not found" });
      return;
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
  } catch (error) {
    res.status(404).json({ error: "User not found" });
    return;
  }
});

app.use(errorHandler);

server.listen(PORT, () => {
  console.log(`> Server running on port ${PORT}`);
});
