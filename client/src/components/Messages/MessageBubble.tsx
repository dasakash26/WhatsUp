import { cn } from "@/lib/utils";
import { Message } from "@/types";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  ReplyIcon,
  HeartIcon,
  MoreHorizontalIcon,
  ZoomIn,
  ZoomOut,
  X,
} from "lucide-react";
import { useState, useRef } from "react";

interface MessageBubbleProps {
  isFromCurrentUser: boolean;
  message: Message;
  formatMessageTime: (timestamp?: string) => string;
}

export function MessageBubble({
  isFromCurrentUser,
  message,
  formatMessageTime,
}: MessageBubbleProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const imageRef = useRef<HTMLDivElement>(null);

  const handleZoomIn = () => {
    setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  };

  const handleZoomOut = () => {
    setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));
  };

  const handleImageClick = () => {
    if (message.image && !imageError) {
      setIsPreviewOpen(true);
      setZoomLevel(1); // Reset zoom when opening
    }
  };

  const closePreview = () => {
    setIsPreviewOpen(false);
  };

  if (message.senderId === "system") {
    return (
      <div className="flex justify-center py-2 px-4">
        <div className="bg-muted/70 text-muted-foreground text-xs italic px-4 py-1.5 rounded-full shadow-sm backdrop-blur-sm border border-muted/30 transition-all duration-300 hover:bg-muted">
          {message.text}
          {message.createdAt && (
            <span className="ml-2 opacity-70">
              {formatMessageTime(message.createdAt)}
            </span>
          )}
        </div>
      </div>
    );
  }

  return (
    <>
      <div
        className={cn(
          "flex animate-fade-in items-end gap-3 group py-2 px-4 relative",
          "hover:bg-muted/10 transition-colors duration-200 rounded-lg",
          isFromCurrentUser ? "justify-end" : "justify-start"
        )}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {!isFromCurrentUser && (
          <Avatar className="h-9 w-9 ring-2 ring-muted/20 hover:ring-muted/30 transition-all duration-300 hover:scale-105 shrink-0">
            <AvatarImage
              src={message.senderAvatar || ""}
              alt={message.senderName || "User"}
              className="object-cover"
            />
            <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-muted/60 to-muted/40">
              {message.senderName?.[0] || "U"}
            </AvatarFallback>
          </Avatar>
        )}

        <div
          className={cn(
            "max-w-[85%] sm:max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-3",
            "shadow-sm transition-all duration-200 hover:shadow-md",
            "relative",
            isFromCurrentUser
              ? "bg-gradient-to-br from-primary to-primary/85 text-primary-foreground rounded-br-none"
              : "bg-gradient-to-br from-card to-card/95 text-card-foreground rounded-bl-none border",
            "before:content-[''] before:absolute before:w-4 before:h-4 before:bg-inherit",
            isFromCurrentUser
              ? "before:-right-4 before:bottom-0 before:clip-path-[polygon(100% 0, 0 0, 100% 100%)]"
              : "before:-left-4 before:bottom-0 before:clip-path-[polygon(0 0, 0 100%, 100% 0)]"
          )}
        >
          {!isFromCurrentUser && (
            <p className="text-sm font-semibold text-foreground/90 mb-1.5 tracking-wide flex items-center gap-2">
              <span className="hover:underline cursor-pointer">
                {message.senderName || "User"}
              </span>
              <span className="text-xs font-normal text-muted-foreground/70">
                {formatMessageTime(message.createdAt)}
              </span>
            </p>
          )}
          {message.image && !imageError ? (
            <div className="mb-2">
              <img
                src={message.image}
                alt="Message attachment"
                className="rounded-lg max-h-[300px] w-auto object-contain cursor-pointer hover:opacity-90 transition-opacity"
                onError={() => setImageError(true)}
                onClick={handleImageClick}
              />
            </div>
          ) : null}
          {(message.text || imageError) && (
            <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">
              {imageError && message.image ? "Unable to load image: " : ""}
              {message.text}
            </p>
          )}
          {isFromCurrentUser && (
            <div className="flex items-center gap-1.5 mt-2 justify-end">
              <span className="text-xs opacity-80 font-medium">
                {formatMessageTime(message.createdAt)}
              </span>
              <span className="flex items-center gap-0.5">
                {message.status === "SENT" && (
                  <span className="text-primary-foreground/70 text-xs">✓</span>
                )}
                {message.status === "DELIVERED" && (
                  <span className="text-primary-foreground/70 text-xs">✓✓</span>
                )}
                {message.status === "READ" && (
                  <span className="text-blue-300 text-xs font-medium">✓✓</span>
                )}
              </span>
            </div>
          )}
        </div>

        <div
          className={cn(
            "absolute bottom-0 translate-y-full transition-opacity duration-200 z-10",
            isFromCurrentUser ? "right-12" : "left-12",
            isHovered ? "opacity-100" : "opacity-0"
          )}
        >
          <div className="flex items-center gap-1 bg-background border shadow-md rounded-full p-1 mt-1">
            <button className="p-1 rounded-full hover:bg-muted transition-colors">
              <ReplyIcon size={14} className="text-muted-foreground" />
            </button>
            <button className="p-1 rounded-full hover:bg-muted transition-colors">
              <HeartIcon size={14} className="text-muted-foreground" />
            </button>
            <button className="p-1 rounded-full hover:bg-muted transition-colors">
              <MoreHorizontalIcon size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {isFromCurrentUser && (
          <Avatar className="h-9 w-9 ring-2 ring-primary/20 hover:ring-primary/30 transition-all duration-300 hover:scale-105 shrink-0">
            <AvatarImage
              src={message.senderAvatar || ""}
              alt="You"
              className="object-cover"
            />
            <AvatarFallback className="text-sm font-medium bg-gradient-to-br from-primary/30 to-primary/10">
              Y
            </AvatarFallback>
          </Avatar>
        )}
      </div>

      {/* Image Preview Modal */}
      {isPreviewOpen && message.image && (
        <div
          className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4 backdrop-blur-sm"
          onClick={closePreview}
        >
          <div
            className="relative max-w-[90vw] max-h-[90vh] overflow-hidden"
            ref={imageRef}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-2 right-2 flex items-center gap-2 z-10">
              <button
                onClick={handleZoomOut}
                className="bg-background/30 hover:bg-background/50 p-2 rounded-full backdrop-blur-sm text-white transition-colors"
              >
                <ZoomOut size={18} />
              </button>
              <button
                onClick={handleZoomIn}
                className="bg-background/30 hover:bg-background/50 p-2 rounded-full backdrop-blur-sm text-white transition-colors"
              >
                <ZoomIn size={18} />
              </button>
              <button
                onClick={closePreview}
                className="bg-background/30 hover:bg-background/50 p-2 rounded-full backdrop-blur-sm text-white transition-colors"
              >
                <X size={18} />
              </button>
            </div>
            <div
              className="overflow-auto max-w-full max-h-[90vh] flex items-center justify-center"
              style={{ width: "100%", height: "100%" }}
            >
              <img
                src={message.image}
                alt="Image preview"
                className="transform transition-transform duration-200"
                style={{
                  transform: `scale(${zoomLevel})`,
                  maxWidth: "100%",
                  maxHeight: "100%",
                  objectFit: "contain",
                }}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
