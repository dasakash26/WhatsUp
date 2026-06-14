import { Hono } from "hono";
import {
  createChat,
  deleteChat,
  getChat,
  getChats,
  updateChat,
} from "./chat.controller";

const router = new Hono();

router.get("/", getChats);
router.post("/", createChat);
router.get("/:chatId", getChat);
router.put("/:chatId", updateChat);
router.delete("/:chatId", deleteChat);

export default router;
