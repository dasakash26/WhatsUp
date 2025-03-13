export type UserJwtPayload = {
  sub: string;
  name?: string;
  username?: string;
  preferred_username?: string;
  image_url?: string;
  picture?: string;
  [key: string]: any;
};

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string | null;
  imageUrl?: string;
  [key: string]: any;
}

// Message types
export type WebSocketMessageType =
  | "MESSAGE"
  | "NEW_MESSAGE"
  | "TYPING"
  | "READ_RECEIPT"
  | "ERROR"
  | "CONNECTION_ESTABLISHED"
  | "ONLINE_STATUS"
  | "REQUEST_ONLINE_STATUS";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  [key: string]: any;
}

export interface MessagePayload extends WebSocketMessage {
  conversationId: string;
  text: string;
}

export interface CompleteMessage extends WebSocketMessage {
  id: string;
  text: string;
  status: string;
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string | null;
  conversationId: string;
  createdAt: Date;
}

export interface TypingPayload extends WebSocketMessage {
  conversationId: string;
  isTyping: boolean;
  userId: string;
  timestamp: Date;
}

export interface ReadReceiptPayload extends WebSocketMessage {
  conversationId: string;
  messageId: string;
  userId: string;
  timestamp: Date;
}

// Cache related types
export type ConversationCache = {
  participants: string[];
  lastUpdated: Date;
};

// Status and notification types
export interface ErrorPayload extends WebSocketMessage {
  message: string;
  timestamp: Date;
}

export interface ConnectionEstablishedPayload extends WebSocketMessage {
  userId: string;
  timestamp: Date;
}

export interface OnlineStatusPayload extends WebSocketMessage {
  userId: string;
  isOnline: boolean;
  timestamp: Date;
  type: "ONLINE_STATUS";
}

// Message status enum for type safety
export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}
