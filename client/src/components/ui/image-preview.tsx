import React, { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ZoomIn, ZoomOut, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImagePreviewProps {
  src: string;
  alt?: string;
  className?: string;
}

export function ImagePreview({
  src,
  alt = "Preview",
  className,
}: ImagePreviewProps) {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const minZoom = 0.5;
  const maxZoom = 3;
  const zoomStep = 0.25;

  const handleZoomIn = () => {
    setScale((prevScale) => Math.min(prevScale + zoomStep, maxZoom));
  };

  const handleZoomOut = () => {
    setScale((prevScale) => Math.max(prevScale - zoomStep, minZoom));
  };

  const handleReset = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    // Only enable dragging when zoomed in
    if (scale > 1) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isDragging && scale > 1) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;

      // Calculate bounds to prevent dragging image out of view
      const containerWidth = containerRef.current?.clientWidth || 0;
      const containerHeight = containerRef.current?.clientHeight || 0;
      const imageWidth = imageRef.current?.width || 0;
      const imageHeight = imageRef.current?.height || 0;

      // Calculate the maximum distance the image can be moved in each direction
      const maxX = (imageWidth * scale - containerWidth) / 2;
      const maxY = (imageHeight * scale - containerHeight) / 2;

      // Apply bounds
      const boundedX = Math.max(Math.min(newX, maxX), -maxX);
      const boundedY = Math.max(Math.min(newY, maxY), -maxY);

      setPosition({ x: boundedX, y: boundedY });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    if (isDragging) {
      setIsDragging(false);
    }
  };

  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      handleZoomIn();
    } else {
      handleZoomOut();
    }
  };

  // Reset position when scale changes to 1 (original size)
  useEffect(() => {
    if (scale === 1) {
      setPosition({ x: 0, y: 0 });
    }
  }, [scale]);

  useEffect(() => {
    const container = containerRef.current;
    if (container) {
      container.addEventListener(
        "wheel",
        handleWheel as unknown as EventListener,
        {
          passive: false,
        }
      );

      return () => {
        container.removeEventListener(
          "wheel",
          handleWheel as unknown as EventListener
        );
      };
    }
  }, []);

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        ref={containerRef}
        className={cn(
          "overflow-hidden relative flex items-center justify-center bg-background/50 backdrop-blur-sm rounded-md select-none",
          scale > 1 ? "cursor-move" : "cursor-default",
          className
        )}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        style={{ touchAction: "none" }} // Prevent default touch actions
      >
        <img
          ref={imageRef}
          src={src}
          alt={alt}
          className="transition-all duration-200 ease-out"
          style={{
            transform: `scale(${scale}) translate(${position.x / scale}px, ${
              position.y / scale
            }px)`,
            transformOrigin: "center",
          }}
          draggable="false"
        />
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomOut}
          disabled={scale <= minZoom}
        >
          <ZoomOut className="h-4 w-4 mr-1" />
          <span>Zoom Out</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleReset}
          disabled={scale === 1 && position.x === 0 && position.y === 0}
        >
          <RotateCcw className="h-4 w-4 mr-1" />
          <span>Reset</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleZoomIn}
          disabled={scale >= maxZoom}
        >
          <ZoomIn className="h-4 w-4 mr-1" />
          <span>Zoom In</span>
        </Button>
      </div>
    </div>
  );
}
