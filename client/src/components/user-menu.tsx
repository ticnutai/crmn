import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useSimpleAuth } from '@/hooks/use-simple-auth';
import { User, LogOut, Building, Users, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserMenu() {
  const { user, isEmployee, isClient, logout } = useSimpleAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "התנתקת בהצלחה",
      description: "להתראות!",
    });
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="flex items-center gap-2 w-full justify-start">
          <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
            <User className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex-1 text-right">
            <div className="text-sm font-medium">{user.name}</div>
            <div className="text-xs text-gray-500">{user.email}</div>
          </div>
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent className="w-56" align="start">
        <DropdownMenuLabel className="flex items-center gap-2">
          <User className="w-4 h-4" />
          פרטי משתמש
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <div className="px-2 py-1">
          <Badge 
            variant={isEmployee ? "default" : "secondary"}
            className="flex items-center gap-1 w-fit"
          >
            {isEmployee ? (
              <>
                <Building className="w-3 h-3" />
                עובד חברה
              </>
            ) : (
              <>
                <Users className="w-3 h-3" />
                לקוח
              </>
            )}
          </Badge>
        </div>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem className="flex items-center gap-2 cursor-pointer">
          <Settings className="w-4 h-4" />
          הגדרות פרופיל
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-red-600 focus:text-red-600"
        >
          <LogOut className="w-4 h-4" />
          התנתק
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}