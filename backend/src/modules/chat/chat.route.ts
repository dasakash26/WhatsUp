import { Hono } from "hono";
import {
  createChat,
  deleteChat,
  getChat,
  getChats,
  updateChat,
} from "./chat.controller";

const router = new Hono()
  .get("/", getChats)
  .post("/", createChat)
  .get("/:chatId", getChat)
  .put("/:chatId", updateChat)
  .delete("/:chatId", deleteChat);

export default router;
