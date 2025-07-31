import { useState } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import TimerWidget from "./timer-widget";

export default function FloatingTimerButton() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button 
          className={`
            fixed bottom-6 left-6 z-30 w-16 h-16 rounded-full shadow-2xl 
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
      </PopoverTrigger>
      <PopoverContent 
        side="top" 
        align="start" 
        className="p-0 border-0 shadow-2xl bg-transparent mr-4 z-[1000]"
        sideOffset={8}
        avoidCollisions={true}
        collisionPadding={20}
        alignOffset={-16}
      >
        <TimerWidget />
      </PopoverContent>
    </Popover>
  );
}