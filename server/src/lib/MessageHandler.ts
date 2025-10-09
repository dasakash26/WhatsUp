import { prisma } from "./prisma";
import { User } from "./User";
import { broadcastInConv } from "./websocket";
import { WebSocketMessage, IncomingMessage } from "./websocket.types";

export class MessageHandler {
  static async handleMessage(sender: User, message: any) {
    const data = JSON.parse(message.toString()) as WebSocketMessage;
    // console.log("Received data:", data);
    switch (data.type) {
      case "MESSAGE":
        this.handleChatMessage(sender, data as IncomingMessage);
        break;
      case "TYPING":
        this.handleTypingIndicator(data);
        break;
      case "READ_RECEIPT":
        this.handleReadReceipt(data);
        break;
      case "REQUEST_ONLINE_STATUS":
        this.handleOnlineStatusRequest(data);
        break;
      default:
        console.warn(`Unknown message type: ${data.type}`);
    }
  }

  static async handleChatMessage(sender: User, payload: IncomingMessage) {
    const { conversationId, text, image } = payload;
    if (!conversationId) {
      console.error("conversationId is required for chat message");
      return;
    }

    let msg;
    msg = await prisma.message.create({
      data: {
        text: text || "",
        image,
        senderId: sender.id,
        senderName: sender.firstName + " " + sender.lastName,
        senderUsername: sender.username,
        senderAvatar: sender.imageUrl,
        conversationId,
      },
    });
    msg = { type: "MESSAGE", ...msg };
    await broadcastInConv(conversationId, msg);
}

  static handleTypingIndicator(message: any) {
    console.log("Handling typing indicator:", message);
    broadcastInConv(message.conversationId, message);
  }

  static async handleReadReceipt(message: any) {
    console.log("Handling read receipt:", message);
    const { conversationId, messageId, messageIds, userId } = message;
    
    if (!conversationId || !userId) {
      console.error("Missing required fields for read receipt");
      return;
    }

    // Support both single messageId and batch messageIds
    const idsToUpdate = messageIds && messageIds.length > 0 
      ? messageIds 
      : (messageId ? [messageId] : []);

    if (idsToUpdate.length === 0) {
      console.error("No message IDs provided for read receipt");
      return;
    }

    try {
      // Update all messages to READ in a single batch operation
      await prisma.message.updateMany({
        where: { 
          id: { in: idsToUpdate },
          conversationId: conversationId
        },
        data: { status: "READ" },
      });

      // Broadcast a single read receipt for all messages
      const readReceiptPayload = {
        type: "READ_RECEIPT",
        conversationId,
        messageIds: idsToUpdate,
        userId,
        timestamp: new Date(),
      };
      
      await broadcastInConv(conversationId, readReceiptPayload);
    } catch (error) {
      console.error("Error handling read receipt:", error);
    }
  }

  static handleOnlineStatusRequest(message: any) {
    console.log("Handling online status request:", message);
  }

  static handleError(error: any) {
    console.error("Handling error:", error);
  }
}
