import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { X, Search } from "lucide-react";
import { useChat } from "@/contexts/ChatContext";
import { cn } from "@/lib/utils";
import { useAuth } from "@clerk/clerk-react";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatSkeleton } from "@/components/chat/ChatSkeleton";
import { ChatListItem } from "@/components/chat/ChatListItem";
import { SearchBar } from "@/components/chat/SearchBar";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
}

export function Sidebar({
  className,
  isMobileOpen = false,
  onMobileClose,
  ...props
}: SidebarProps) {
  const [isLoading, setIsLoading] = useState(true);
  const {
    currentConversationId,
    setCurrentConversationId,
    conversations,
    loadConversations,
  } = useChat();
  const { userId } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const sidebarRef = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const fetchConversations = async () => {
      setIsLoading(true);
      try {
        await loadConversations();
        setIsLoading(false);
      } catch (error) {
        console.error("Error fetching conversations:", error);
        setIsLoading(false);
      }
    };

    fetchConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (window.innerWidth >= 768 || isMobileOpen) {
      setIsVisible(true);
    } else {
      setIsVisible(false);
    }

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
    ? conversations.filter((chat) =>
        chat.name.toLowerCase().includes(searchTerm.toLowerCase())
      )
    : conversations;

  const handleChatSelection = (chatId: string) => {
    setCurrentConversationId(chatId);
    if (isMobileOpen && onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <>
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
          "fixed md:static z-50 w-[320px] max-w-[90%] md:max-w-none md:w-auto shadow-lg md:shadow-none",
          "transition-[left] duration-300 ease-in-out",
          className
        )}
        {...props}
      >
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

        <SearchBar searchTerm={searchTerm} onSearchChange={setSearchTerm} />

        <div className="flex-1 flex flex-col min-h-0">
          <ScrollArea className="h-full border">
            <div className="space-y-1 p-2">
              {isLoading ? (
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
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isActive={currentConversationId === chat.id}
                    userId={userId ?? null}
                    onClick={() => handleChatSelection(chat.id)}
                  />
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-32 text-muted-foreground gap-2 p-4">
                  <Search className="h-5 w-5 opacity-50" />
                  <p className="text-center text-sm">No chats found</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </aside>
    </>
  );
}
