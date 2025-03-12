import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Users, User } from "lucide-react";

interface ChatListItemProps {
  chat: any;
  isActive: boolean;
  userId: string | null;
  onClick: () => void;
}

export const ChatListItem = ({
  chat,
  isActive,
  userId,
  onClick,
}: ChatListItemProps) => {
  const isGroupChat = (chat: any) => {
    return chat.participants.length > 2;
  };

  const getChatDisplayName = (chat: any) => {
    if (!chat.isGroup && chat.participants.length === 2 && userId) {
      const otherParticipant = chat.participants.find(
        (id: string) => id !== userId
      );
      // Use the provided chat name directly if it exists
      if (chat.name && !chat.name.includes("Generated")) {
        return chat.name;
      }
      // Fallback to basic ID-based naming
      if (otherParticipant) {
        return `User ${otherParticipant.substring(0, 4)}`;
      }
    }
    return chat.name;
  };

  const getLastMessagePrefix = (chat: any) => {
    if (!chat.lastMessage) return "";

    const isCurrentUserLastSender =
      userId && chat.lastMessageSenderId === userId;

    if (isCurrentUserLastSender) {
      return "You: ";
    }

    if (chat.lastMessageSenderName) {
      const firstName = chat.lastMessageSenderName.split(" ")[0];
      return `${firstName}: `;
    }

    if (chat.lastMessageSenderUsername) {
      return `${chat.lastMessageSenderUsername}: `;
    }

    return "Someone: ";
  };

  const formatTime = (time: string | null) => {
    if (!time) return "";
    try {
      const date = new Date(time);
      return date.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch (error) {
      console.error("Error formatting time:", error);
      return "";
    }
  };

  return (
    <Card
      className={cn(
        "p-0 overflow-hidden hover:bg-accent/50 cursor-pointer transition-all duration-200 border-0",
        "transform hover:-translate-y-[1px] active:translate-y-[1px]",
        isActive && "bg-accent shadow-md"
      )}
      onClick={onClick}
    >
      <div className="p-3 flex items-center gap-3">
        <div className="relative flex-shrink-0">
          <Avatar className="h-12 w-12 border border-border shadow-sm">
            {isGroupChat(chat) ? (
              <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                <Users className="h-6 w-6" />
              </AvatarFallback>
            ) : (
              <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground">
                <User className="h-5 w-5" />
              </AvatarFallback>
            )}
          </Avatar>
          {chat.online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="font-medium text-foreground flex items-center gap-1 truncate">
              <span className="truncate">{getChatDisplayName(chat)}</span>
              {isGroupChat(chat) && (
                <Badge variant="secondary" className="text-xs ml-1 py-0 h-5">
                  {chat.participants.length}
                </Badge>
              )}
            </div>
            {chat.lastMessageTime && (
              <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
                {formatTime(chat.lastMessageTime)}
              </span>
            )}
          </div>

          <div className="text-xs text-muted-foreground truncate mt-1">
            {chat.lastMessage ? (
              <>
                <span
                  className={
                    userId && chat.lastMessageSenderId === userId
                      ? "text-primary font-medium"
                      : "font-medium"
                  }
                >
                  {getLastMessagePrefix(chat)}
                </span>
                {chat.lastMessage}
              </>
            ) : (
              "No messages yet"
            )}
          </div>
        </div>
      </div>
    </Card>
  );
};
