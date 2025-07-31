import { Search, Bell, Settings, Clock, Database, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/hooks/useAuth";
import NotificationSystem from "@/components/notification-system";
import ChatVideoSystem from "@/components/chat-video-system";
import MiniSystemStatus from "./mini-system-status";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useState } from "react";
import TimerWidget from "./timer-widget";
import ImportExportDialog from "./import-export-dialog";

interface TopBarProps {
  onSettingsClick: () => void;
}

export default function TopBar({ onSettingsClick }: TopBarProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const { user, logout } = useAuth();

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Notification System */}
          <NotificationSystem />
          
          {/* Chat Video System */}
          <ChatVideoSystem />
          
          {/* Mini System Status */}
          <MiniSystemStatus />
        </div>

        <div className="flex items-center gap-4">
          {/* Search */}
          <div className="relative">
            <Input
              type="search"
              placeholder="חיפוש לקוחות..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-64 pl-10 pr-4"
            />
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          </div>

          {/* Timer */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon" className="relative">
                <Clock className="w-5 h-5" />
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-auto p-0 max-w-[90vw]" sideOffset={8}>
              <TimerWidget />
            </PopoverContent>
          </Popover>

          {/* Import/Export */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setIsImportExportOpen(true)}
            title="ייבוא/ייצוא נתונים"
          >
            <Database className="w-5 h-5" />
          </Button>

          {/* User Info and Logout */}
          <div className="flex items-center gap-2 pr-2 border-r border-gray-200">
            <User className="w-4 h-4 text-gray-600" />
            <span className="text-sm text-gray-700">{user?.email || user?.username}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              title="יציאה"
              className="text-red-600 hover:text-red-700 hover:bg-red-50"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
          
        </div>
      </div>

      <ImportExportDialog 
        open={isImportExportOpen} 
        onOpenChange={setIsImportExportOpen} 
      />
    </header>
  );
}
