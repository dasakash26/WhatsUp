import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";

import chatRoutes from "./modules/chat/chat.route.ts";
import messageRoutes from "./modules/message/message.route.ts";
import { getUserFromId } from "./modules/user/user.controller.ts";
import { errorHandler } from "./middleware/error.moddleware.ts";
import clerkWebhookRouter from "./modules/user/clerk-webhook";
import { clerkMiddleware } from "@clerk/hono";

const app = new Hono();

app.use(cors(), logger(), clerkMiddleware());

app.route("/api/webhook/clerk", clerkWebhookRouter);

app.route("/api/chat", chatRoutes);
app.route("/api/message", messageRoutes);
app.get("/api/user/:userId", getUserFromId);

app.get("/", (c) => {
  return c.text("WhatsUp backend is running");
});

app.onError(errorHandler);

export default app;

// import { StreamClient } from "@stream-io/node-sdk";
// import { STREAM_API_KEY, STREAM_API_SECRET } from "./utils/secrets";
// const client = new StreamClient(STREAM_API_KEY, STREAM_API_SECRET);
