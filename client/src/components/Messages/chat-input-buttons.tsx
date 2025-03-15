import { Button } from "@/components/ui/button";
import { PaperclipIcon, Send, SmileIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";

interface AttachmentButtonProps {
  onClick: () => void;
}

export function AttachmentButton({ onClick }: AttachmentButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="text-muted-foreground rounded-full"
            onClick={onClick}
          >
            <PaperclipIcon className="h-5 w-5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Attach image</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface SendButtonProps {
  onClick: () => void;
  disabled: boolean;
}

export function SendButton({ onClick, disabled }: SendButtonProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            size="icon"
            onClick={onClick}
            className={cn(
              "rounded-full bg-primary hover:bg-primary/90 transition-all",
              disabled ? "opacity-70" : "opacity-100"
            )}
            disabled={disabled}
          >
            <Send className="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Send message</TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

interface EmojiPickerButtonProps {
  onEmojiSelect: (emojiData: EmojiClickData) => void;
}

export function EmojiPickerButton({ onEmojiSelect }: EmojiPickerButtonProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="absolute right-1 top-1/2 -translate-y-1/2 text-muted-foreground rounded-full"
        >
          <SmileIcon className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent
        className="p-0 border w-auto"
        side="top"
        align="end"
        alignOffset={-40}
        sideOffset={10}
      >
        <div
          className="emoji-picker-container"
          style={{ maxHeight: "350px", overflow: "hidden" }}
        >
          <EmojiPicker
            onEmojiClick={onEmojiSelect}
            width={320}
            height={350}
            lazyLoadEmojis={true}
            skinTonesDisabled
            searchDisabled={false}
            previewConfig={{ showPreview: false }}
          />
        </div>
      </PopoverContent>
    </Popover>
  );
}
