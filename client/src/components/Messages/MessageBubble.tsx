import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ReplyIcon, HeartIcon, MoreHorizontalIcon } from "lucide-react";
import { useState } from "react";

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
  const [isHovered, setIsHovered] = useState(false);

  if (message.senderId === "system") {
    return (
      <div className="flex justify-center py-2 px-4">
        <div className="bg-muted/70 text-muted-foreground text-xs italic px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm border border-muted/30 transition-all duration-300 hover:bg-muted">
          {message.text}
          {message.createdAt && (
            <span className="ml-2 opacity-70">
              {formatMessageTime(message.createdAt)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex animate-fade-in items-end gap-3 group py-2 px-4 relative",
        "hover:bg-muted/10 transition-colors duration-200 rounded-lg",
        isFromCurrentUser ? "justify-end" : "justify-start"
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {!isFromCurrentUser && (
        <Avatar className="h-9 w-9 ring-2 ring-muted/20 hover:ring-muted/30 transition-all duration-300 hover:scale-105 shrink-0">
          <AvatarImage
            src={message.senderAvatar || ""}
            alt={message.senderName || "User"}
            className="object-cover"
          />
          <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-muted/60 to-muted/40">
            {message.senderName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      )}

      <div
        className={cn(
          "max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3",
          "shadow-sm transition-all duration-200 hover:shadow-md",
          "relative",
          isFromCurrentUser
            ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-br-none"
            : "bg-gradient-to-br from-card to-card/95 text-card-foreground rounded-bl-none border",
          "before:content-[''] before:absolute before:w-4 before:h-4 before:bg-inherit",
          isFromCurrentUser
            ? "before:-right-4 before:bottom-0 before:clip-path-[polygon(100% 0, 0 0, 100% 100%)]"
            : "before:-left-4 before:bottom-0 before:clip-path-[polygon(0 0, 0 100%, 100% 0)]"
        )}
      >
        {!isFromCurrentUser && (
          <p className="text-sm font-semibold text-foreground/90 mb-1.5 tracking-wide flex items-center gap-2">
            <span className="hover:underline cursor-pointer">
              {message.senderName || "User"}
            </span>
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
                <span className="text-primary-foreground/70 text-xs">✓</span>
              )}
              {message.status === "DELIVERED" && (
                <span className="text-primary-foreground/70 text-xs">✓✓</span>
              )}
              {message.status === "READ" && (
                <span className="text-blue-300 text-xs font-medium">✓✓</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Message actions that appear on hover - repositioned to appear below */}
      <div
        className={cn(
          "absolute bottom-0 translate-y-full transition-opacity duration-200 z-10",
          isFromCurrentUser ? "right-12" : "left-12",
          isHovered ? "opacity-100" : "opacity-0"
        )}
      >
        <div className="flex items-center gap-1 bg-background border shadow-md rounded-full p-1 mt-1">
          <button className="p-1 rounded-full hover:bg-muted transition-colors">
            <ReplyIcon size={14} className="text-muted-foreground" />
          </button>
          <button className="p-1 rounded-full hover:bg-muted transition-colors">
            <HeartIcon size={14} className="text-muted-foreground" />
          </button>
          <button className="p-1 rounded-full hover:bg-muted transition-colors">
            <MoreHorizontalIcon size={14} className="text-muted-foreground" />
          </button>
        </div>
      </div>

      {isFromCurrentUser && (
        <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/30 transition-all duration-300 hover:scale-105 shrink-0">
          <AvatarImage
            src={message.senderAvatar || ""}
            alt="You"
            className="object-cover"
          />
          <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/30 to-primary/10">
            Y
          </AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
