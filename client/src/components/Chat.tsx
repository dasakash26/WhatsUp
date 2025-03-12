import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@clerk/clerk-react";
import { ChatHeader } from "./Messages/ChatHeader";
import { MessageList } from "./Messages/MessageList";
import { ChatInput } from "./Messages/ChatInput";
import { EmptyChat } from "./Messages/EmptyChat";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "./Messages/TypingIndicator";

interface ChatProps extends React.HTMLAttributes<HTMLDivElement> {
  onMobileMenuClick?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function Chat({
  className,
  onMobileMenuClick,
  isMobileSidebarOpen,
  ...props
}: ChatProps) {
  const {
    activeChat,
    conversations,
    messages,
    sendMessage,
    currentConversationId,
    isConnected,
    connectionError,
    onlineUsers,
  } = useChat();
  const { userId } = useAuth();
  const [inputMessage, setInputMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  // Safe timestamp formatting function
  const formatMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
      // Check if date is valid
      if (isNaN(date.getTime())) return "";

      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting timestamp:", error);
      return "";
    }
  };

  const handleSendMessage = () => {
    if (inputMessage.trim() && activeChat?.id) {
      sendMessage(activeChat.id, inputMessage.trim());
      setInputMessage("");
      // Focus back on the input
      inputRef.current?.focus();
    }
  };

  // Scroll to bottom for new messages only if already at bottom or it's the user's message
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];

    if (isAtBottom || (lastMessage && lastMessage.senderId === userId)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isAtBottom, userId]);

  const conversationMessages = currentConversationId
    ? messages.filter((msg) => msg.conversationId === currentConversationId)
    : [];

  const currentConversation =
    activeChat || conversations?.find((c) => c.id === currentConversationId);

  const isGroupChat = currentConversation
    ? currentConversation.participants.length > 2
    : false;

  if (!currentConversation) {
    return (
      <EmptyChat
        className={className}
        onMobileMenuClick={onMobileMenuClick}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
    );
  }

  const chatForHeader = {
    id: currentConversation.id,
    name: currentConversation.name,
    isGroup: isGroupChat,
    participants: currentConversation.participants,
    online: !isGroupChat
      ? currentConversation.participants.some(
          (participantId) =>
            participantId !== userId && onlineUsers.has(participantId)
        )
      : false,
  };

  const formattedMessages = conversationMessages.map((msg) => {
    const validStatus = ["SENT", "DELIVERED", "READ", undefined];
    const normalizedStatus = validStatus.includes(msg.status as any)
      ? (msg.status as "SENT" | "DELIVERED" | "READ" | undefined)
      : "SENT";

    return {
      ...msg,
      createdAt:
        typeof msg.createdAt === "object" && msg.createdAt instanceof Date
          ? msg.createdAt.toISOString()
          : msg.createdAt,
      status: normalizedStatus,
    };
  });

  return (
    <div
      className={cn(
        "flex flex-col h-full",
        isMobileSidebarOpen
          ? "opacity-40 pointer-events-none md:opacity-100 md:pointer-events-auto"
          : "opacity-100",
        className
      )}
      {...props}
    >
      <ChatHeader
        chat={chatForHeader}
        onMobileMenuClick={onMobileMenuClick}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      {connectionError && (
        <div className="bg-red-50 text-red-700 p-3 mx-4 mt-4 rounded">
          Connection error: {connectionError}
        </div>
      )}

      {!isConnected && !connectionError && (
        <div className="bg-yellow-50 text-yellow-700 p-3 mx-4 mt-4 rounded">
          Connecting to chat server...
        </div>
      )}

      <MessageList
        messages={formattedMessages}
        currentUserId={userId || undefined}
        activeChatName={currentConversation.name}
        formatMessageTime={formatMessageTime}
        messagesEndRef={messagesEndRef as React.RefObject<HTMLDivElement>}
        setIsAtBottom={setIsAtBottom}
      />

      <TypingIndicator conversationId={currentConversation.id} />

      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        inputRef={inputRef as React.RefObject<HTMLInputElement>}
        isConnected={isConnected}
        conversationId={currentConversation.id}
      />
    </div>
  );
}
