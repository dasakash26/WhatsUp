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
        "flex animate-fade-in items-end gap-3 group py-2 px-4",
        "hover:bg-muted/5 transition-colors duration-200",
        isFromCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {!isFromCurrentUser && (
        <Avatar className="h-9 w-9 ring-2 ring-muted/20 hover:ring-muted/30 transition-all duration-300 hover:scale-105">
          <AvatarImage
            src={message.senderAvatar || ""}
            alt={message.senderName || "User"}
            className="object-cover"
          />
          <AvatarFallback className="text-sm font-medium bg-muted/40">
            {message.senderName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      )}
      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3",
          "shadow-sm transition-all duration-200 hover:shadow-md",
          "relative group",
          isFromCurrentUser
            ? "bg-gradient-to-br from-primary to-primary/90 text-primary-foreground rounded-br-none"
            : "bg-card text-card-foreground rounded-bl-none border",
          "before:content-[''] before:absolute before:w-3 before:h-3 before:bg-inherit",
          isFromCurrentUser
            ? "before:-right-3 before:bottom-0 before:clip-path-[polygon(100% 0, 0 0, 100% 100%)]"
            : "before:-left-3 before:bottom-0 before:clip-path-[polygon(0 0, 0 100%, 100% 0)]"
        )}
      >
        {!isFromCurrentUser && (
          <p className="text-sm font-semibold text-foreground/90 mb-1.5 tracking-wide flex items-center gap-2">
            <span>{message.senderName || "User"}</span>
            <span className="text-xs font-normal text-muted-foreground/70">
              {formatMessageTime(message.createdAt)}
            </span>
          </p>
        )}
        <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
          {message.text}
        </p>
        {isFromCurrentUser && (
          <div className="flex items-center gap-1.5 mt-2 justify-end">
            <span className="text-xs opacity-80 font-medium">
              {formatMessageTime(message.createdAt)}
            </span>
            <span className="flex items-center gap-0.5">
              {message.status === "SENT" && (
                <span className="text-muted-foreground/70 text-xs">✓</span>
              )}
              {message.status === "DELIVERED" && (
                <span className="text-muted-foreground/70 text-xs">✓✓</span>
              )}
              {message.status === "READ" && (
                <span className="text-blue-300 text-xs">✓✓</span>
              )}
            </span>
          </div>
        )}
      </div>
      {isFromCurrentUser && (
        <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/30 transition-all duration-300 hover:scale-105">
          <AvatarImage src={message.senderAvatar || ""} alt="You" />
          <AvatarFallback className="text-sm font-medium bg-primary/10">
            Y
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
