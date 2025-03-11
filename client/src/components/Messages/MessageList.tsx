import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChevronUp } from "lucide-react";
import { RefObject, useRef, useState } from "react";
import { MessageBubble } from "./MessageBubble";
import { TypingIndicator } from "./TypingIndicator";
import { Message } from "@/types";

interface MessageListProps {
  messages: Message[];
  currentUserId: string | undefined;
  activeChatName: string;
  formatMessageTime: (timestamp?: string) => string;
  messagesEndRef: RefObject<HTMLDivElement>;
  setIsAtBottom?: (isAtBottom: boolean) => void;
}

export function MessageList({
  messages,
  currentUserId,
  activeChatName,
  formatMessageTime,
  messagesEndRef,
  setIsAtBottom,
}: MessageListProps) {
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollToTop, setShowScrollToTop] = useState(false);
  const [isAtBottomInternal, setIsAtBottomInternal] = useState(true);

  // Use the provided setIsAtBottom if available, otherwise use local state
  const updateIsAtBottom = (value: boolean) => {
    setIsAtBottomInternal(value);
    if (setIsAtBottom) {
      setIsAtBottom(value);
    }
  };

  // Handle scroll events
  const handleScroll = () => {
    if (scrollAreaRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = scrollAreaRef.current;
      const distanceFromBottom = scrollHeight - clientHeight - scrollTop;

      setShowScrollToTop(scrollTop > 300);
      updateIsAtBottom(distanceFromBottom < 100);
    }
  };

  const scrollToTop = () => {
    scrollAreaRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    updateIsAtBottom(true);
  };

  // Determine if showing typing indicator (simulated for this example)
  const isTyping = messages.length > 0 && messages.length % 3 === 0;

  return (
    <div className="flex-1 overflow-hidden relative">
      <ScrollArea
        className="h-full"
        onScroll={handleScroll}
        ref={scrollAreaRef}
      >
        <div className="px-2 md:px-4 py-4">
          <div className="space-y-4 mb-2">
            {messages.map((message) => (
              <MessageBubble
                key={message.id}
                isFromCurrentUser={message.senderId === currentUserId}
                message={message}
                formatMessageTime={formatMessageTime}
              />
            ))}

            <TypingIndicator name={activeChatName} isTyping={isTyping} />

            {/* Add an empty div at the end to scroll to */}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </ScrollArea>

      {/* Scroll controls */}
      {showScrollToTop && (
        <Button
          variant="secondary"
          size="icon"
          className="absolute top-2 right-2 opacity-80 hover:opacity-100 z-10 rounded-full h-8 w-8 shadow-md"
          onClick={scrollToTop}
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
      )}
      {!isAtBottomInternal && messages.length > 0 && (
        <Button
          variant="secondary"
          size="sm"
          className="absolute bottom-2 right-2 opacity-80 hover:opacity-100 z-10 rounded-full shadow-md"
          onClick={scrollToBottom}
        >
          <ChevronUp className="h-4 w-4 rotate-180 mr-1" />
          <span className="text-xs">New messages</span>
        </Button>
      )}
    </div>
  );
}
