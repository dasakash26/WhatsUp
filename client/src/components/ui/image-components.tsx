import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ImagePreview } from "./image-preview";

// Image Thumbnail Component
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

// Image Preview Dialog Component
interface ImagePreviewDialogProps {
  isOpen: boolean;
  onClose: (open: boolean) => void;
  onRemove: () => void;
  src: string | null;
}

export function ImagePreviewDialog({
  isOpen,
  onClose,
  onRemove,
  src,
}: ImagePreviewDialogProps) {
  if (!src) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-w-[90vw] w-full">
        <DialogTitle>Image Preview</DialogTitle>
        <ImagePreview
          src={src}
          alt="Preview"
          className="max-h-[80vh] w-full h-full"
        />
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onClose(false)}>
            Close
          </Button>
          <Button variant="destructive" onClick={onRemove}>
            Remove
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
