import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface ImageThumbnailProps {
  src: string;
  alt?: string;
  onRemove: (e: React.MouseEvent) => void;
  onClick: () => void;
}

export function ImageThumbnail({
  src,
  alt = "Selected image",
  onRemove,
  onClick,
}: ImageThumbnailProps) {
  return (
    <div className="relative inline-block">
      <div
        className="group cursor-pointer rounded-md overflow-hidden border border-border shadow-sm hover:shadow-md transition-all"
        onClick={onClick}
      >
        <img
          src={src}
          alt={alt}
          className="h-24 max-w-xs rounded-md object-cover transition-transform group-hover:scale-105"
        />
        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
          <span className="text-white text-sm font-medium">View</span>
        </div>
      </div>
      <Button
        variant="destructive"
        size="icon"
        className="absolute -top-1 -right-1 h-6 w-6 rounded-full p-0 shadow-md"
        onClick={(e) => {
          e.stopPropagation();
          onRemove(e);
        }}
      >
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
