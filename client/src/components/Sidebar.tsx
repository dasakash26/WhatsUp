import { useChat } from "@/contexts/ChatContext";
import { cn } from "../lib/utils";
import { Search, User, Users, X, Plus, FilterIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@clerk/clerk-react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

const ChatSkeleton = () => (
  <div className="p-3 flex items-center gap-3">
    <Skeleton className="h-12 w-12 rounded-full" />
    <div className="space-y-2 flex-1">
      <div className="flex justify-between">
        <Skeleton className="h-4 w-24" />
        <Skeleton className="h-3 w-10" />
      </div>
      <Skeleton className="h-3 w-32" />
    </div>
  </div>
);

export function Sidebar({
  className,
  isMobileOpen,
  onMobileClose,
  ...props
}: SidebarProps) {
  const { chats, isLoading, activeChat, setActiveChat } = useChat();
  const [searchTerm, setSearchTerm] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);
  const { userId } = useAuth();

  // Fix state management issue by properly tracking the visibility state
  useEffect(() => {
    // Ensure proper visibility on mount and state changes
    if (window.innerWidth >= 768 || isMobileOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }

    // Add proper event listener for window resize
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsVisible(true);
      } else if (!isMobileOpen) {
        setIsVisible(false);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobileOpen]);

  // Filter chats based on search term
  const filteredChats = searchTerm
    ? chats.filter((chat) =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : chats;

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

  // Handle chat selection and close sidebar on mobile
  const handleChatSelection = (chat: any) => {
    setActiveChat(chat);
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
      {/* Mobile overlay - only show when sidebar is open on mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-background/70 backdrop-blur-sm z-40 md:hidden"
          onClick={onMobileClose}
          aria-hidden="true"
        />
      )}

      <aside
        ref={sidebarRef}
        style={{ visibility: isVisible ? "visible" : "hidden" }}
        className={cn(
          "bg-background h-full flex flex-col border-r",
          isMobileOpen ? "left-0" : "-left-full md:left-0",
          "fixed md:static z-50 w-[280px] max-w-[85%] md:max-w-none md:w-auto shadow-lg md:shadow-none",
          "transition-[left] duration-300 ease-in-out",
          className
        )}
        {...props}
      >
        {/* Mobile header */}
        <div className="bg-gradient-to-r from-primary to-primary/90 p-4 text-primary-foreground flex justify-between items-center md:hidden">
          <h2 className="font-bold text-xl">WhatsUp</h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onMobileClose}
            className="hover:bg-primary-foreground/10 text-primary-foreground"
            aria-label="Close sidebar"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <div className="p-3 pb-4 border-b flex items-center justify-between gap-2">
          {/* Search section */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              type="text"
              placeholder="Search chats..."
              className="pl-9 pr-4 w-full rounded-full bg-accent/40 focus:bg-accent/60 transition-colors"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <FilterIcon className="h-5 w-5 text-muted-foreground" />
        </div>

        <ScrollArea className="flex-1">
          <div className="space-y-1 p-2">
            {isLoading ? (
              // Loading state skeletons
              Array(5)
                .fill(0)
                .map((_, index) => (
                  <Card key={index} className="p-0 overflow-hidden shadow-sm">
                    <ChatSkeleton />
                  </Card>
                ))
            ) : filteredChats.length > 0 ? (
              // Chat list
              filteredChats.map((chat) => (
                <Card
                  key={chat.id}
                  className={cn(
                    "p-0 overflow-hidden hover:bg-accent/50 cursor-pointer transition-all duration-200 border-0",
                    "transform hover:-translate-y-[1px] active:translate-y-[1px]",
                    activeChat?.id === chat.id && "bg-accent shadow-md"
                  )}
                  onClick={() => handleChatSelection(chat)}
                >
                  {/* Chat item content */}
                  <div className="p-3 flex items-center gap-3">
                    {/* Avatar section */}
                    <div className="relative flex-shrink-0">
                      <Avatar className="h-12 w-12 border border-border shadow-sm">
                        {/* Avatar fallback */}
                        {chat.isGroup ? (
                          <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                            <Users className="h-6 w-6" />
                          </AvatarFallback>
                        ) : (
                          <AvatarFallback className="bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground">
                            <User className="h-5 w-5" />
                          </AvatarFallback>
                        )}
                      </Avatar>
                      {/* Online indicator */}
                      {chat.online && (
                        <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background animate-pulse" />
                      )}
                    </div>

                    {/* Chat details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-center">
                        <div className="font-medium text-foreground flex items-center gap-1 truncate">
                          <span className="truncate">{chat.name}</span>
                          {chat.isGroup && (
                            <Badge
                              variant="secondary"
                              className="text-xs ml-1 py-0 h-5"
                            >
                              Group
                            </Badge>
                          )}
                        </div>
                        {/* Timestamp */}
                        {chat.lastMessageTime && (
                          <span className="text-xs text-muted-foreground whitespace-nowrap ml-1">
                            {formatTime(chat.lastMessageTime)}
                          </span>
                        )}
                      </div>

                      {/* Last message with sender indication for groups */}
                      <div className="text-xs text-muted-foreground truncate mt-1">
                        {chat.isGroup && chat.lastMessageSenderId && (
                          <span
                            className={
                              chat.lastMessageSenderId === userId
                                ? "text-primary font-medium"
                                : "font-medium"
                            }
                          >
                            {chat.lastMessageSenderId === userId
                              ? "You: "
                              : "Someone: "}
                          </span>
                        )}
                        {chat.lastMessage || "No messages yet"}
                      </div>
                    </div>
                  </div>
                </Card>
              ))
            ) : (
              // Empty state
              <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2 p-4">
                <Search className="h-5 w-5 opacity-50" />
                <p className="text-center text-sm">No chats found</p>
              </div>
            )}
          </div>
        </ScrollArea>
      </aside>
    </>
  );
}
