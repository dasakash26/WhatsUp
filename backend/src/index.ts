import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import chatRoutes from "./modules/chat/chat.route.ts";
import messageRoutes from "./modules/message/message.route.ts";
import callRoutes from "./modules/call/index.ts";
import { getUserByEmail } from "./modules/user/user.controller.ts";
import { errorHandler } from "./middleware/error.moddleware.ts";
import clerkWebhookRouter from "./modules/user/clerk-webhook";
import { clerkMiddleware } from "@clerk/hono";
import { upgradeWebSocket, websocket } from "hono/bun";
import { getWebSocketHandlers } from "./lib/websocket";

export const app = new Hono()
  .use(cors(), logger(), clerkMiddleware())
  .get(
    "/ws",
    upgradeWebSocket(getWebSocketHandlers)
  )
  .route("/api/webhook/clerk", clerkWebhookRouter)
  .route("/api/chat", chatRoutes)
  .route("/api/message", messageRoutes)
  .route("/api", callRoutes)
  .get("/api/user", getUserByEmail)
  .get("/", (c) => {
    return c.text("WhatsUp backend is running");
  })
  .onError(errorHandler);

// app.get("/api/user/:userId", getUserFromId);

export type AppType = typeof app;

export default Object.assign(app, {
  port: 4001,
  websocket,
});
