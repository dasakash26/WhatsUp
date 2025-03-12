import { useChat } from "@/contexts/ChatContext";
import { useAuth } from "@clerk/clerk-react";

interface TypingIndicatorProps {
  conversationId: string;
}

export function TypingIndicator({ conversationId }: TypingIndicatorProps) {
  const { typingIndicators } = useChat();
  const { userId } = useAuth();

  const typingUsers = typingIndicators.filter(
    (indicator) =>
      indicator.conversationId === conversationId &&
      indicator.isTyping &&
      indicator.userId !== userId
  );

  if (typingUsers.length === 0) {
    return null;
  }

  // Get display text
  const typingText =
    typingUsers.length > 1
      ? "Several people are typing..."
      : "Someone is typing...";

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 pl-4 border-t border-border">
      <div className="flex space-x-1">
        <div
          className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></div>
        <div
          className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></div>
        <div
          className="h-2 w-2 bg-muted-foreground rounded-full animate-bounce"
          style={{ animationDelay: "600ms" }}
        ></div>
      </div>
      <span className="text-xs">{typingText}</span>
    </div>
  );
}
