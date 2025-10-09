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
  const [isLoading, setIsLoading] = useState(false);
  const [isImageUploading, setIsImageUploading] = useState(false);
  const wsSendMessageRef = useRef<((message: WebSocketMessage) => boolean) | null>(null);

  useEffect(() => {
    console.log("Typing Indicators:", typingIndicators);
    console.log("Online Users:", Array.from(onlineUsers));
  }, [typingIndicators, onlineUsers]);

  async function fetchUser(id: string): Promise<User | null> {
    try {
      const res = await api.get(`/user/${id}`, {
        headers: {
          Authorization: `Bearer ${await getToken()}`,
        },
      });
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
      const sender = data.senderId;
      if (!onlineUsers.has(sender)) {
        setOnlineUsers((prev) => new Set(prev).add(sender));
      }

      switch (data.type) {
        case "MESSAGE": {
          const imageUrl =
            typeof data.imageUrl === "string" && data.imageUrl.trim() !== ""
              ? data.imageUrl
              : undefined;

          const messageDate = new Date(data.createdAt);
          const newMessage: Message = {
            id: data.id as string,
            text: data.text as string,
            status: "SENT",
            senderId: data.senderId as string,
            senderName: data.senderName as string,
            senderUsername: data.senderUsername as string,
            senderAvatar: data.senderAvatar as string | null,
            conversationId: data.conversationId as string,
            createdAt: messageDate,
            type: "MESSAGE",
            image: imageUrl,
            tempMessageId: data.tempMessageId as string,
          };

          console.log("Processing received message:", newMessage);

          setMessages((prev) => {
            const tempIndex = prev.findIndex(
              (msg) => msg.id === data.tempMessageId
            );

            const fallbackTempIndex =
              tempIndex === -1
                ? prev.findIndex(
                    (msg) =>
                      msg.id.startsWith("temp-") &&
                      msg.conversationId === newMessage.conversationId &&
                      msg.text === newMessage.text &&
                      msg.senderId === userId
                  )
                : -1;

            if (tempIndex !== -1 || fallbackTempIndex !== -1) {
              const updated = [...prev];
              const indexToReplace =
                tempIndex !== -1 ? tempIndex : fallbackTempIndex;
              updated[indexToReplace] = newMessage;
              return updated;
            }

            const existingIndex = prev.findIndex(
              (msg) => msg.id === newMessage.id
            );
            if (existingIndex !== -1) {
              return prev;
            }

            return [...prev, newMessage];
          });

          setConversations((prevConversations) =>
            prevConversations.map((conv) => {
              if (conv.id !== newMessage.conversationId) return conv;

              const tempIndex = conv.messages.findIndex(
                (msg) => msg.id === data.tempMessageId
              );

              const fallbackTempIndex =
                tempIndex === -1
                  ? conv.messages.findIndex(
                      (msg) =>
                        msg.id.startsWith("temp-") &&
                        msg.text === newMessage.text &&
                        msg.senderId === userId
                    )
                  : -1;

              let updatedMessages;

              if (tempIndex !== -1 || fallbackTempIndex !== -1) {
                updatedMessages = [...conv.messages];
                const indexToReplace =
                  tempIndex !== -1 ? tempIndex : fallbackTempIndex;
                updatedMessages[indexToReplace] = newMessage;
              } else {
                const existingIndex = conv.messages.findIndex(
                  (msg) => msg.id === newMessage.id
                );
                if (existingIndex !== -1) {
                  return conv;
                } else {
                  updatedMessages = [...conv.messages, newMessage];
                }
              }

              const isNewer =
                !conv.lastMessageTime ||
                new Date(newMessage.createdAt) > new Date(conv.lastMessageTime);

              return {
                ...conv,
                messages: updatedMessages,
                ...(isNewer && {
                  lastMessage: newMessage.image
                    ? newMessage.text || "Image"
                    : newMessage.text,
                  lastMessageTime: newMessage.createdAt,
                  lastMessageSenderId: newMessage.senderId,
                  lastMessageSenderName: newMessage.senderName,
                  lastMessageSenderUsername: newMessage.senderUsername,
                  lastMessageSenderAvatar: newMessage.senderAvatar,
                }),
              };
            })
          );

          // Send read receipt if the message is from another user and the conversation is currently open
          if (
            newMessage.senderId !== userId &&
            newMessage.conversationId === currentConversationId &&
            wsSendMessageRef.current
          ) {
            // Use setTimeout to ensure the message is processed before sending read receipt
            setTimeout(() => {
              wsSendMessageRef.current?.({
                type: "READ_RECEIPT",
                conversationId: newMessage.conversationId,
                messageIds: [newMessage.id],
                userId: userId,
                timestamp: new Date().toISOString(),
              });
            }, 100);
          }
          break;
        }

        case "TYPING": {
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
          break;
        }

        case "ONLINE_STATUS": {
          console.log("Received online status:", data);
          const receivedUserId = data.userId as string;
          const isOnline = !!data.isOnline;

          console.log(
            `Online status received: User ${receivedUserId} is ${
              isOnline ? "online" : "offline"
            }`
          );

          if (isOnline) {
            setOnlineUsers((prev) => {
              if (prev.has(receivedUserId)) return prev;
              const updated = new Set(prev);
              updated.add(receivedUserId);
              return updated;
            });
          } else {
            setOnlineUsers((prev) => {
              if (!prev.has(receivedUserId)) return prev;
              const updated = new Set(prev);
              updated.delete(receivedUserId);
              return updated;
            });
          }
          break;
        }

        case "READ_RECEIPT": {
          console.log("Received read receipt:", data);
          const { messageIds, messageId } = data;

          const idsToUpdate = messageIds && messageIds.length > 0 
            ? messageIds 
            : (messageId ? [messageId] : []);

          if (idsToUpdate.length === 0) return;

          setMessages((prev) =>
            prev.map((msg) =>
              idsToUpdate.includes(msg.id as string) ? { ...msg, status: "READ" } : msg
            )
          );

          setConversations((prevConversations) =>
            prevConversations.map((conv) => ({
              ...conv,
              messages: conv.messages.map((msg) =>
                idsToUpdate.includes(msg.id as string) ? { ...msg, status: "READ" } : msg
              ),
            }))
          );
          break;
        }
      }
    },
    [userId, currentConversationId]
  );

  const {
    isConnected,
    connectionError,
    sendMessage: wsSendMessage,
  } = useWebSocket({
    onMessage: handleWebSocketMessage,
  });

  // Update the ref whenever wsSendMessage changes
  useEffect(() => {
    wsSendMessageRef.current = wsSendMessage;
  }, [wsSendMessage]);

  //when current conversation changes, update read receipts for messages in that conversation if last message is from another user and not read yet
  useEffect(() => {
    if (!currentConversationId || !userId || !wsSendMessageRef.current) return;

    const conversation = conversations.find(
      (conv) => conv.id === currentConversationId
    );
    if (!conversation) return;

    // const unreadMessageIds = conversation.messages
    //   .filter((msg) => msg.senderId !== userId && msg.status !== "READ")
    //   .map((msg) => msg.id as string);
    const unreadMessageIds = conversation.messages[-1] &&
      conversation.messages[-1].senderId !== userId &&
      conversation.messages[-1].status !== "READ"
      ? [conversation.messages[-1].id as string]
      : [];
      
    if (unreadMessageIds.length > 0) {
      wsSendMessageRef.current?.({
        type: "READ_RECEIPT",
        conversationId: currentConversationId,
        messageIds: unreadMessageIds,
        userId,
        timestamp: new Date().toISOString(),
      });
    }
    
  }, [currentConversationId]);

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
        
        // Collect all unread message IDs from other users
        if (userId && wsSendMessageRef.current) {
          const unreadMessageIds = conversation.messages
            .filter((msg) => msg.senderId !== userId && msg.status !== "READ")
            .map((msg) => msg.id as string);

          // Send a single batched read receipt for all unread messages
          if (unreadMessageIds.length > 0) {
            wsSendMessageRef.current?.({
              type: "READ_RECEIPT",
              conversationId: currentConversationId,
              messageIds: unreadMessageIds,
              userId,
              timestamp: new Date().toISOString(),
            });
          }
        }
      }
    } else {
      setMessages([]);
    }
  }, [currentConversationId, conversations, userId]);

  useEffect(() => {
    const savedConversationId = localStorage.getItem("lastConversationId");
    if (savedConversationId) {
      setCurrentConversationId(savedConversationId);
    }
  }, []);

  useEffect(() => {
    if (currentConversationId) {
      localStorage.setItem("lastConversationId", currentConversationId);
    }
  }, [currentConversationId]);

  const loadConversations = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
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
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 300);
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
    async (conversationId: string, text: string, image?: File) => {
      if (!userId || (!text && !image)) return;

      let imageUrl: string | undefined;
      if (image) {
        console.log("Starting image upload...");
        setIsImageUploading(true);
        try {
          const token = await getToken();
          const formData = new FormData();
          formData.append("image", image);
          const res = await api.post("/message/image", formData, {
            headers: {
              "Content-Type": "multipart/form-data",
              Authorization: `Bearer ${token}`,
            },
          });
          if (
            res.data &&
            typeof res.data === "string" &&
            res.data.trim() !== ""
          ) {
            imageUrl = res.data;
            console.log("Image uploaded successfully:", imageUrl);
          } else {
            console.error("Invalid image URL from server:", res.data);
            throw new Error("Invalid image URL from server");
          }
        } catch (error) {
          console.error("Error handling image:", error);
          return;
        } finally {
          setTimeout(() => {
            console.log("Image upload complete, clearing loading state");
            setIsImageUploading(false);
          }, 300);
        }
      }

      setTyping(conversationId, false);
      const message: MessagePayload = {
        type: "MESSAGE",
        conversationId,
        text: text || "Image",
        ...(imageUrl && { image: imageUrl }),
      };
      console.log("Sending WebSocket message:", message);
      wsSendMessage(message);
    },
    [setTyping, userId, wsSendMessage, getToken]
  );

  const sendReadReceipt = useCallback(
    (conversationId: string, messageIds: string | string[]) => {
      if (!userId) return;

      const idsArray = Array.isArray(messageIds) ? messageIds : [messageIds];

      wsSendMessage({
        type: "READ_RECEIPT",
        conversationId,
        messageIds: idsArray,
        userId,
        timestamp: new Date().toISOString(),
      });
    },
    [wsSendMessage, userId]
  );

  const addSystemMessage = useCallback(
    (conversationId: string, text: string) => {
      const systemMessage: Message = {
        id: `system-${Date.now()}`,
        text,
        senderId: "system",
        senderName: "System",
        senderUsername: "System",
        senderAvatar: null,
        conversationId,
        createdAt: new Date(),
        type: "MESSAGE",
        status: "SENT",
      };

      setMessages((prev) => [...prev, systemMessage]);

      setConversations((prevConversations) =>
        prevConversations.map((conv) => {
          if (conv.id !== conversationId) return conv;

          return {
            ...conv,
            messages: [...conv.messages, systemMessage],
          };
        })
      );
    },
    []
  );

  const isUserOnline = useCallback(
    (userId: string) => onlineUsers.has(userId),
    [onlineUsers]
  );

  const reloadChats = useCallback(async () => {
    try {
      setIsLoading(true);
      await loadConversations();
    } catch (error) {
      console.error("Error reloading conversations:", error);
      setIsLoading(false);
    }
  }, [loadConversations]);

  return (
    <ChatContext.Provider
      value={{
        messages,
        sendMessage,
        sendReadReceipt,
        addSystemMessage,
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
        fetchUser,
        users: usersRef.current,
        getUserFromId,
        reloadChats,
        isLoading: isLoading || isImageUploading,
        isImageUploading,
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
