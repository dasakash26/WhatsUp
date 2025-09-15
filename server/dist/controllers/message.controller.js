"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteConversationMessages = exports.deleteMessage = exports.updateMessage = exports.createMessage = exports.getConversationMessages = void 0;
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const prisma_1 = require("../lib/prisma");
const express_1 = require("@clerk/express");
// Get messages for a conversation
exports.getConversationMessages = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    if (!conversationId) {
        res.status(400).json({ error: "Conversation ID is required" });
        return;
    }
    const messages = yield prisma_1.prisma.message.findMany({
        where: {
            conversationId: conversationId,
        },
        orderBy: {
            createdAt: "asc",
        },
    });
    res.status(200).json({
        messages,
        length: messages.length,
    });
    return;
}));
// Create a new message
exports.createMessage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.auth.userId;
    const { conversationId } = req.params;
    const { text } = req.body;
    const image = req.file;
    if (!conversationId || (!text && !image)) {
        res.status(400).json({ error: "Conversation ID or content is required" });
        return;
    }
    const conversation = yield prisma_1.prisma.conversation.findUnique({
        where: {
            id: conversationId,
        },
    });
    if (!conversation) {
        res.status(404).json({ error: "Conversation not found" });
        return;
    }
    const sender = yield express_1.clerkClient.users.getUser(userId);
    console.log(sender);
    const imagePath = image ? image.path || image.filename : null;
    const message = yield prisma_1.prisma.message.create({
        data: {
            text,
            image: imagePath,
            senderId: userId,
            senderName: sender.fullName,
            senderUsername: sender.username,
            senderAvatar: sender.imageUrl,
            conversationId: conversationId,
        },
    });
    res.status(200).json(message);
    return;
}));
// Update a message
exports.updateMessage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    const { text, image, status } = req.body;
    if (!messageId) {
        res.status(400).json({ error: "Message ID is required" });
        return;
    }
    //conditionally update the message if not null
    const message = yield prisma_1.prisma.message.update({
        where: {
            id: messageId,
        },
        data: {
            text,
            image,
            status,
        },
    });
}));
// Delete a message
exports.deleteMessage = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { messageId } = req.params;
    if (!messageId) {
        res.status(400).json({ error: "Message ID is required" });
        return;
    }
    const message = yield prisma_1.prisma.message.delete({
        where: {
            id: messageId,
        },
    });
    res.status(200).json(message);
    return;
}));
//Delete all messages in a conversation
exports.deleteConversationMessages = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    //@ts-ignore
    const userId = req.auth.userId;
    const user = yield express_1.clerkClient.users.getUser(userId);
    if (!conversationId) {
        res.status(400).json({ error: "Conversation ID is required" });
        return;
    }
    const messages = yield prisma_1.prisma.message.deleteMany({
        where: {
            conversationId: conversationId,
        },
    });
    //system generated delete info message
    const message = yield prisma_1.prisma.message.create({
        data: {
            text: `All messages in this conversation have been deleted by ${user.firstName} ${user.lastName} (@${user.username})`,
            senderId: "system",
            senderName: "System",
            senderUsername: "System",
            senderAvatar: "https://png.pngtree.com/png-vector/20201224/ourmid/pngtree-future-intelligent-technology-robot-ai-png-image_2588803.jpg",
            conversationId: conversationId,
        },
    });
    res.status(200).json(message);
}));
