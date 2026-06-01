import { Router } from "express";
import {
  clearChatMessages,
  editMessage,
  listMessages,
  removeMessage,
  sendMessage,
} from "./message.controller";
import { upload } from "../../middleware/multer.middleware";

const router = Router();

router.get("/:chatId", listMessages);
router.post("/:chatId", upload.single("image"), sendMessage);
router.patch("/:messageId", upload.single("image"), editMessage);
router.delete("/:messageId", removeMessage);
router.delete("/:chatId/all", clearChatMessages);

export default router;
