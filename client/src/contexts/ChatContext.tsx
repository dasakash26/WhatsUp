import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
  useReducer,
} from "react";
import { useAuth } from "@clerk/clerk-react";
import { api } from "@/lib/api";
import { useWebSocket } from "@/hooks/useWebSocket";
import {
  WebSocketMessage,
  MessagePayload,
  Message,
  TypingIndicator,
  Conversation,
  ChatContextType,
  ConversationAction,
} from "@/types/websocket.types";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

const conversationReducer = (
  state: Conversation[],
  action: ConversationAction
): Conversation[] => {
  switch (action.type) {
    case "SET_CONVERSATIONS":
      return action.payload;

    case "NEW_MESSAGE": {
      const { message } = action.payload;
      return state.map((conv) => {
        if (conv.id !== message.conversationId) return conv;

        const messageExists = conv.messages.some((m) => m.id === message.id);
        const updatedMessages = messageExists
          ? conv.messages.map((m) => (m.id === message.id ? message : m))
          : [...conv.messages, message];

        const isNewer =
          !conv.lastMessageTime ||
          new Date(message.createdAt) > new Date(conv.lastMessageTime);

        return {
          ...conv,
          messages: updatedMessages,
          ...(isNewer && {
            lastMessage: message.text,
            lastMessageTime: message.createdAt,
            lastMessageSenderId: message.senderId,
            lastMessageSenderName: message.senderName,
            lastMessageSenderUsername: message.senderUsername,
            lastMessageSenderAvatar: message.senderAvatar,
          }),
        };
      });
    }

    case "UPDATE_TYPING": {
      const { typingIndicators, currentUserId } = action.payload;
      return state.map((conversation) => {
        const typingUsersInConversation = typingIndicators
          .filter(
            (indicator) =>
              indicator.conversationId === conversation.id &&
              indicator.isTyping &&
              indicator.userId !== currentUserId
          )
          .map((indicator) => indicator.userId);

        return {
          ...conversation,
          typingUsers:
            typingUsersInConversation.length > 0
              ? typingUsersInConversation
              : undefined,
        };
      });
    }

    case "UPDATE_ONLINE": {
      const { onlineUsers } = action.payload;
      return state.map((conversation) => {
        const isAnyParticipantOnline = conversation.participants.some(
          (participantId) => onlineUsers.has(participantId)
        );

        return {
          ...conversation,
          isOnline: isAnyParticipantOnline,
        };
      });
    }

    case "UPDATE_LAST_MESSAGE": {
      const { conversationId, message } = action.payload;
      return state.map((conv) =>
        conv.id === conversationId
          ? {
              ...conv,
              lastMessage: message.text,
              lastMessageTime: message.createdAt,
              lastMessageSenderId: message.senderId,
              lastMessageSenderName: message.senderName,
              lastMessageSenderUsername: message.senderUsername,
              lastMessageSenderAvatar: message.senderAvatar,
            }
          : conv
      );
    }

    default:
      return state;
  }
};

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [conversations, dispatchConversations] = useReducer(
    conversationReducer,
    []
  );
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>(
    []
  );
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const previousOnlineUsersStringRef = useRef<string>("");
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const { userId, getToken } = useAuth();

  const activeChat = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId) || null
    : null;

  const handleWebSocketMessage = useCallback(
    (data: WebSocketMessage) => {
      if (!userId) return;

      if (data.type === "NEW_MESSAGE") {
        const messageDate = new Date(data.createdAt);
        const newMessage: Message = {
          id: data.id as string,
          text: data.text as string,
          status: "sent",
          senderId: data.senderId as string,
          senderName: data.senderName as string,
          senderUsername: data.senderUsername as string,
          senderAvatar: data.senderAvatar as string | null,
          conversationId: data.conversationId as string,
          createdAt: messageDate,
          type: "NEW_MESSAGE",
        };

        setMessages((prev) => {
          // Replace temp message or add new one
          const tempIndex = prev.findIndex(
            (msg) =>
              msg.id.startsWith("temp-") &&
              msg.conversationId === newMessage.conversationId &&
              msg.text === newMessage.text
          );

          if (tempIndex !== -1) {
            const updated = [...prev];
            updated[tempIndex] = newMessage;
            return updated;
          }

          return [...prev, newMessage];
        });

        // Update conversation with the new message
        dispatchConversations({
          type: "NEW_MESSAGE",
          payload: {
            message: newMessage,
            userId,
          },
        });
      } else if (data.type === "TYPING") {
        // Make sure we have required fields
        if (!data.userId || !data.conversationId) return;

        setTypingIndicators((prev) => {
          // Remove any existing indicator for this user+conversation
          const filtered = prev.filter(
            (indicator) =>
              !(
                indicator.userId === data.userId &&
                indicator.conversationId === data.conversationId
              )
          );

          // Only add if typing is true
          if (data.isTyping) {
            return [
              ...filtered,
              {
                userId: data.userId,
                conversationId: data.conversationId,
                isTyping: true,
                lastTypingTime: new Date(),
              },
            ];
          }

          return filtered;
        });

        // Clear typing indicator after 5 seconds of inactivity
        if (data.isTyping && data.userId !== userId) {
          const key = `${data.userId}-${data.conversationId}`;

          // Clear any existing timeout
          if (typingTimeoutRef.current[key]) {
            clearTimeout(typingTimeoutRef.current[key]);
          }

          // Set new timeout
          typingTimeoutRef.current[key] = setTimeout(() => {
            setTypingIndicators((prev) =>
              prev.filter(
                (indicator) =>
                  !(
                    indicator.userId === data.userId &&
                    indicator.conversationId === data.conversationId
                  )
              )
            );
          }, 5000);
        }
      } else if (data.type === "ONLINE_STATUS") {
        const isAlreadyInCorrectState = data.isOnline
          ? onlineUsers.has(data.userId)
          : !onlineUsers.has(data.userId);

        if (isAlreadyInCorrectState) {
          return;
        }

        setOnlineUsers((prev) => {
          const newSet = new Set(prev);
          if (data.isOnline) {
            newSet.add(data.userId);
          } else {
            newSet.delete(data.userId);
          }
          return newSet;
        });
      }
    },
    [userId, onlineUsers]
  );

  const {
    isConnected,
    connectionError,
    sendMessage: wsSendMessage,
  } = useWebSocket({
    onMessage: handleWebSocketMessage,
  });

  useEffect(() => {
    if (!userId) return;

    dispatchConversations({
      type: "UPDATE_TYPING",
      payload: { typingIndicators, currentUserId: userId },
    });
  }, [typingIndicators, userId]);

  useEffect(() => {
    const currentOnlineUsersString = Array.from(onlineUsers).sort().join(",");

    if (currentOnlineUsersString !== previousOnlineUsersStringRef.current) {
      previousOnlineUsersStringRef.current = currentOnlineUsersString;

      dispatchConversations({
        type: "UPDATE_ONLINE",
        payload: { onlineUsers },
      });
    }
  }, [onlineUsers]);

  useEffect(() => {
    if (currentConversationId) {
      const conversation = conversations.find(
        (conv) => conv.id === currentConversationId
      );
      if (conversation) {
        setMessages(conversation.messages);
      }
    } else {
      setMessages([]);
    }
  }, [currentConversationId, conversations]);

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    try {
      const token = await getToken();
      if (!token) {
        console.error("No authentication token available");
        return;
      }

      const res = await api.get("/conversation", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = res.data;

      if (!data) {
        console.error("No data returned from API");
        return;
      }

      const processedChats = data.map((chat: any) => ({
        ...chat,
        messages: chat.messages || [],
        online: chat.online || false,
        unreadCount: chat.unreadCount || 0,
        lastMessage: chat.lastMessage || "",
        lastMessageSenderName: chat.lastMessageSenderName || "",
        lastMessageSenderUsername: chat.lastMessageSenderUsername || "",
        lastMessageSenderAvatar: chat.lastMessageSenderAvatar || null,
        lastMessageTime: chat.lastMessageTime
          ? new Date(chat.lastMessageTime)
          : undefined,
      }));

      dispatchConversations({
        type: "SET_CONVERSATIONS",
        payload: processedChats,
      });
    } catch (error) {
      console.error("Error loading conversations:", error);
    }
  }, [getToken, userId]);

  useEffect(() => {
    if (userId) {
      loadConversations();
    }
  }, [userId, loadConversations]);

  useEffect(() => {
    return () => {
      Object.values(typingTimeoutRef.current).forEach((timeout) => {
        clearTimeout(timeout);
      });
    };
  }, []);

  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!userId) return;

      // Update local state immediately for faster UI feedback
      if (isTyping) {
        setTypingIndicators((prev) => {
          const filtered = prev.filter(
            (i) => !(i.userId === userId && i.conversationId === conversationId)
          );
          return [
            ...filtered,
            {
              userId,
              conversationId,
              isTyping: true,
              lastTypingTime: new Date(),
            },
          ];
        });
      } else {
        setTypingIndicators((prev) =>
          prev.filter(
            (i) => !(i.userId === userId && i.conversationId === conversationId)
          )
        );
      }

      wsSendMessage({
        type: "TYPING",
        conversationId,
        isTyping,
        userId,
        timestamp: new Date().toISOString(),
      });
    },
    [wsSendMessage, userId]
  );

  const sendMessage = useCallback(
    (conversationId: string, text: string, Image?: File) => {
      if (!userId || (!text && !Image)) return;

      setTyping(conversationId, false);

      const message: MessagePayload = {
        type: "MESSAGE",
        conversationId,
        text,
        Image,
      };

      wsSendMessage(message);
    },
    [setTyping, userId, wsSendMessage]
  );

  const isUserOnline = useCallback(
    (userId: string) => {
      return onlineUsers.has(userId);
    },
    [onlineUsers]
  );

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        isConnected,
        connectionError,
        currentConversationId,
        setCurrentConversationId,
        conversations,
        activeChat,
        loadConversations,
        setTyping,
        typingIndicators,
        onlineUsers,
        isUserOnline,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
};
