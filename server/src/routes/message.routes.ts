import { Router } from "express";
import {
  createMessage,
  deleteConversationMessages,
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
router.delete("/:conversationId/all", deleteConversationMessages);

export default router;
