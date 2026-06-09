import { Router } from "express";
import {
  createChat,
  deleteChat,
  getChat,
  getChats,
  updateChat,
} from "./chat.controller";

const router = Router();

router.get("/", getChats);
router.post("/", createChat);
router.get("/:chatId", getChat);
router.put("/:chatId", updateChat);
router.delete("/:chatId", deleteChat);

export default router;
