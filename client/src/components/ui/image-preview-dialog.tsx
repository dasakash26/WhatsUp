import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ImagePreview } from "./image-preview";

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
      <DialogContent className="sm:max-w-md">
        <DialogTitle>Image Preview</DialogTitle>
        <ImagePreview
          src={src}
          alt="Preview"
          className="max-h-[70vh] w-full h-full"
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
