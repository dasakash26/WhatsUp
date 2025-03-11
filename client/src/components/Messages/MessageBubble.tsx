import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface MessageBubbleProps {
  isFromCurrentUser: boolean;
  message: Message;
  formatMessageTime: (timestamp?: string) => string;
}

export function MessageBubble({
  isFromCurrentUser,
  message,
  formatMessageTime,
}: MessageBubbleProps) {
  return (
    <div
      className={cn(
        "flex animate-fade-in items-end gap-3 group py-1",
        isFromCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isFromCurrentUser && (
        <Avatar className="h-8 w-8 ring-1 ring-muted/30">
          <AvatarImage
            src={message.senderAvatar || ""}
            alt={message.senderName || "User"}
          />
          <AvatarFallback className="text-xs font-medium bg-muted/50">
            {message.senderName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3 shadow-sm transition-shadow duration-200 hover:shadow-md",
          isFromCurrentUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-none"
            : "bg-accent text-accent-foreground rounded-tl-none"
        )}
      >
        {/* Show sender name only for messages not from current user */}
        {!isFromCurrentUser && (
          <p className="text-xs font-semibold text-accent-foreground/90 mb-2 tracking-wide">
            {message.senderName || "User"}
          </p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap">
          {message.text}
        </p>
        <div className="flex items-center gap-2 mt-1.5 justify-end">
          <span className="text-[10px] opacity-70 font-medium">
            {formatMessageTime(message.createdAt)}
          </span>
          {isFromCurrentUser && (
            <span className="text-[10px] opacity-80 ml-0.5">
              {message.status === "SENT" && "✓"}
              {message.status === "DELIVERED" && "✓✓"}
              {message.status === "READ" && (
                <span className="text-blue-300 font-medium">✓✓</span>
              )}
            </span>
          )}
        </div>
      </div>
      {isFromCurrentUser && (
        <Avatar className="h-8 w-8 ring-1 ring-primary/30">
          <AvatarImage src={message.senderAvatar || ""} alt="You" />
          <AvatarFallback className="text-xs font-medium bg-primary/10">
            You
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
