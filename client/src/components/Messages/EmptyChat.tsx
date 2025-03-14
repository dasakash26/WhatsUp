import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Menu, Send } from "lucide-react";

interface EmptyChatProps {
  className?: string;
  onMobileMenuClick?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function EmptyChat({
  className,
  onMobileMenuClick,
  isMobileSidebarOpen,
}: EmptyChatProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center h-full bg-background/60 px-4",
        className
      )}
    >
      <div className="text-center space-y-4 max-w-xs p-6 bg-card rounded-lg shadow-sm animate-fade-in">
        <div className="mx-auto bg-primary/10 rounded-full p-4 w-20 h-20 flex items-center justify-center">
          <Send className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Start Messaging</h3>
        <p className="text-muted-foreground text-sm">
          Select a chat from the sidebar to start a conversation
        </p>
        {!isMobileSidebarOpen && (
          <Button
            variant="outline"
            onClick={onMobileMenuClick}
            className="md:hidden m-2 flex justify-center ml-16 items-center gap-2"
          >
            <Menu className="h-4 w-4" />
            <span>Open Chats</span>
          </Button>
        )}
      </div>
    </div>
  );
}
