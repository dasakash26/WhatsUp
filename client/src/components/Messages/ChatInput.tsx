import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaperclipIcon, Send, SmileIcon } from "lucide-react";
import { RefObject, useEffect, useState } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useChat } from "@/contexts/ChatContext";
import { useDebounce } from "@/hooks/useDebounce";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  handleSendMessage: () => void;
  inputRef: RefObject<HTMLInputElement>;
  isConnected?: boolean;
  conversationId: string;
}

export function ChatInput({
  inputMessage,
  setInputMessage,
  handleSendMessage,
  inputRef,
  conversationId,
}: ChatInputProps) {
  const [isTyping, setIsTyping] = useState(false);
  const { setTyping } = useChat();

  useDebounce(
    () => {
      if (conversationId && isTyping) {
        setTyping(conversationId, false);
        setIsTyping(false);
      }
    },
    2000,
    [isTyping, conversationId]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputMessage(newValue);

    if (!conversationId) return;

    if (newValue.length > 0 && !isTyping) {
      setIsTyping(true);
      setTyping(conversationId, true);
    } else if (newValue.length === 0 && isTyping) {
      setIsTyping(false);
      setTyping(conversationId, false);
    }
  };

  useEffect(() => {
    return () => {
      if (isTyping && conversationId) {
        setTyping(conversationId, false);
      }
    };
  }, [isTyping, conversationId, setTyping]);

  useEffect(() => {
    if (isTyping) {
      setIsTyping(false);
      setTyping(conversationId, false);
    }
  }, [conversationId]);

  return (
    <div className="p-3 border-t border-border bg-background/95 backdrop-blur-sm">
      <div className="flex items-center gap-2">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="text-muted-foreground rounded-full"
              >
                <PaperclipIcon className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Attach file</TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="w-full px-4 py-2.5 rounded-full bg-accent/50 border border-input focus:outline-none focus:ring-1 focus:ring-ring pr-10"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
          />
          <Button
            variant="ghost"
            size="icon"
            className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground rounded-full"
          >
            <SmileIcon className="h-5 w-5" />
          </Button>
        </div>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                size="icon"
                onClick={handleSendMessage}
                className={cn(
                  "rounded-full bg-primary hover:bg-primary/90 transition-all",
                  inputMessage.trim() ? "opacity-100" : "opacity-70"
                )}
                disabled={!inputMessage.trim()}
              >
                <Send className="h-4 w-4" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Send message</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
