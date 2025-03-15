import express from "express";
import cors from "cors";
import http, { get } from "http";
import conversationRoutes from "./routes/conversation.routes";
import messageRoutes from "./routes/message.routes";
import { PORT } from "./utils/secrets";
import { requireAuth } from "@clerk/express";
import createWebSocketServer from "./lib/websocket";
import { getUserFromId } from "./controllers/user.controller";

const app = express();
const server = http.createServer(app);

createWebSocketServer(server);

app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "https://whatsup-chat.onrender.com",
      "http://localhost:4173",
      "ws://whatsup-chat.onrender.com",
      "wss://whatsup-chat.onrender.com",
    ],
    credentials: true,
  })
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api/conversation", requireAuth(), conversationRoutes);
app.use("/api/message", requireAuth(), messageRoutes);
app.get("/api/user/:userId", requireAuth(), getUserFromId);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

server.listen(PORT, () => {
  console.log(`> Server running on port ${PORT}`);
});
