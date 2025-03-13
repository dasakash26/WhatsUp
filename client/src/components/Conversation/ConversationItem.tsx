import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";

interface ConversationItemProps {
  id: string;
  name: string;
  image?: string;
  lastMessage?: string;
  lastMessageTime?: Date;
  unreadCount?: number;
  isActive?: boolean;
  isOnline?: boolean;
  isTyping?: boolean;
  onClick?: () => void;
}

export function ConversationItem({
  name,
  image,
  lastMessage,
  lastMessageTime,
  unreadCount = 0,
  isActive = false,
  isOnline = false,
  isTyping = false,
  onClick,
}: ConversationItemProps) {
  const initials = name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase();

  const formattedTime = lastMessageTime
    ? formatDistanceToNow(new Date(lastMessageTime), { addSuffix: true })
    : "";

  return (
    <div
      onClick={onClick}
      className={cn(
        "flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-accent",
        isActive && "bg-accent"
      )}
    >
      <div className="relative">
        <Avatar>
          <AvatarImage src={image} alt={name} />
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        {isOnline && (
          <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">{name}</h3>
          {lastMessageTime && !isTyping && (
            <span className="text-xs text-muted-foreground">
              {formattedTime}
            </span>
          )}
        </div>
        {isTyping ? (
          <div className="flex items-center text-sm text-primary">
            <span className="mr-2">Typing</span>
            <span className="typing-animation">
              <span className="dot"></span>
              <span className="dot"></span>
              <span className="dot"></span>
            </span>
          </div>
        ) : (
          lastMessage && (
            <p className="text-sm text-muted-foreground truncate">
              {lastMessage}
            </p>
          )
        )}
      </div>

      {unreadCount > 0 && (
        <Badge className="rounded-full" variant="default">
          {unreadCount}
        </Badge>
      )}
    </div>
  );
}
