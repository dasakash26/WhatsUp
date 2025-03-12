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

export type WebSocketMessageType =
  | "MESSAGE"
  | "NEW_MESSAGE"
  | "TYPING"
  | "READ_RECEIPT"
  | "ERROR"
  | "CONNECTION_ESTABLISHED"
  | "ONLINE_STATUS";

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

export enum MessageStatus {
  SENT = "SENT",
  DELIVERED = "DELIVERED",
  READ = "READ",
  FAILED = "FAILED",
}

export type Message = CompleteMessage;

export type TypingIndicator = {
  userId: string;
  conversationId: string;
  isTyping: boolean;
  lastTypingTime: Date;
};

export type Conversation = {
  id: string;
  name: string;
  participants: string[];
  lastMessage?: string;
  lastMessageTime?: Date;
  lastMessageSenderId?: string;
  lastMessageSenderName?: string;
  lastMessageSenderUsername?: string;
  lastMessageSenderAvatar?: string | null;
  messages: Message[];
  typingUsers?: string[];
  isOnline?: boolean;
};

export interface ChatContextType {
  messages: Message[];
  sendMessage: (conversationId: string, text: string, Image?: File) => void;
  isConnected: boolean;
  connectionError: string | null;
  currentConversationId: string | null;
  setCurrentConversationId: (id: string | null) => void;
  conversations: Conversation[];
  activeChat: Conversation | null;
  loadConversations: () => Promise<void>;
  setTyping: (conversationId: string, isTyping: boolean) => void;
  typingIndicators: TypingIndicator[];
  onlineUsers: Set<string>;
  isUserOnline: (userId: string) => boolean;
}

export type ConversationAction =
  | { type: "SET_CONVERSATIONS"; payload: Conversation[] }
  | { type: "NEW_MESSAGE"; payload: { message: Message; userId?: string } }
  | {
      type: "UPDATE_TYPING";
      payload: { typingIndicators: TypingIndicator[]; currentUserId: string };
    }
  | { type: "UPDATE_ONLINE"; payload: { onlineUsers: Set<string> } }
  | {
      type: "UPDATE_LAST_MESSAGE";
      payload: { conversationId: string; message: Message };
    };
