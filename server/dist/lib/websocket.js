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
exports.default = createWebSocketServer;
const ws_1 = require("ws");
const prisma_1 = require("./prisma");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const secrets_1 = require("../utils/secrets");
const express_1 = require("@clerk/express");
function authenticateUser(token) {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const decodedToken = jsonwebtoken_1.default.verify(token, secrets_1.CLERK_PEM_PUBLIC_KEY, {
                algorithms: ["RS256"],
            });
            if (!decodedToken.sub) {
                console.error("Invalid token: missing subject");
                return null;
            }
            const userDetails = yield express_1.clerkClient.users.getUser(decodedToken.sub);
            return {
                id: userDetails.id,
                firstName: userDetails.firstName || "Unknown",
                lastName: userDetails.lastName || "",
                username: userDetails.username,
                imageUrl: userDetails.imageUrl,
            };
        }
        catch (error) {
            console.error("Token verification failed:", error);
            return null;
        }
    });
}
function createWebSocketServer(server) {
    const wss = new ws_1.WebSocketServer({
        server,
        clientTracking: true,
        perMessageDeflate: {
            zlibDeflateOptions: {
                chunkSize: 1024,
                memLevel: 7,
                level: 3,
            },
            zlibInflateOptions: {
                chunkSize: 10 * 1024,
            },
            concurrencyLimit: 10,
            threshold: 1024,
        },
    });
    const clients = new Map();
    const onlineUsers = new Set();
    const conversationCache = new Map();
    const CACHE_TTL = 5 * 60 * 1000;
    const ONLINE_STATUS_CHECK_INTERVAL = 60 * 1000; // 20 seconds
    function cacheConversation(conversationId) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                const conversation = yield prisma_1.prisma.conversation.findUnique({
                    where: { id: conversationId },
                });
                if (!conversation) {
                    return false;
                }
                conversationCache.set(conversationId, {
                    participants: conversation.participants,
                    lastUpdated: new Date(),
                });
                return true;
            }
            catch (error) {
                console.error("Error caching conversation:", error);
                return false;
            }
        });
    }
    function isValidCache(cached) {
        const now = new Date();
        return now.getTime() - cached.lastUpdated.getTime() < CACHE_TTL;
    }
    function cacheUserConversations(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Attempting to cache conversations for user ${userId}`);
            try {
                const userConversations = yield prisma_1.prisma.conversation.findMany({
                    where: {
                        participants: {
                            hasSome: [userId],
                        },
                    },
                });
                userConversations.forEach((conversation) => {
                    conversationCache.set(conversation.id, {
                        participants: conversation.participants,
                        lastUpdated: new Date(),
                    });
                });
                console.log(`Cached ${userConversations.length} conversations for user ${userId}`);
            }
            catch (error) {
                console.error(`Error caching conversations for user ${userId}:`, error);
            }
        });
    }
    function broadcastToAllClients(data) {
        console.log(`Broadcasting to all clients: ${data.type || "unknown type"}`);
        clients.forEach((ws) => {
            if (ws.readyState === ws_1.WebSocket.OPEN) {
                ws.send(JSON.stringify(data));
            }
        });
    }
    function broadcastToConversationParticipants(conversationId, message) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log(`Broadcasting ${message.type || "message"} to conversation ${conversationId}`);
            try {
                let cachedConversation = conversationCache.get(conversationId);
                if (!cachedConversation || !isValidCache(cachedConversation)) {
                    console.log(`Cache miss for conversation ${conversationId}, refreshing cache`);
                    const success = yield cacheConversation(conversationId);
                    if (!success) {
                        console.error(`Conversation ${conversationId} not found`);
                        return;
                    }
                    cachedConversation = conversationCache.get(conversationId);
                }
                else {
                    console.log(`Cache hit for conversation ${conversationId}`);
                }
                let sentCount = 0;
                cachedConversation === null || cachedConversation === void 0 ? void 0 : cachedConversation.participants.forEach((participantId) => {
                    const client = clients.get(participantId);
                    if (client && client.readyState === ws_1.WebSocket.OPEN) {
                        client.send(JSON.stringify(message));
                        sentCount++;
                    }
                });
                console.log(`Message sent to ${sentCount}/${(cachedConversation === null || cachedConversation === void 0 ? void 0 : cachedConversation.participants.length) || 0} participants in conversation ${conversationId}`);
            }
            catch (error) {
                console.error("Error broadcasting to conversation:", error);
            }
        });
    }
    function handleIncomingMessage(userId, userData, data) {
        return __awaiter(this, void 0, void 0, function* () {
            const { conversationId, text, image } = data;
            try {
                const username = userData.username || userData.preferred_username;
                const name = userData.name || username;
                const avatarUrl = userData.image_url || userData.picture;
                const newMessage = yield prisma_1.prisma.message.create({
                    data: {
                        text,
                        image: image || null,
                        senderId: userId,
                        senderName: name,
                        senderUsername: username,
                        senderAvatar: avatarUrl,
                        conversationId,
                        status: "SENT",
                    },
                });
                const completeMessage = {
                    type: "NEW_MESSAGE",
                    id: newMessage.id,
                    text: newMessage.text,
                    imageUrl: newMessage.image,
                    status: newMessage.status,
                    senderId: userId,
                    senderName: newMessage.senderName || "",
                    senderUsername: newMessage.senderUsername || "",
                    senderAvatar: newMessage.senderAvatar,
                    conversationId,
                    createdAt: newMessage.createdAt,
                };
                yield broadcastToConversationParticipants(conversationId, completeMessage);
            }
            catch (error) {
                console.error(`Error handling message from user ${userId}:`, error);
            }
        });
    }
    function handleTyping(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if ("conversationId" in data) {
                const typingPayload = {
                    type: "TYPING",
                    userId,
                    conversationId: data.conversationId,
                    isTyping: data.isTyping === true,
                    timestamp: new Date(),
                };
                console.log(`User ${userId} typing status in conversation ${data.conversationId}: ${data.isTyping}`);
                yield broadcastToConversationParticipants(data.conversationId, typingPayload);
            }
            else {
                console.warn("Missing conversationId in TYPING message");
            }
        });
    }
    function handleReadReceipt(userId, data) {
        return __awaiter(this, void 0, void 0, function* () {
            if ("conversationId" in data && "messageId" in data) {
                try {
                    yield prisma_1.prisma.message.update({
                        where: { id: data.messageId },
                        data: { status: "READ" },
                    });
                    const readReceiptPayload = {
                        type: "READ_RECEIPT",
                        userId,
                        conversationId: data.conversationId,
                        messageId: data.messageId,
                        timestamp: new Date(),
                    };
                    yield broadcastToConversationParticipants(data.conversationId, readReceiptPayload);
                }
                catch (err) {
                    console.error("Error processing read receipt:", err);
                }
            }
            else {
                console.warn("Invalid READ_RECEIPT message format");
            }
        });
    }
    function broadcastOnlineStatus(userId, isOnline) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                // Find all conversations this user participates in
                const userConversations = yield prisma_1.prisma.conversation.findMany({
                    where: {
                        participants: {
                            hasSome: [userId],
                        },
                    },
                    select: {
                        id: true,
                        participants: true,
                    },
                });
                const onlineStatusPayload = {
                    type: "ONLINE_STATUS",
                    userId,
                    isOnline,
                    timestamp: new Date(),
                };
                // Broadcast to all participants in all conversations
                for (const conversation of userConversations) {
                    yield broadcastToConversationParticipants(conversation.id, onlineStatusPayload);
                }
                console.log(`Broadcast online status for user ${userId}: ${isOnline}`);
            }
            catch (error) {
                console.error("Error broadcasting online status:", error);
            }
        });
    }
    // Send current online users to the specified client
    function sendOnlineUsersToClient(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            const client = clients.get(userId);
            if (!client || client.readyState !== ws_1.WebSocket.OPEN)
                return;
            try {
                // Get all conversations for this user
                const userConversations = yield prisma_1.prisma.conversation.findMany({
                    where: {
                        participants: {
                            hasSome: [userId],
                        },
                    },
                    select: {
                        id: true,
                        participants: true,
                    },
                });
                // Collect all unique participants from all conversations
                const allParticipants = new Set();
                userConversations.forEach((conv) => {
                    conv.participants.forEach((p) => {
                        if (p !== userId) {
                            allParticipants.add(p);
                        }
                    });
                });
                let sentStatusCount = 0;
                // For each online participant, send their status
                for (const participantId of allParticipants) {
                    if (onlineUsers.has(participantId)) {
                        const onlineStatusPayload = {
                            type: "ONLINE_STATUS",
                            userId: participantId,
                            isOnline: true,
                            timestamp: new Date(),
                        };
                        client.send(JSON.stringify(onlineStatusPayload));
                        sentStatusCount++;
                    }
                }
                console.log(`Sent ${sentStatusCount} online users to client ${userId}`);
            }
            catch (error) {
                console.error(`Error sending online users to client ${userId}:`, error);
            }
        });
    }
    function handleRequestOnlineUsers(userId) {
        return __awaiter(this, void 0, void 0, function* () {
            yield sendOnlineUsersToClient(userId);
        });
    }
    wss.on("connection", (ws, req) => __awaiter(this, void 0, void 0, function* () {
        var _a;
        const url = new URL((_a = req.url) !== null && _a !== void 0 ? _a : "", `http://${req.headers.host}`);
        const clerkToken = url.searchParams.get("clerkToken");
        if (!clerkToken) {
            ws.close(4401, "No token provided");
            return;
        }
        try {
            const user = yield authenticateUser(clerkToken);
            if (!user) {
                ws.close(4403, "Authentication failed");
                return;
            }
            const userId = user.id;
            clients.set(String(userId), ws);
            onlineUsers.add(userId); // Mark user as online
            console.log("Client connected:", userId);
            yield cacheUserConversations(userId);
            yield broadcastOnlineStatus(userId, true); // Broadcast online status to others
            yield sendOnlineUsersToClient(userId); // Send online users to this client
            ws.on("message", (message) => __awaiter(this, void 0, void 0, function* () {
                try {
                    const data = JSON.parse(message.toString());
                    console.log("Received data:", data);
                    switch (data.type) {
                        case "MESSAGE":
                            yield handleIncomingMessage(userId, {
                                sub: user.id,
                                name: `${user.firstName} ${user.lastName}`.trim(),
                                username: user.username || undefined,
                                image_url: user.imageUrl,
                            }, data);
                            break;
                        case "TYPING":
                            yield handleTyping(userId, data);
                            break;
                        case "READ_RECEIPT":
                            yield handleReadReceipt(userId, data);
                            break;
                        case "REQUEST_ONLINE_STATUS":
                            yield handleRequestOnlineUsers(userId);
                            break;
                        default:
                            console.warn(`Unknown message type: ${data.type}`);
                    }
                }
                catch (err) {
                    console.error("Error parsing or handling message:", err);
                    const errorPayload = {
                        type: "ERROR",
                        message: "Failed to process your message",
                        timestamp: new Date(),
                    };
                    if (ws.readyState === ws_1.WebSocket.OPEN) {
                        ws.send(JSON.stringify(errorPayload));
                    }
                }
            }));
            // Send connection confirmation
            const connectionPayload = {
                type: "CONNECTION_ESTABLISHED",
                userId,
                timestamp: new Date(),
            };
            ws.send(JSON.stringify(connectionPayload));
            ws.on("error", (error) => {
                console.error(`WebSocket error for user ${userId}:`, error);
            });
            ws.on("close", (code, reason) => {
                clients.delete(String(userId));
                onlineUsers.delete(userId); // Mark user as offline
                broadcastOnlineStatus(userId, false).catch((err) => console.error("Error broadcasting offline status:", err));
                console.log(`Client disconnected: ${userId}, Code: ${code}, Reason: ${reason.toString()}`);
            });
        }
        catch (error) {
            console.error("Connection error:", error);
            ws.close(4500, "Internal server error");
        }
    }));
    setInterval(() => {
        const now = new Date().getTime();
        let removedCount = 0;
        for (const [id, cache] of conversationCache.entries()) {
            if (now - cache.lastUpdated.getTime() > CACHE_TTL) {
                conversationCache.delete(id);
                removedCount++;
            }
        }
        if (removedCount > 0) {
            console.log(`Cache cleanup: removed ${removedCount} stale conversation entries`);
        }
    }, CACHE_TTL);
    // Periodic online status check and broadcast
    setInterval(() => __awaiter(this, void 0, void 0, function* () {
        console.log(`Running scheduled online status check. Active users: ${onlineUsers.size}`);
        for (const userId of clients.keys()) {
            yield sendOnlineUsersToClient(userId);
        }
    }), ONLINE_STATUS_CHECK_INTERVAL);
}
