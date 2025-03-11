import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  MoreHorizontal,
  PhoneCall,
  Users,
  Video,
} from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Chat } from "@/types";

interface ChatHeaderProps {
  chat: Chat;
  onMobileMenuClick?: () => void;
  isMobileSidebarOpen?: boolean;
}

export function ChatHeader({
  chat,
  onMobileMenuClick,
  isMobileSidebarOpen,
}: ChatHeaderProps) {
  return (
    <div className="p-3 border-b border-border flex items-center justify-between sticky top-0 bg-background/95 backdrop-blur-sm z-10">
      <div className="flex items-center gap-3">
        {!isMobileSidebarOpen && (
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden mr-1"
            onClick={onMobileMenuClick}
            aria-label="Back to chat list"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}

        <Avatar className="h-10 w-10 border border-border shadow-sm">
          <AvatarFallback
            className={cn(
              chat.isGroup
                ? "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground"
                : "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground"
            )}
          >
            {chat.isGroup ? (
              <Users className="h-5 w-5" />
            ) : (
              chat.name[0].toUpperCase()
            )}
          </AvatarFallback>
          {/* Add AvatarImage when you have images */}
        </Avatar>

        <div>
          <h3 className="font-medium text-foreground">{chat.name}</h3>
          <p className="text-xs text-muted-foreground">
            {chat.online ? (
              <span className="flex items-center">
                <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                Online
              </span>
            ) : (
              "Offline"
            )}
          </p>
        </div>
      </div>
      <div className="flex gap-1">
        <TooltipProvider delayDuration={300}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <PhoneCall className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Voice call</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon" className="hidden sm:flex">
                <Video className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>Video call</TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreHorizontal className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>More options</TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
