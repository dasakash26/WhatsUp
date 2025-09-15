"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const message_controller_1 = require("../controllers/message.controller");
const multer_middleware_1 = require("../middleware/multer.middleware");
const router = (0, express_1.Router)();
// Message routes
router.post("/image", multer_middleware_1.upload.single("image"), (req, res) => {
    var _a, _b;
    res.json((_a = req.file) === null || _a === void 0 ? void 0 : _a.path);
    console.log("Image uploaded successfully", (_b = req.file) === null || _b === void 0 ? void 0 : _b.path);
});
router.get("/:conversationId", message_controller_1.getConversationMessages);
router.post("/:conversationId", multer_middleware_1.upload.single("image"), message_controller_1.createMessage);
router.post("/:messageId", message_controller_1.updateMessage);
router.delete("/:messageId", message_controller_1.deleteMessage);
router.delete("/:conversationId/all", message_controller_1.deleteConversationMessages);
exports.default = router;
