import { Router } from "express";
import {
  createMessage,
  deleteConversationMessages,
  deleteMessage,
  getConversationMessages,
  updateMessage,
} from "../controllers/message.controller";
import { upload } from "@/middleware/multer.middleware";

const router = Router();

// Message routes
router.post("/image", upload.single("image"), (req, res) => {
  res.json(req.file?.path);
  console.log("Image uploaded successfully", req.file?.path);
});

router.get("/:conversationId", getConversationMessages);
router.post("/:conversationId", upload.single("image"), createMessage);
router.post("/:messageId", updateMessage);
router.delete("/:messageId", deleteMessage);
router.delete("/:conversationId/all", deleteConversationMessages);

export default router;
