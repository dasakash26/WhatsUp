import { cn } from "../lib/utils";
import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@clerk/clerk-react";
import { ChatHeader } from "./Messages/ChatHeader";
import { MessageList } from "./Messages/MessageList";
import { ChatInput } from "./Messages/ChatInput";
import { EmptyChat } from "./Messages/EmptyChat";

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
  const { activeChat, messages: chatMessages, sendMessage } = useChat();
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
    if (inputMessage.trim()) {
      sendMessage(inputMessage);
      setInputMessage("");
      // Focus back on the input
      inputRef.current?.focus();
    }
  };

  // Scroll to bottom for new messages only if already at bottom or it's the user's message
  useEffect(() => {
    const lastMessage = chatMessages[chatMessages.length - 1];

    if (isAtBottom || (lastMessage && lastMessage.senderId === userId)) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [chatMessages, isAtBottom, userId]);

  if (!activeChat) {
    return (
      <EmptyChat
        className={className}
        onMobileMenuClick={onMobileMenuClick}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />
    );
  }

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
        chat={activeChat}
        onMobileMenuClick={onMobileMenuClick}
        isMobileSidebarOpen={isMobileSidebarOpen}
      />

      <MessageList
        messages={chatMessages}
        currentUserId={userId}
        activeChatName={activeChat.name}
        formatMessageTime={formatMessageTime}
        messagesEndRef={messagesEndRef}
        setIsAtBottom={setIsAtBottom}
      />

      <ChatInput
        inputMessage={inputMessage}
        setInputMessage={setInputMessage}
        handleSendMessage={handleSendMessage}
        inputRef={inputRef}
      />
    </div>
  );
}
