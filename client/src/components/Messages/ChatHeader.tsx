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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useState } from "react";

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
  const [showDetails, setShowDetails] = useState(false);
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

        <div
          className="cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => setShowDetails(true)}
        >
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

      {/* Chat Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              {chat.name}
            </DialogTitle>
          </DialogHeader>

          <div className="flex flex-col items-center py-4">
            <Avatar className="h-24 w-24 border-2 border-border shadow-md mb-4">
              <AvatarFallback
                className={cn(
                  chat.isGroup
                    ? "bg-gradient-to-br from-primary/80 to-primary text-primary-foreground text-3xl"
                    : "bg-gradient-to-br from-secondary to-secondary/70 text-secondary-foreground text-3xl"
                )}
              >
                {chat.isGroup ? (
                  <Users className="h-12 w-12" />
                ) : (
                  chat.name[0].toUpperCase()
                )}
              </AvatarFallback>
            </Avatar>

            <div className="text-center">
              <p className="text-muted-foreground mb-2">
                Status:{" "}
                {chat.online ? (
                  <span className="text-green-500 font-medium flex items-center justify-center">
                    <span className="h-2 w-2 rounded-full bg-green-500 mr-1 animate-pulse"></span>
                    Online
                  </span>
                ) : (
                  <span className="text-muted-foreground">Offline</span>
                )}
              </p>

              {chat.isGroup && (
                <p className="text-sm text-muted-foreground">
                  Group · {chat.participants?.length || 0} participants
                </p>
              )}
            </div>

            <div className="flex gap-2 mt-6">
              <Button size="sm" className="flex items-center gap-1">
                <PhoneCall className="h-4 w-4" />
                Call
              </Button>
              <Button size="sm" className="flex items-center gap-1">
                <Video className="h-4 w-4" />
                Video
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
