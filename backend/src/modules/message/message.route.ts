import { Hono } from "hono";
import {
  clearChatMessages,
  editMessage,
  listMessages,
  removeMessage,
  sendMessage,
} from "./message.controller";

const router = new Hono()
  .get("/:chatId", listMessages)
  .post("/:chatId", sendMessage)
  .patch("/:messageId", editMessage)
  .delete("/:messageId", removeMessage)
  .delete("/:chatId/all", clearChatMessages);

export default router;
