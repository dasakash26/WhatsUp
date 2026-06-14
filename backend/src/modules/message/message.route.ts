import { Hono } from "hono";
import {
  clearChatMessages,
  editMessage,
  listMessages,
  removeMessage,
  sendMessage,
} from "./message.controller";

const router = new Hono();

router.get("/:chatId", listMessages);
router.post("/:chatId", sendMessage);
router.patch("/:messageId", editMessage);
router.delete("/:messageId", removeMessage);
router.delete("/:chatId/all", clearChatMessages);

export default router;
