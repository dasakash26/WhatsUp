export type UserJwtPayload = {
  sub: string;
  name?: string;
  username?: string;
  preferred_username?: string;
  image_url?: string;
  picture?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

export interface User {
  id: string;
  firstName?: string;
  lastName?: string;
  username?: string | null;
  imageUrl?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  | "SYSTEM_MESSAGE"
  | "VIDEO_CALL_START";

export interface WebSocketMessage {
  type: WebSocketMessageType;
  senderId?: string;
  userId?: string;
  conversationId?: string;
  timestamp?: string;
  // Allow additional properties
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface IncomingMessage extends WebSocketMessage {
  type: "MESSAGE";
  conversationId: string;
  text?: string;
  image?: string;
  id?: string;
  senderId?: string;
  senderName?: string;
  senderUsername?: string;
  senderAvatar?: string | null;
  createdAt?: string;
  tempMessageId?: string;
  imageUrl?: string;
}

export interface MessagePayload extends WebSocketMessage {
  type: "MESSAGE";
  conversationId: string;
  text: string;
  image?: string;
}

export interface CompleteMessage extends WebSocketMessage {
  id: string;
  text: string;
  status: "PENDING"|"SENT" | "DELIVERED" | "READ" | "FAILED" | "SYSTEM";
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
  type: "TYPING";
  conversationId: string;
  isTyping: boolean;
  userId: string;
  timestamp: string;
}

export interface ReadReceiptPayload extends WebSocketMessage {
  type: "READ_RECEIPT";
  conversationId: string;
  messageId?: string; // Single message ID (deprecated, use messageIds)
  messageIds?: string[]; // Batch message IDs
  userId: string;
  timestamp: string;
}

export type ConversationCache = {
  participants: string[];
  lastUpdated: Date;
};

export interface ErrorPayload extends WebSocketMessage {
  type: "ERROR";
  message: string;
  timestamp: string;
}

export interface ConnectionEstablishedPayload extends WebSocketMessage {
  type: "CONNECTION_ESTABLISHED";
  userId: string;
  timestamp: string;
}

export interface OnlineStatusPayload extends WebSocketMessage {
  type: "ONLINE_STATUS";
  userId: string;
  isOnline: boolean;
  timestamp: string;
}

export enum MessageStatus {
  SENDING = "SENDING",
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
  isGroup?: boolean;
};

// Type for conversation data from API (before processing)
export interface ApiConversationData {
  id: string;
  name: string;
  participants: string[];
  messages?: Message[];
  online?: boolean;
  unreadCount?: number;
  lastMessage?: string;
  lastMessageSenderName?: string;
  lastMessageSenderUsername?: string;
  lastMessageSenderAvatar?: string | null;
  lastMessageTime?: string | Date;
  isGroup?: boolean;
}

export interface ChatContextType {
  messages: Message[];
  sendMessage: (conversationId: string, text: string, Image?: File) => void;
  sendReadReceipt: (conversationId: string, messageIds: string | string[]) => void;
  notifyVideoCallStart: (conversationId: string) => void;
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

export interface OutGoingMessage{
  type: "MESSAGE" | "TYPING" | "READ_RECEIPT" | "REQUEST_ONLINE_STATUS" | "VIDEO_CALL_START";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

export interface OutGoingChatMessage extends OutGoingMessage{
  conversationId: string;
  text: string;
  image?: string;
}