"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const conversation_controller_1 = require("../controllers/conversation.controller");
const router = (0, express_1.Router)();
// Message routes
router.get("/", conversation_controller_1.getConversations);
router.post("/", conversation_controller_1.createConversation);
router.get("/:conversationId", conversation_controller_1.getConversation);
router.put("/:conversationId", conversation_controller_1.updateConversation);
router.delete("/:conversationId", conversation_controller_1.deleteConversation);
exports.default = router;
