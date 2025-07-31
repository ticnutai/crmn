import { useState, useRef, useEffect } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import TimerWidget from "./timer-widget";
import DraggableButton from "./draggable-button";

export default function FloatingTimerCustom() {
  const [isOpen, setIsOpen] = useState(false);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpen && buttonRef.current && panelRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const panelRect = panelRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;

      // Calculate position below button
      let x = buttonRect.left;
      let y = buttonRect.bottom + 8;

      // Check if panel would overflow to the right
      if (x + panelRect.width > viewportWidth) {
        x = viewportWidth - panelRect.width - 16; // 16px margin from edge
      }

      // Always position below button, but adjust if needed
      if (y + panelRect.height > viewportHeight) {
        y = Math.max(buttonRect.top - panelRect.height - 8, 16); // Position above button but not too high
      }
      
      // Ensure panel doesn't go above viewport
      if (y < 16) {
        y = buttonRect.bottom + 8; // Force below if above viewport
      }

      // Ensure minimum margin from left edge
      if (x < 16) {
        x = 16;
      }

      setPosition({ x, y });
    }
  }, [isOpen]);

  return (
    <>
      <DraggableButton
        initialPosition={{ x: 24, y: 80 }}
        storageKey="timer-button-position"
        className="z-40"
      >
        <Button 
          ref={buttonRef}
          onClick={() => setIsOpen(!isOpen)}
          className={`
            w-16 h-16 rounded-full shadow-2xl 
            transition-all duration-300 hover:scale-110 hover:shadow-3xl
            bg-gradient-to-br from-indigo-500 via-blue-500 to-cyan-500 
            hover:from-indigo-600 hover:via-blue-600 hover:to-cyan-600
            border-4 border-white/30
            ring-2 ring-blue-200/50 ring-offset-2
          `}
          size="icon"
        >
          <Clock className="w-8 h-8 text-white drop-shadow-lg" />
        </Button>
      </DraggableButton>

      {isOpen && (
        <div
          ref={panelRef}
          className="fixed z-[45] shadow-2xl"
          style={{
            left: `${position.x}px`,
            top: `${position.y}px`,
            maxWidth: 'calc(100vw - 32px)',
            maxHeight: 'calc(100vh - 80px)',
            overflowY: 'auto'
          }}
        >
          <TimerWidget />
        </div>
      )}

      {isOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
}