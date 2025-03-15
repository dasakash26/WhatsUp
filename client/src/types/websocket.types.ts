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
  | "ONLINE_STATUS"
  | "REQUEST_ONLINE_STATUS"
  | "SYSTEM_MESSAGE";

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
  status: "sent" | "delivered" | "read" | "failed" | "system";
  senderId: string;
  senderName: string;
  senderUsername: string;
  senderAvatar: string | null;
  conversationId: string;
  createdAt: Date;
  tempMessageId?: string;
  image?: string;
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

export type ConversationCache = {
  participants: string[];
  lastUpdated: Date;
};

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
  refreshOnlineStatus?: () => void;
  fetchUser: (id: string) => Promise<User | null>;
  getUserFromId: (id: string) => Promise<User | null>;
  users: User[];
  reloadChats: () => Promise<void>;
  isLoading: boolean;
  isImageUploading: boolean;
}

export interface ConversationAction {
  type:
    | "SET_CONVERSATIONS"
    | "NEW_MESSAGE"
    | "UPDATE_TYPING"
    | "UPDATE_ONLINE"
    | "UPDATE_LAST_MESSAGE";
  payload: {
    message: Message;
    userId?: string;
  };
}
