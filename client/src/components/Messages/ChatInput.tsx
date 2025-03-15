import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PaperclipIcon, Send, SmileIcon } from "lucide-react";
import { RefObject, useEffect, useRef, useState } from "react";
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
import { useChat } from "@/contexts/ChatContext";
import { useDebounce } from "@/hooks/useDebounce";
import EmojiPicker, { EmojiClickData } from "emoji-picker-react";
import {
  ImageThumbnail,
  ImagePreviewDialog,
} from "@/components/ui/image-components";

interface ChatInputProps {
  inputMessage: string;
  setInputMessage: (value: string) => void;
  selectedImage: File | null;
  setSelectedImage: (file: File | null) => void;
  handleSendMessage: () => void;
  inputRef: RefObject<HTMLInputElement>;
  isConnected?: boolean;
  conversationId: string;
}

function AttachmentButton({ onClick }: { onClick: () => void }) {
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

function SendButton({
  onClick,
  disabled,
}: {
  onClick: () => void;
  disabled: boolean;
}) {
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

function EmojiPickerButton({
  onEmojiSelect,
}: {
  onEmojiSelect: (emojiData: EmojiClickData) => void;
}) {
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

export function ChatInput({
  inputMessage,
  setInputMessage,
  selectedImage,
  setSelectedImage,
  handleSendMessage,
  inputRef,
  conversationId,
}: ChatInputProps) {
  const [isTyping, setIsTyping] = useState(false);
  const { setTyping } = useChat();
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewDialogOpen, setPreviewDialogOpen] = useState(false);

  useDebounce(
    () => {
      if (conversationId && isTyping) {
        setTyping(conversationId, false);
        setIsTyping(false);
      }
    },
    2000,
    [isTyping, conversationId]
  );

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessageAndClearImage();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputMessage(newValue);

    if (!conversationId) return;

    if (newValue.length > 0 && !isTyping) {
      setIsTyping(true);
      setTyping(conversationId, true);
    } else if (newValue.length === 0 && isTyping) {
      setIsTyping(false);
      setTyping(conversationId, false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];

      // Check if file is an image and not too large (10MB limit)
      if (!file.type.startsWith("image/")) {
        alert("Please select an image file");
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        alert("Image must be smaller than 10MB");
        return;
      }

      setSelectedImage(file);
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
    }
  };

  const clearSelectedImage = () => {
    setSelectedImage(null);
    if (imagePreview) {
      URL.revokeObjectURL(imagePreview);
    }
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const sendMessageAndClearImage = () => {
    handleSendMessage();
    if (selectedImage) {
      clearSelectedImage();
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    const emoji = emojiData.emoji;
    const cursorPosition =
      inputRef.current?.selectionStart || inputMessage.length;
    const updatedMessage =
      inputMessage.slice(0, cursorPosition) +
      emoji +
      inputMessage.slice(cursorPosition);

    setInputMessage(updatedMessage);

    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        const newPosition = cursorPosition + emoji.length;
        inputRef.current.setSelectionRange(newPosition, newPosition);
      }
    }, 0);
  };

  useEffect(() => {
    return () => {
      if (isTyping && conversationId) {
        setTyping(conversationId, false);
      }

      // Clean up image preview URL when component unmounts
      if (imagePreview) {
        URL.revokeObjectURL(imagePreview);
      }
    };
  }, [isTyping, conversationId, setTyping, imagePreview]);

  useEffect(() => {
    if (isTyping) {
      setIsTyping(false);
      setTyping(conversationId, false);
    }
  }, [conversationId]);

  return (
    <div className="p-3 border-t border-border bg-background/95 backdrop-blur-sm">
      {imagePreview && (
        <div className="mb-2">
          <ImageThumbnail
            src={imagePreview}
            onClick={() => setPreviewDialogOpen(true)}
            onRemove={() => clearSelectedImage()}
          />
        </div>
      )}

      <ImagePreviewDialog
        isOpen={previewDialogOpen}
        onClose={setPreviewDialogOpen}
        onRemove={clearSelectedImage}
        src={imagePreview}
      />

      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageUpload}
          id="image-upload"
        />

        <AttachmentButton onClick={() => fileInputRef.current?.click()} />

        <div className="relative flex-1">
          <input
            ref={inputRef}
            type="text"
            placeholder="Type a message..."
            className="w-full px-4 py-2.5 rounded-full bg-accent/50 border border-input focus:outline-none focus:ring-1 focus:ring-ring pr-10"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyDown={handleKeyPress}
          />
          <EmojiPickerButton onEmojiSelect={handleEmojiClick} />
        </div>

        <SendButton
          onClick={sendMessageAndClearImage}
          disabled={!inputMessage.trim() && !selectedImage}
        />
      </div>
    </div>
  );
}
