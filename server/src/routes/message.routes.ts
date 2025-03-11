import { Router } from "express";
import {
  createMessage,
  deleteMessage,
  getConversationMessages,
  updateMessage,
} from "../controllers/message.controller";

const router = Router();

// Message routes
router.get("/:conversationId", getConversationMessages);
router.post("/:conversationId", createMessage);
router.post("/:messageId", updateMessage);
router.delete("/:messageId", deleteMessage);

export default router;
