import { useState, useEffect } from "react";
import { Wifi, WifiOff, RotateCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface SyncStatusProps {
  isOnline?: boolean;
  lastSync?: number;
  pendingActions?: number;
  className?: string;
}

export default function SyncStatusIndicator({ 
  isOnline = true, 
  lastSync = Date.now(), 
  pendingActions = 0,
  className = "" 
}: SyncStatusProps) {
  const [currentTime, setCurrentTime] = useState(Date.now());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 30000); // Update every 30 seconds

    return () => clearInterval(timer);
  }, []);

  const getTimeSinceLastSync = () => {
    const diff = currentTime - lastSync;
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "עכשיו";
    if (minutes < 60) return `לפני ${minutes} דקות`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `לפני ${hours} שעות`;
    
    const days = Math.floor(hours / 24);
    return `לפני ${days} ימים`;
  };

  if (!isOnline) {
    return (
      <Badge variant="destructive" className={`text-xs ${className}`}>
        <WifiOff className="w-3 h-3 ml-1" />
        לא מחובר
      </Badge>
    );
  }

  if (pendingActions > 0) {
    return (
      <Badge variant="secondary" className={`text-xs ${className}`}>
        <RotateCw className="w-3 h-3 ml-1 animate-spin" />
        מסנכרן ({pendingActions})
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className={`text-xs opacity-70 ${className}`}>
      <Wifi className="w-3 h-3 ml-1" />
      {getTimeSinceLastSync()}
    </Badge>
  );
}