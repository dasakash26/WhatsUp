import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ExternalLink, Info } from "lucide-react";
import { useState, useCallback } from "react";

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
  const [imageError, setImageError] = useState(false);

  const renderTextWithUrls = useCallback(
    (text: string) => {
      if (!text) return null;

      // Check if text is only emojis
      if (/^(?:\p{Extended_Pictographic}\s?)+$/u.test(text)) {
        return <span className="text-4xl">{text}</span>;
      }

      // Split text to handle URLs and emojis
      const parts = text
        .split(/((?:https?:\/\/[^\s]+)|(?:\p{Extended_Pictographic}))/gu)
        .filter(Boolean);

      return parts.map((part, i) => {
        if (/https?:\/\/[^\s]+/.test(part)) {
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer"
              className={cn(
                "inline-flex items-center gap-1 underline underline-offset-2 break-all",
                isFromCurrentUser
                  ? "text-primary-foreground/90 hover:text-primary-foreground"
                  : "text-blue-600 hover:text-blue-700"
              )}
            >
              {part.length > 50 ? `${part.substring(0, 50)}...` : part}
              <ExternalLink size={12} className="inline shrink-0" />
            </a>
          );
        }
        return <span key={i}>{part}</span>;
      });
    },
    [isFromCurrentUser]
  );

  // System message
  if (message.senderId === "system") {
    return (
      <div className="flex justify-center py-2 px-4">
        <div className="max-w-md p-3 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded-lg border border-blue-200 dark:border-blue-800 flex items-center gap-2">
          <Info className="h-4 w-4" />
          <div className="text-center">
            {message.text}
            {message.createdAt && (
              <span className="ml-2 opacity-70 text-xs">
                {formatMessageTime(message.createdAt)}
              </span>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "flex items-end gap-3 py-2 px-4",
        isFromCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      {/* Avatar for other users */}
      {!isFromCurrentUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={message.senderAvatar || ""}
            alt={message.senderName || "User"}
            className="object-cover"
          />
          <AvatarFallback className="text-sm">
            {message.senderName?.[0] || "U"}
          </AvatarFallback>
        </Avatar>
      )}

      {/* Message bubble */}
      <div
        className={cn(
          "max-w-xs sm:max-w-sm md:max-w-md lg:max-w-lg xl:max-w-xl rounded-2xl px-4 py-3 shadow-sm",
          isFromCurrentUser
            ? "bg-primary text-primary-foreground rounded-br-md"
            : "bg-card text-card-foreground border rounded-bl-md"
        )}
      >
        {/* Sender name and time for other users */}
        {!isFromCurrentUser && (
          <div className="text-sm font-medium text-foreground/90 mb-1  flex items-center justify-between">
            <span>{message.senderName || "User"}</span>
            <span className="text-xs text-muted-foreground">
              {formatMessageTime(message.createdAt)}
            </span>
          </div>
        )}

        {/* Image */}
        {message.image && !imageError && (
          <div className="mb-2">
            <img
              src={message.image}
              alt="Message attachment"
              className="rounded-lg max-h-64 w-full object-cover cursor-pointer"
              onError={() => setImageError(true)}
              onClick={() =>
                message.image && window.open(message.image, "_blank")
              }
            />
          </div>
        )}

        {/* Text content */}
        {(message.text || imageError) && (
          <div className="text-sm leading-relaxed">
            {imageError && message.image && (
              <div className="mb-2 text-xs opacity-75">
                <span>Image failed to load: </span>
                <a
                  href={message.image}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline break-all"
                >
                  {message.image.length > 50
                    ? `${message.image.substring(0, 50)}...`
                    : message.image}
                </a>
              </div>
            )}
            <div className="break-words whitespace-pre-wrap">
              {renderTextWithUrls(message.text || "")}
            </div>
          </div>
        )}

        {/* Time and status for current user */}
        {isFromCurrentUser && (
          <div className="flex items-center justify-end gap-2 mt-2 text-xs opacity-75 ">
            <span>{formatMessageTime(message.createdAt)}</span>
            <span>
              {message.status === "PENDING" && "🕓"}
              {message.status === "SENT" && "✓"}
              {message.status === "DELIVERED" && "✓✓"}
              {message.status === "READ" && (
                <span className="text-green-400">✓✓</span>
              )}
            </span>
          </div>
        )}
      </div>

      {/* Avatar for current user */}
      {isFromCurrentUser && (
        <Avatar className="h-8 w-8 shrink-0">
          <AvatarImage
            src={message.senderAvatar || ""}
            alt="You"
            className="object-cover"
          />
          <AvatarFallback className="text-sm">Y</AvatarFallback>
        </Avatar>
      )}
    </div>
  );
}
