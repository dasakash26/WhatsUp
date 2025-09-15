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
exports.deleteConversation = exports.updateConversation = exports.createConversation = exports.getConversation = exports.getConversations = void 0;
const prisma_1 = require("../lib/prisma");
const express_async_handler_1 = __importDefault(require("express-async-handler"));
const express_1 = require("@clerk/express");
exports.getConversations = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    //@ts-ignore
    const userId = req.auth.userId;
    const conversations = yield prisma_1.prisma.conversation.findMany({
        where: {
            participants: {
                has: userId,
            },
        },
        include: {
            messages: true,
        },
    });
    for (const conversation of conversations) {
        if (conversation.isGroup === false) {
            const otherParticipant = userId === conversation.participants[0]
                ? conversation.participants[1]
                : conversation.participants[0];
            const userData = yield express_1.clerkClient.users.getUser(otherParticipant);
            conversation.name = userData.firstName
                ? `${userData.firstName} ${userData.lastName}`
                : userData.username;
        }
    }
    for (const conversation of conversations) {
        const extendedConv = conversation;
        if (conversation.messages.length > 0) {
            const _messages = conversation.messages.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
            const lastMessage = _messages[_messages.length - 1];
            extendedConv.lastMessage = lastMessage.text;
            extendedConv.lastMessageTime = new Date(lastMessage.createdAt);
            extendedConv.lastMessageSenderId = lastMessage.senderId;
            // Add sender information for the last message
            if (lastMessage.senderId && lastMessage.senderId !== "system") {
                try {
                    const senderData = yield express_1.clerkClient.users.getUser(lastMessage.senderId);
                    extendedConv.lastMessageSenderName =
                        senderData.firstName && senderData.lastName
                            ? `${senderData.firstName} ${senderData.lastName}`
                            : null;
                    extendedConv.lastMessageSenderUsername =
                        senderData.username || null;
                    extendedConv.lastMessageSenderAvatar = senderData.imageUrl || null;
                }
                catch (error) {
                    console.error(`Error fetching sender data for ID ${lastMessage.senderId}:`, error);
                    extendedConv.lastMessageSenderName = null;
                    extendedConv.lastMessageSenderUsername = null;
                    extendedConv.lastMessageSenderAvatar = null;
                }
            }
        }
        else {
            extendedConv.lastMessage = null;
            extendedConv.lastMessageTime = null;
            extendedConv.lastMessageSenderId = null;
            extendedConv.lastMessageSenderName = null;
            extendedConv.lastMessageSenderUsername = null;
            extendedConv.lastMessageSenderAvatar = null;
        }
    }
    res.status(200).json(conversations);
    return;
}));
exports.getConversation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    if (!conversationId) {
        res.status(400).json({ error: "Conversation ID is required" });
        return;
    }
    const conversation = yield prisma_1.prisma.conversation.findUnique({
        where: {
            id: conversationId,
        },
    });
    res.status(200).json(conversation);
    return;
}));
// Create a new conversation
exports.createConversation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    //@ts-ignore
    const userId = req.auth.userId;
    const { name, participants } = req.body;
    if (!participants || participants.length === 0) {
        throw new Error("Participants are required");
    }
    participants.filter((participant) => participant !== userId);
    const users = yield express_1.clerkClient.users.getUserList({
        username: participants,
    });
    const participantIds = users.data.map((user) => user.id);
    if (participantIds.length !== participants.length) {
        throw new Error("One or more usernames were not found");
    }
    if (participantIds.length === 1) {
        // Create direct message conversation
        const existingConversation = yield prisma_1.prisma.conversation.findFirst({
            where: {
                isGroup: false,
                participants: {
                    hasEvery: [userId, participantIds[0]],
                },
            },
        });
        if (existingConversation) {
            res.status(200).json(existingConversation);
            return;
        }
        // Get the other user's details
        const otherUser = yield express_1.clerkClient.users.getUser(participantIds[0]);
        const otherUserName = otherUser.firstName
            ? `${otherUser.firstName} ${otherUser.lastName || ""}`
            : otherUser.username || "Unknown User";
        const newConversation = yield prisma_1.prisma.conversation.create({
            data: {
                name: name ||
                    `Direct message ${
                    //@ts-ignore
                    ((_a = req.auth) === null || _a === void 0 ? void 0 : _a.username) || req.auth.userId} - ${otherUserName}`,
                isGroup: false,
                participants: [userId, participantIds[0]],
            },
        });
        res.status(201).json(newConversation);
        return;
    }
    else {
        // Create group conversation
        const newConversation = yield prisma_1.prisma.conversation.create({
            data: {
                name: name || "Group chat",
                isGroup: true,
                participants: [userId, ...participantIds],
            },
        });
        res.status(201).json(newConversation);
        return;
    }
}));
// Update a conversation
exports.updateConversation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    const { name } = req.body;
    if (!conversationId) {
        res.status(400).json({ error: "Conversation ID is required" });
        return;
    }
    const conversation = yield prisma_1.prisma.conversation.update({
        where: {
            id: conversationId,
        },
        data: {
            name,
        },
    });
    res.status(200).json(conversation);
    return;
}));
// Delete a conversation
exports.deleteConversation = (0, express_async_handler_1.default)((req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const { conversationId } = req.params;
    if (!conversationId) {
        res.status(400).json({ error: "Conversation ID is required" });
        return;
    }
    yield prisma_1.prisma.conversation.delete({
        where: {
            id: conversationId,
        },
    });
    res.status(204).send();
    return;
}));
