import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
  useCallback,
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
  User,
} from "@/types/websocket.types";

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const usersRef = useRef<User[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentConversationId, setCurrentConversationId] = useState<
    string | null
  >(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [typingIndicators, setTypingIndicators] = useState<TypingIndicator[]>(
    []
  );
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const typingTimeoutRef = useRef<Record<string, NodeJS.Timeout>>({});
  const typingThrottleRef = useRef<Record<string, number>>({});
  const { userId, getToken } = useAuth();

  const onlineStatusIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    console.log("Typing Indicators:", typingIndicators);
    console.log("Online Users:", Array.from(onlineUsers));
  }, [typingIndicators, onlineUsers]);

  async function fetchUser(id: string): Promise<User | null> {
    try {
      const res = await api.get(`/user/${id}`);
      usersRef.current = [...usersRef.current, res.data];
      return res.data as User;
    } catch (error) {
      console.error("Error getting user from id:", error);
      return null;
    }
  }

  async function getUserFromId(id: string): Promise<User | null> {
    try {
      const gotUser = usersRef.current.find((u) => u.id === id);
      if (gotUser) return gotUser;

      const fetchedUser = await fetchUser(id);
      return fetchedUser;
    } catch (error) {
      console.error("Error getting user from id:", error);
      return null;
    }
  }

  const activeChat = currentConversationId
    ? conversations.find((c) => c.id === currentConversationId) || null
    : null;

  const handleWebSocketMessage = useCallback(
    (data: WebSocketMessage) => {
      console.log("Received WebSocket message:", data);

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

        setConversations((prevConversations) =>
          prevConversations.map((conv) => {
            if (conv.id !== newMessage.conversationId) return conv;

            const messageExists = conv.messages.some(
              (m) => m.id === newMessage.id
            );
            const updatedMessages = messageExists
              ? conv.messages.map((m) =>
                  m.id === newMessage.id ? newMessage : m
                )
              : [...conv.messages, newMessage];

            const isNewer =
              !conv.lastMessageTime ||
              new Date(newMessage.createdAt) > new Date(conv.lastMessageTime);

            return {
              ...conv,
              messages: updatedMessages,
              ...(isNewer && {
                lastMessage: newMessage.text,
                lastMessageTime: newMessage.createdAt,
                lastMessageSenderId: newMessage.senderId,
                lastMessageSenderName: newMessage.senderName,
                lastMessageSenderUsername: newMessage.senderUsername,
                lastMessageSenderAvatar: newMessage.senderAvatar,
              }),
            };
          })
        );
      } else if (data.type === "TYPING") {
        if (!data.userId || !data.conversationId) return;

        setTypingIndicators((prev) => {
          const filtered = prev.filter(
            (indicator) =>
              !(
                indicator.userId === data.userId &&
                indicator.conversationId === data.conversationId
              )
          );

          return data.isTyping
            ? [
                ...filtered,
                {
                  userId: data.userId,
                  conversationId: data.conversationId,
                  isTyping: true,
                  lastTypingTime: new Date(),
                },
              ]
            : filtered;
        });

        if (data.isTyping && data.userId !== userId) {
          const key = `${data.userId}-${data.conversationId}`;

          if (typingTimeoutRef.current[key]) {
            clearTimeout(typingTimeoutRef.current[key]);
          }

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
        console.log("Received online status:", data);
        const receivedUserId = data.userId as string;
        const isOnline = !!data.isOnline;

        console.log(
          `Online status received: User ${receivedUserId} is ${
            isOnline ? "online" : "offline"
          }`
        );

        setOnlineUsers((prev) => {
          const newSet = new Set(prev);

          if (isOnline) {
            if (!newSet.has(receivedUserId)) {
              console.log(`Adding ${receivedUserId} to online users`);
              newSet.add(receivedUserId);
            }
          } else {
            if (newSet.has(receivedUserId)) {
              console.log(`Removing ${receivedUserId} from online users`);
              newSet.delete(receivedUserId);
            }
          }

          return newSet;
        });
      }
    },
    [userId]
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

    setConversations((prevConversations) =>
      prevConversations.map((conversation) => {
        const typingUsersInConversation = typingIndicators
          .filter(
            (indicator) =>
              indicator.conversationId === conversation.id &&
              indicator.isTyping &&
              indicator.userId !== userId
          )
          .map((indicator) => indicator.userId);

        return {
          ...conversation,
          typingUsers:
            typingUsersInConversation.length > 0
              ? typingUsersInConversation
              : undefined,
        };
      })
    );
  }, [typingIndicators, userId]);

  useEffect(() => {
    setConversations((prevConversations) => {
      const needsUpdate = prevConversations.some((conversation) => {
        const shouldBeOnline = conversation.participants.some((participantId) =>
          onlineUsers.has(participantId)
        );
        return conversation.isOnline !== shouldBeOnline;
      });

      if (!needsUpdate) {
        return prevConversations;
      }

      return prevConversations.map((conversation) => {
        const isAnyParticipantOnline = conversation.participants.some(
          (participantId) => onlineUsers.has(participantId)
        );

        if (conversation.isOnline === isAnyParticipantOnline) {
          return conversation;
        }

        console.log(
          `Updating conversation ${conversation.id} online status to ${isAnyParticipantOnline}`
        );

        return {
          ...conversation,
          isOnline: isAnyParticipantOnline,
        };
      });
    });
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

      setConversations(processedChats);
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

  useEffect(() => {
    if (!userId || !isConnected) return;

    wsSendMessage({
      type: "ONLINE_STATUS",
      userId,
      isOnline: true,
      timestamp: new Date().toISOString(),
    });

    onlineStatusIntervalRef.current = setInterval(() => {
      if (isConnected) {
        wsSendMessage({
          type: "ONLINE_STATUS",
          userId,
          isOnline: true,
          timestamp: new Date().toISOString(),
        });
      }
    }, 30000);

    return () => {
      if (onlineStatusIntervalRef.current) {
        clearInterval(onlineStatusIntervalRef.current);
      }

      if (isConnected && userId) {
        wsSendMessage({
          type: "ONLINE_STATUS",
          userId,
          isOnline: false,
          timestamp: new Date().toISOString(),
        });
      }
    };
  }, [userId, isConnected, wsSendMessage]);

  useEffect(() => {
    if (!isConnected && onlineStatusIntervalRef.current) {
      clearInterval(onlineStatusIntervalRef.current);
      onlineStatusIntervalRef.current = null;
    } else if (isConnected && userId && !onlineStatusIntervalRef.current) {
      onlineStatusIntervalRef.current = setInterval(() => {
        wsSendMessage({
          type: "ONLINE_STATUS",
          userId,
          isOnline: true,
          timestamp: new Date().toISOString(),
        });
      }, 3000);
    }
  }, [isConnected, userId, wsSendMessage]);

  const setTyping = useCallback(
    (conversationId: string, isTyping: boolean) => {
      if (!userId) return;

      const typingKey = `${userId}-${conversationId}`;
      const now = Date.now();

      if (isTyping) {
        const lastTypingTime = typingThrottleRef.current[typingKey] || 0;
        if (now - lastTypingTime < 3000) {
          return;
        }
        typingThrottleRef.current[typingKey] = now;
      } else {
        typingThrottleRef.current[typingKey] = 0;
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
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const refreshOnlineStatus = useCallback(() => {
    if (!userId || !isConnected) return;

    wsSendMessage({
      type: "REQUEST_ONLINE_STATUS",
      userId,
      timestamp: new Date().toISOString(),
    });
  }, [userId, isConnected, wsSendMessage]);

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
        refreshOnlineStatus,
        fetchUser,
        users: usersRef.current,
        getUserFromId,
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
