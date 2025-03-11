import { cn } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";
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
        "flex animate-fade-in items-end gap-2",
        isFromCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isFromCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage
            src={message.senderAvatar || ""}
            alt={message.senderName || "User"}
          />
          <AvatarFallback>{message.senderName?.[0] || "U"}</AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm",
          isFromCurrentUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-tr-none"
            : "bg-accent text-accent-foreground rounded-tl-none"
        )}
      >
        {/* Show sender name only for messages not from current user */}
        {!isFromCurrentUser && (
          <>
            <p className="text-xs font-medium text-accent-foreground/80 mb-1">
              {message.senderName || "User"}
            </p>
            <Separator className="mb-1.5" />
          </>
        )}
        <p className="text-sm">{message.text}</p>
        <div className="flex items-center gap-2 mt-1">
          <span className="text-[10px] opacity-70">
            {formatMessageTime(message.createdAt)}
          </span>
          {isFromCurrentUser && (
            <span className="text-[10px] opacity-70">
              {message.status === "SENT" && "✓"}
              {message.status === "DELIVERED" && "✓✓"}
              {message.status === "READ" && (
                <span className="text-blue-300">✓✓</span>
              )}
            </span>
          )}
        </div>
      </div>
      {isFromCurrentUser && (
        <Avatar className="h-8 w-8">
          <AvatarImage src={message.senderAvatar || ""} alt="You" />
          <AvatarFallback>You</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
