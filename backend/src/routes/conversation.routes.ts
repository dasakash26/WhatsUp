import { Router } from "express";
import {
  createConversation,
  deleteConversation,
  getConversation,
  getConversations,
  updateConversation,
} from "../controllers/conversation.controller";

const router = Router();

// Message routes
router.get("/", getConversations);
router.post("/", createConversation);
router.get("/:conversationId", getConversation);
router.put("/:conversationId", updateConversation);
router.delete("/:conversationId", deleteConversation);

export default router;
