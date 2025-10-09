import { useState, useRef, useEffect } from "react";
import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@clerk/clerk-react";
import { ChatHeader } from "./Messages/ChatHeader";
import { MessageList } from "./Messages/MessageList";
import { ChatInput } from "./Messages/ChatInput";
import { EmptyChat } from "./Messages/EmptyChat";
import { cn } from "@/lib/utils";
import { TypingIndicator } from "./Messages/TypingIndicator";
import VideoCall from "./videoCall/video";
import { Button } from "@/components/ui/button";
import { X, MessageCircle, ChevronDown } from "lucide-react";
import { toast } from "sonner";

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
    notifyVideoCallStart,
  } = useChat();

  const { userId } = useAuth();
  const [inputMessage, setInputMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isCallActive, setIsCallActive] = useState(false);
  const [isChatOverlayOpen, setIsChatOverlayOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [isAtBottom, setIsAtBottom] = useState(true);

  const formatMessageTime = (timestamp: string | undefined) => {
    if (!timestamp) return "";

    try {
      const date = new Date(timestamp);
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

  const handleStartVideoCall = () => {
    if (currentConversation?.id) {
      notifyVideoCallStart(currentConversation.id);
      setIsCallActive(true);
      toast.success("Video call started");
    }
  };

  const handleEndVideoCall = () => {
    if (currentConversation?.id) {
      setIsCallActive(false);
      toast.success("Video call ended");
    }
  };

  const handleSendMessage = () => {
    if (activeChat?.id && selectedImage) {
      sendMessage(activeChat.id, inputMessage.trim(), selectedImage);
      setInputMessage("");
      setSelectedImage(null);
      inputRef.current?.focus();
    } else if (inputMessage.trim() && activeChat?.id) {
      sendMessage(activeChat.id, inputMessage.trim());
      setInputMessage("");
      inputRef.current?.focus();
    }
  };

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
    const validStatus: Array<"SENT" | "DELIVERED" | "READ" | undefined> = [
      "SENT",
      "DELIVERED",
      "READ",
      undefined,
    ];
    const normalizedStatus = validStatus.includes(
      msg.status as "SENT" | "DELIVERED" | "READ" | undefined
    )
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
        "flex flex-col h-full relative",
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
        onStartVideoCall={handleStartVideoCall}
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

      {isCallActive ? (
        <div className="fixed inset-0 z-50 bg-black">
          <VideoCall conversationId={currentConversation.id} />

          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-40">
            <div className="bg-black/30 backdrop-blur-md rounded-full px-4 py-2">
              <p className="text-white text-sm font-medium">
                {currentConversation.name}
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setIsChatOverlayOpen(!isChatOverlayOpen)}
                size="icon"
                className="h-10 w-10 rounded-full bg-black/30 backdrop-blur-md border-0 hover:bg-black/50 text-white"
              >
                <MessageCircle className="h-5 w-5" />
              </Button>
              <Button
                onClick={handleEndVideoCall}
                size="icon"
                className="h-10 w-10 rounded-full bg-red-500/90 backdrop-blur-md border-0 hover:bg-red-600 text-white"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          <div
            className={cn(
              "absolute bottom-0 left-0 right-0 bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl transition-transform duration-300 ease-out z-30",
              isChatOverlayOpen
                ? "transform translate-y-0"
                : "transform translate-y-full"
            )}
            style={{ height: "60%" }}
          >
            <div className="flex justify-center py-3 border-b border-gray-200/50 dark:border-gray-700/50">
              <Button
                onClick={() => setIsChatOverlayOpen(false)}
                variant="ghost"
                size="sm"
                className="flex items-center space-x-2 text-gray-600 dark:text-gray-400"
              >
                <ChevronDown className="h-4 w-4" />
                <span className="text-sm">Hide Chat</span>
              </Button>
            </div>

            <div className="flex flex-col h-full">
              <div className="flex-1 overflow-y-auto px-4 pt-2">
                <MessageList
                  messages={formattedMessages}
                  currentUserId={userId || undefined}
                  activeChatName={currentConversation.name}
                  formatMessageTime={formatMessageTime}
                  messagesEndRef={
                    messagesEndRef as React.RefObject<HTMLDivElement>
                  }
                  setIsAtBottom={setIsAtBottom}
                />
                <TypingIndicator conversationId={currentConversation.id} />
              </div>

              <div className="border-t border-gray-200/50 dark:border-gray-700/50 p-8 mb-8">
                <ChatInput
                  inputMessage={inputMessage}
                  setInputMessage={setInputMessage}
                  handleSendMessage={handleSendMessage}
                  inputRef={inputRef as React.RefObject<HTMLInputElement>}
                  isConnected={isConnected}
                  conversationId={currentConversation.id}
                  selectedImage={selectedImage}
                  setSelectedImage={setSelectedImage}
                />
              </div>
            </div>
          </div>

          {!isChatOverlayOpen && (
            <div className="absolute bottom-4 left-4 right-4 flex justify-center z-30">
              <Button
                onClick={() => setIsChatOverlayOpen(true)}
                className="bg-black/30 backdrop-blur-md hover:bg-black/50 text-white border-0 rounded-full px-6 py-2"
              >
                <MessageCircle className="h-4 w-4 mr-2" />
                Show Chat
              </Button>
            </div>
          )}
        </div>
      ) : (
        <>
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
            selectedImage={selectedImage}
            setSelectedImage={setSelectedImage}
          />
        </>
      )}
    </div>
  );
}
