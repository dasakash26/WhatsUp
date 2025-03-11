import {
  SignedIn,
  SignedOut,
  SignInButton,
  UserButton,
} from "@clerk/clerk-react";
import { MessageCircle, Plus } from "lucide-react";
import { ModeToggle } from "./theme/mode-toggle";
import { cn } from "../lib/utils";
import { Button } from "./ui/button";
import { CreateConversationDialog } from "./Dialog/CreateConvDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Separator } from "@radix-ui/react-dropdown-menu";

export function Header() {
  return (
    <header className="w-16 md:w-20 shrink-0 border-r border-border bg-background/95 backdrop-blur-xl flex flex-col items-center py-4 md:py-6 gap-4 md:gap-6 transition-all hover:shadow-md hover:bg-background/98 relative">
      {/* Decorative background element */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <div className="absolute top-0 left-0 right-0 h-40 bg-gradient-to-b from-primary/20 to-transparent"></div>
        <div className="absolute bottom-0 left-0 right-0 h-40 bg-gradient-to-t from-primary/10 to-transparent"></div>
      </div>

      <div className="flex flex-col items-center gap-2 md:gap-3 group z-10">
        <div className="relative p-2 rounded-full bg-primary/5 group-hover:bg-primary/10 transition-all overflow-hidden">
          <MessageCircle className="w-7 h-7 md:w-8 md:h-8 text-primary transform transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
          {/* Pulse animation on hover */}
          <span className="absolute inset-0 rounded-full opacity-0 group-hover:opacity-100 animate-ping bg-primary/20 duration-1000"></span>
        </div>
        <span
          className={cn(
            "font-bold text-xs bg-gradient-to-b from-primary via-primary/80 to-primary/60 bg-clip-text text-transparent",
            "writing-mode-vertical md:block hidden"
          )}
        >
          WhatsUp
        </span>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div className="mt-2">
                <CreateConversationDialog />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Create new conversation</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Visual separator */}
      <div className="w-8 h-px bg-gradient-to-r from-transparent via-border to-transparent my-2"></div>

      <div className="flex flex-col items-center gap-4 md:gap-5 mt-auto z-10">
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <div>
                <ModeToggle />
              </div>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Toggle theme</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
        <SignedOut>
          <SignInButton mode="modal">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full bg-primary/10 p-2 text-primary hover:bg-primary/20 hover:scale-105 transition-all shadow-sm border-primary/20"
            >
              <span className="sr-only">Sign In</span>
              <span className="font-medium text-xs">In</span>
            </Button>
          </SignInButton>
        </SignedOut>
        <SignedIn>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="relative">
                  <UserButton
                    afterSignOutUrl="/"
                    appearance={{
                      elements: {
                        avatarBox:
                          "hover:scale-110 transition-transform duration-300 shadow-md ring-2 ring-background",
                      },
                    }}
                  />
                  {/* Online indicator */}
                  <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-background rounded-full"></span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Account settings</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </SignedIn>
      </div>
    </header>
  );
}
