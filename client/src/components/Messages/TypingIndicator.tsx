interface TypingIndicatorProps {
  name: string;
  isTyping?: boolean;
}

export function TypingIndicator({
  name,
  isTyping = false,
}: TypingIndicatorProps) {
  if (!isTyping) return null;

  return (
    <div className="flex items-center gap-2 text-sm text-muted-foreground ml-2">
      <div className="flex space-x-1">
        <span
          className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
          style={{ animationDelay: "0ms" }}
        ></span>
        <span
          className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
          style={{ animationDelay: "150ms" }}
        ></span>
        <span
          className="h-2 w-2 bg-primary/60 rounded-full animate-bounce"
          style={{ animationDelay: "300ms" }}
        ></span>
      </div>
      <span>{name} is typing...</span>
    </div>
  );
}
