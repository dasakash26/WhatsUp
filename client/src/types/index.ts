export interface Message {
  id: string | number;
  text: string;
  senderId: string;
  senderName?: string | null;
  senderUsername?: string | null;
  senderAvatar?: string | null;
  createdAt?: string;
  status?: "SENT" | "DELIVERED" | "READ" | "sent" | "delivered" | "read";
  image?: string | null;
  conversationId?: string;
}

export interface Chat {
  id: string | number;
  name: string;
  isGroup: boolean;
  online: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  lastMessageSenderId?: string;
  unreadCount?: number;
  messages?: Message[];
  participants?: string[];
}
