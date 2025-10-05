import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Users } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { useEffect, useState } from "react";

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
  const [user, setUser] = useState<any>(null);
  const { users, fetchUser, typingIndicators } = useChat();

  useEffect(() => {
    if (!chat.isGroup && chat.participants) {
      const otherParticipant = chat.participants.find(
        (id: string) => id !== userId
      );
      if (otherParticipant) {
        const otherUser = users.find((u) => u.id === otherParticipant);
        if (otherUser) {
          setUser(otherUser);
        } else {
          async function fetchUserData() {
            const res = await fetchUser(otherParticipant);
            if (res) setUser(res);
          }
          fetchUserData();
        }
      }
    }
  }, [chat]);

  const isGroupChat = (chat: any) => {
    return chat.participants && chat.participants.length > 2;
  };

  const { onlineUsers } = useChat();

  const isUserOnline = (userId: string) => {
    return onlineUsers.has(userId);
  };

  const getChatOnlineStatus = (chat: any) => {
    if (!chat.participants) return false;

    if (!chat.isGroup && chat.participants.length === 2 && userId) {
      const otherParticipant = chat.participants.find(
        (id: string) => id !== userId
      );
      return otherParticipant ? isUserOnline(otherParticipant) : false;
    } else if (chat.isGroup) {
      return chat.participants.some(
        (id: string) => id !== userId && isUserOnline(id)
      );
    }
    return false;
  };

  const getChatDisplayName = (chat: any) => {
    if (
      !chat.isGroup &&
      chat.participants &&
      chat.participants.length === 2 &&
      userId
    ) {
      const otherParticipant = chat.participants.find(
        (id: string) => id !== userId
      );
      if (chat.name && !chat.name.includes("Generated")) {
        return chat.name;
      }
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

  const isTypingInChat = (chatId: string) => {
    return typingIndicators.some(
      (indicator) =>
        indicator.conversationId === chatId &&
        indicator.userId !== userId &&
        indicator.isTyping
    );
  };

  const getTypingUserName = (chatId: string) => {
    if (!chat.isGroup) {
      return "typing...";
    }

    const typingUser = typingIndicators.find(
      (indicator) =>
        indicator.conversationId === chatId &&
        indicator.userId !== userId &&
        indicator.isTyping
    );

    if (!typingUser) return null;

    const typingUserData = users.find((u) => u.id === typingUser.userId);
    console.log("Typing user data:", typingUserData);
    if (typingUserData) {
      return `${
        typingUserData.username || "Someone"
      } is typing...`;
    }

    return "Someone is typing...";
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
              <>
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                  <Users className="h-6 w-6" />
                </AvatarFallback>
              </>
            ) : (
              <>
                {user?.imageUrl && (
                  <AvatarImage
                    src={user.imageUrl}
                    alt={user?.fullName || "User"}
                  />
                )}
                <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground">
                  {user?.fullName?.[0] || "U"}
                </AvatarFallback>
              </>
            )}
          </Avatar>
          {getChatOnlineStatus(chat) && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-center">
            <div className="font-medium text-foreground flex items-center gap-1 truncate">
              <span className="truncate">{getChatDisplayName(chat)}</span>
              {isGroupChat(chat) && chat.participants && (
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
            {isTypingInChat(chat.id) ? (
              <span className="text-primary font-medium animate-pulse">
                {getTypingUserName(chat.id)}
              </span>
            ) : chat.lastMessage ? (
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
                {chat.lastMessage.length > 20
                  ? `${chat.lastMessage.slice(0, 20)}...`
                  : chat.lastMessage}
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
