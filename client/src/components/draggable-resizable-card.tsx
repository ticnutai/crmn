import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Move, Maximize2, Minimize2, X } from "lucide-react";

interface DraggableResizableCardProps {
  children: React.ReactNode;
  title: string;
  onClose?: () => void;
  initialPosition?: { x: number; y: number };
  initialSize?: { width: number; height: number };
  minWidth?: number;
  minHeight?: number;
}

export function DraggableResizableCard({
  children,
  title,
  onClose,
  initialPosition = { x: 100, y: 100 },
  initialSize = { width: 800, height: 600 },
  minWidth = 400,
  minHeight = 300
}: DraggableResizableCardProps) {
  const [position, setPosition] = useState(initialPosition);
  const [size, setSize] = useState(initialSize);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeStart, setResizeStart] = useState({ x: 0, y: 0, width: 0, height: 0 });
  
  const cardRef = useRef<HTMLDivElement>(null);

  // Handle dragging
  const handleMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  // Handle resizing
  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (isMaximized) return;
    e.stopPropagation();
    setIsResizing(true);
    setResizeStart({
      x: e.clientX,
      y: e.clientY,
      width: size.width,
      height: size.height
    });
  };

  // Mouse move handler
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging && !isMaximized) {
        setPosition({
          x: e.clientX - dragStart.x,
          y: e.clientY - dragStart.y
        });
      }
      
      if (isResizing && !isMaximized) {
        const newWidth = Math.max(minWidth, resizeStart.width + (e.clientX - resizeStart.x));
        const newHeight = Math.max(minHeight, resizeStart.height + (e.clientY - resizeStart.y));
        setSize({ width: newWidth, height: newHeight });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
      setIsResizing(false);
    };

    if (isDragging || isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, isResizing, dragStart, resizeStart, minWidth, minHeight, isMaximized]);

  const toggleMaximize = () => {
    setIsMaximized(!isMaximized);
  };

  return (
    <div
      ref={cardRef}
      className={`fixed bg-white shadow-2xl border rounded-lg z-50 ${
        isMaximized ? 'inset-4' : ''
      }`}
      style={{
        left: isMaximized ? 'auto' : position.x,
        top: isMaximized ? 'auto' : position.y,
        width: isMaximized ? 'auto' : size.width,
        height: isMaximized ? 'auto' : size.height,
        cursor: isDragging ? 'grabbing' : 'default'
      }}
    >
      {/* Header with drag handle */}
      <div
        className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
      >
        <div className="flex items-center gap-2">
          <Move className="w-4 h-4 text-gray-500" />
          <h3 className="font-semibold text-gray-900">{title}</h3>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMaximize}
            className="h-8 w-8 p-0"
          >
            {isMaximized ? (
              <Minimize2 className="w-4 h-4" />
            ) : (
              <Maximize2 className="w-4 h-4" />
            )}
          </Button>
          {onClose && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div 
        className="p-4 overflow-auto"
        style={{ 
          height: isMaximized ? 'calc(100% - 64px)' : size.height - 64
        }}
      >
        {children}
      </div>

      {/* Resize handle */}
      {!isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize bg-gray-300 hover:bg-gray-400 transition-colors"
          onMouseDown={handleResizeMouseDown}
          style={{
            background: 'linear-gradient(-45deg, transparent 0%, transparent 30%, #666 30%, #666 32%, transparent 32%, transparent 63%, #666 63%, #666 65%, transparent 65%)'
          }}
        />
      )}
    </div>
  );
}