import { useState, useRef, useEffect, ReactNode } from "react";

interface DraggableButtonProps {
  children: ReactNode;
  initialPosition?: { x: number; y: number };
  onPositionChange?: (position: { x: number; y: number }) => void;
  className?: string;
  storageKey?: string; // For localStorage persistence
}

export default function DraggableButton({ 
  children, 
  initialPosition = { x: 24, y: 24 }, 
  onPositionChange,
  className = "",
  storageKey
}: DraggableButtonProps) {
  const [position, setPosition] = useState(initialPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLDivElement>(null);

  // Load position from localStorage on mount
  useEffect(() => {
    if (storageKey) {
      const savedPosition = localStorage.getItem(storageKey);
      if (savedPosition) {
        try {
          const parsed = JSON.parse(savedPosition);
          setPosition(parsed);
        } catch (error) {
          
        }
      }
    }
  }, [storageKey]);

  // Save position to localStorage when it changes
  useEffect(() => {
    if (storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(position));
    }
    onPositionChange?.(position);
  }, [position, onPositionChange, storageKey]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return; // Only handle left click
    
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
    
    e.preventDefault();
    e.stopPropagation();
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    
    // Constrain to viewport
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    const buttonWidth = buttonRect?.width || 64;
    const buttonHeight = buttonRect?.height || 64;
    
    const constrainedX = Math.max(0, Math.min(window.innerWidth - buttonWidth, newX));
    const constrainedY = Math.max(0, Math.min(window.innerHeight - buttonHeight, newY));
    
    setPosition({ x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
    
    e.preventDefault();
    e.stopPropagation();
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (!isDragging) return;

    const touch = e.touches[0];
    const newX = touch.clientX - dragStart.x;
    const newY = touch.clientY - dragStart.y;
    
    // Constrain to viewport
    const buttonRect = buttonRef.current?.getBoundingClientRect();
    const buttonWidth = buttonRect?.width || 64;
    const buttonHeight = buttonRect?.height || 64;
    
    const constrainedX = Math.max(0, Math.min(window.innerWidth - buttonWidth, newX));
    const constrainedY = Math.max(0, Math.min(window.innerHeight - buttonHeight, newY));
    
    setPosition({ x: constrainedX, y: constrainedY });
    e.preventDefault();
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  // Add event listeners for mouse/touch events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: false });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragStart]);

  return (
    <div
      ref={buttonRef}
      className={`fixed z-50 transition-none select-none touch-none ${
        isDragging ? 'cursor-grabbing' : 'cursor-grab'
      } ${className}`}
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? 'scale(1.05)' : 'scale(1)',
        opacity: isDragging ? 0.8 : 1,
      }}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
    >
      {children}
    </div>
  );
}