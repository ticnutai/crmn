import { useState, useEffect } from "react";
import { Clock, Play, Pause, Save, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Client, TimeEntry } from "@shared/schema";
import TimeInsightsTooltip from "./time-insights-tooltip";
import SimpleNotificationTest from "./simple-notification-test";
import WorkingNotificationTest from "./working-notification-test";

export default function TimerWidget() {
  const { user } = useAuth();
  const [activeTimer, setActiveTimer] = useState<TimeEntry | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showNotesDialog, setShowNotesDialog] = useState(false);
  const [notes, setNotes] = useState("");
  const [savedTimerId, setSavedTimerId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch clients for timer selection
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  // Fetch active time entries
  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  // Create time entry mutation
  const createTimeEntryMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("/api/time-entries", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
  });

  // Update time entry mutation
  const updateTimeEntryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      const response = await apiRequest(`/api/time-entries/${id}`, "PATCH", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
    },
  });

  // Generate unique session ID for this browser/tab
  const [sessionId] = useState(() => {
    const stored = localStorage.getItem('timer-session-id');
    if (stored) return stored;
    const newId = `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('timer-session-id', newId);
    return newId;
  });

  // Find active timer from database entries - ONLY for current user
  useEffect(() => {
    if (!user) return;
    
    console.log("TimeEntries data for user:", user.email, timeEntries.length);
    // Filter entries by current user - include both running and paused
    const userRunningEntries = timeEntries.filter(entry => 
      entry.isActive && 
      !entry.endTime && 
      entry.userId === user.id
    );
    console.log("Found active entries for current user:", userRunningEntries.length);
    
    if (userRunningEntries.length > 1) {
      // יש יותר מטיימר אחד פעיל למשתמש הזה - נעצור את כולם חוץ מהאחרון
      console.log("Multiple active timers found for user, stopping old ones");
      const latestEntry = userRunningEntries.sort((a, b) => 
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime()
      )[0];
      
      // עצור את שאר הטיימרים של המשתמש הזה
      userRunningEntries.forEach(async (entry) => {
        if (entry.id !== latestEntry.id) {
          console.log("Stopping old timer for user:", entry.id);
          try {
            await updateTimeEntryMutation.mutateAsync({
              id: entry.id,
              data: {
                endTime: new Date(),
                duration: Math.floor((Date.now() - new Date(entry.startTime).getTime()) / 1000),
                isActive: false,
              },
            });
          } catch (error) {
            console.error("Error stopping old timer:", error);
          }
        }
      });
      
      setActiveTimer(latestEntry);
      // If paused, use stored duration, otherwise calculate elapsed
      const elapsed = latestEntry.isPaused 
        ? (latestEntry.duration || 0)
        : Math.floor((Date.now() - new Date(latestEntry.startTime).getTime()) / 1000);
      setCurrentTime(elapsed);
      console.log("Set active timer to latest for user:", latestEntry.id, "elapsed:", elapsed, "paused:", latestEntry.isPaused);
    } else if (userRunningEntries.length === 1) {
      const runningEntry = userRunningEntries[0];
      setActiveTimer(runningEntry);
      // If paused, use stored duration, otherwise calculate elapsed
      const elapsed = runningEntry.isPaused 
        ? (runningEntry.duration || 0)
        : Math.floor((Date.now() - new Date(runningEntry.startTime).getTime()) / 1000);
      setCurrentTime(elapsed);
      console.log("Set active timer for user:", runningEntry.id, "elapsed:", elapsed, "paused:", runningEntry.isPaused);
    } else {
      setActiveTimer(null);
      setCurrentTime(0);
      console.log("No active timer found for current user");
    }
  }, [timeEntries, updateTimeEntryMutation, user]);

  // Update timer every second when running (but not when paused)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeTimer && activeTimer.isActive && !activeTimer.endTime && !activeTimer.isPaused) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);
        setCurrentTime(elapsed);
      }, 1000);
    } else if (activeTimer && activeTimer.isPaused) {
      // Keep the current time when paused (don't update)
      const elapsed = activeTimer.duration || 0;
      setCurrentTime(elapsed);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeTimer]);

  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    // For active timer display, show seconds to indicate it's running
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  };

  const stopTimer = async () => {
    if (!activeTimer) return;

    try {
      const duration = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);

      await updateTimeEntryMutation.mutateAsync({
        id: activeTimer.id,
        data: {
          endTime: new Date(),
          duration: duration,
          isActive: false,
        },
      });

      // שמירת ID הטיימר שנשמר ופתיחת דיאלוג הערות
      setSavedTimerId(activeTimer.id);
      setShowNotesDialog(true);
      
      toast({
        title: "הטיימר נעצר",
        description: "הזמן נשמר בהצלחה - הוסף הערות",
      });
    } catch (error) {
      console.error("Timer stop error:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לעצור את הטיימר",
        variant: "destructive",
      });
    }
  };

  const startTimer = async (client: Client) => {
    // Stop current timer if running
    if (activeTimer && activeTimer.isActive && !activeTimer.endTime) {
      await stopTimer();
    }

    try {
      // Use current logged-in user ID, fallback to default if no user
      const currentUserId = user?.id || "165378c1-a470-4cdb-87f7-5f8761709763";

      await createTimeEntryMutation.mutateAsync({
        userId: currentUserId,
        clientId: client.id,
        startTime: new Date(),
        description: `עבודה עבור ${client.name}`,
        isActive: true,
      });

      toast({
        title: "הטיימר התחיל",
        description: `עבודה עבור ${client.name}`,
      });
    } catch (error) {
      console.error("Timer start error:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן להתחיל את הטיימר",
        variant: "destructive",
      });
    }
  };

  const pauseTimer = async () => {
    if (!activeTimer) return;

    try {
      const duration = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);

      await updateTimeEntryMutation.mutateAsync({
        id: activeTimer.id,
        data: {
          pausedAt: new Date(),
          duration: duration,
          isPaused: true,
          isActive: true,
        },
      });

      const client = clients.find(c => c.id === activeTimer.clientId);

      toast({
        title: "הטיימר הושהה",
        description: `${formatTime(duration)} עבור ${client?.name}`,
      });
    } catch (error) {
      console.error("Timer pause error:", error);
      toast({
        title: "شגיאה", 
        description: "לא ניתן להשהות את הטיימר",
        variant: "destructive",
      });
    }
  };

  const resumeTimer = async () => {
    if (!activeTimer || !activeTimer.isPaused) return;

    try {
      // Calculate new start time to maintain the correct duration
      const pausedDuration = activeTimer.duration || 0;
      const newStartTime = new Date(Date.now() - (pausedDuration * 1000));

      await updateTimeEntryMutation.mutateAsync({
        id: activeTimer.id,
        data: {
          startTime: newStartTime,
          isPaused: false,
          pausedAt: null,
          isActive: true,
        },
      });

      const client = clients.find(c => c.id === activeTimer.clientId);

      toast({
        title: "הטיימר חודש",
        description: `ממשיך עבור ${client?.name}`,
      });
    } catch (error) {
      console.error("Timer resume error:", error);
      toast({
        title: "שגיאה", 
        description: "לא ניתן לחדש את הטיימר",
        variant: "destructive",
      });
    }
  };

  const saveTimer = async () => {
    if (!activeTimer) return;

    try {
      const duration = Math.floor((Date.now() - new Date(activeTimer.startTime).getTime()) / 1000);

      await updateTimeEntryMutation.mutateAsync({
        id: activeTimer.id,
        data: {
          endTime: new Date(),
          duration: duration,
          isActive: false,
          isPaused: false,
        },
      });

      const client = clients.find(c => c.id === activeTimer.clientId);

      toast({
        title: "הטיימר נשמר",
        description: `נוספו ${formatTime(duration)} עבור ${client?.name}`,
      });

      // פתח דיאלוג הערות אוטומטית
      setSavedTimerId(activeTimer.id);
      setShowNotesDialog(true);

    } catch (error) {
      console.error("Timer save error:", error);
      toast({
        title: "שגיאה", 
        description: "לא ניתן לשמור את הטיימר",
        variant: "destructive",
      });
    }
  };

  const getTotalTimeForClient = (clientId: string) => {
    // Filter by current user only
    const clientEntries = timeEntries.filter(entry => 
      entry.clientId === clientId && 
      entry.userId === user?.id
    );
    const totalSeconds = clientEntries.reduce((sum, entry) => sum + (entry.duration || 0), 0);

    // Add current running time if timer is active for this client and this user
    if (activeTimer?.clientId === clientId && 
        activeTimer?.userId === user?.id && 
        !activeTimer.endTime) {
      return totalSeconds + currentTime;
    }

    return totalSeconds;
  };

  // פונקציה לשמירת הערות
  const saveNotes = async () => {
    if (!savedTimerId) return;

    try {
      await updateTimeEntryMutation.mutateAsync({
        id: savedTimerId,
        data: {
          notes: notes,
        },
      });

      toast({
        title: "הערות נשמרו",
        description: "ההערות נוספו לרשומת הזמן",
      });

      // איפוס המצב
      setShowNotesDialog(false);
      setNotes("");
      setSavedTimerId(null);
    } catch (error) {
      console.error("Notes save error:", error);
      toast({
        title: "שגיאה",
        description: "לא ניתן לשמור את ההערות",
        variant: "destructive",
      });
    }
  };

  // פונקציה לדילוג על הערות
  const skipNotes = () => {
    setShowNotesDialog(false);
    setNotes("");
    setSavedTimerId(null);
  };

  return (
    <>
    <Card className="w-72 max-w-[calc(100vw-5rem)] shadow-xl border-0 bg-gradient-to-br from-white to-blue-50">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Clock className="w-6 h-6 text-blue-600" />
            </div>
            <span className="font-bold text-lg text-gray-800">טיימר עבודה</span>
            <TimeInsightsTooltip showGlobalInsights={true} />
          </div>

          {activeTimer && (
            <Badge 
              variant={activeTimer.isActive && !activeTimer.endTime && !activeTimer.isPaused ? "default" : "secondary"}
              className={activeTimer.isActive && !activeTimer.endTime && !activeTimer.isPaused ? "bg-green-500 animate-pulse" : activeTimer.isPaused ? "bg-yellow-500" : ""}
            >
              {activeTimer.isActive && !activeTimer.endTime && !activeTimer.isPaused ? "פעיל" : activeTimer.isPaused ? "מושהה" : "הסתיים"}
            </Badge>
          )}
        </div>

        {/* Timer Display */}
        <div className="text-center mb-6">
          <div className="text-5xl font-mono font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600 mb-2">
            {formatTime(currentTime)}
          </div>
          {activeTimer && (
            <div className="p-3 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-100">
              <p className="text-sm font-semibold text-blue-800">
                {clients.find(c => c.id === activeTimer.clientId)?.name || "לקוח לא מוכר"}
              </p>
            </div>
          )}
        </div>

        {/* Timer Controls */}
        <div className="flex items-center gap-3 mb-6">
          {!activeTimer || !activeTimer.isActive ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button className="flex-1 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-semibold py-3 rounded-xl shadow-lg">
                  <Play className="w-5 h-5 ml-2" />
                  התחל טיימר
                  <ChevronDown className="w-4 h-4 mr-2" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80 max-h-64 overflow-y-auto z-[9999]">
                <div className="px-2 py-1.5 text-sm font-semibold">בחר לקוח:</div>
                <DropdownMenuSeparator />
                {clients.length === 0 ? (
                  <DropdownMenuItem disabled>
                    אין לקוחות זמינים
                  </DropdownMenuItem>
                ) : (
                  <div className="grid grid-cols-1 gap-1 p-2">
                    {clients.map((client) => (
                      <DropdownMenuItem
                        key={client.id}
                        onClick={() => startTimer(client)}
                        className="flex items-center justify-between p-3 rounded-md hover:bg-blue-50 cursor-pointer"
                      >
                        <div className="flex flex-col items-start">
                          <span className="font-medium">{client.name}</span>
                          <span className="text-xs text-gray-500">
                            זמן כולל: {formatTime(getTotalTimeForClient(client.id))}
                          </span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          ) : activeTimer.isPaused ? (
            // Paused state - show resume and save buttons
            <>
              <Button 
                onClick={resumeTimer} 
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-0 font-semibold py-2 px-4 rounded-xl shadow-lg"
              >
                <Play className="w-5 h-5 ml-2" />
                המשך
              </Button>

              <Button 
                onClick={saveTimer} 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 font-semibold py-2 px-4 rounded-xl shadow-lg"
              >
                <Save className="w-5 h-5 ml-2" />
                שמור
              </Button>
            </>
          ) : (
            // Running state - show pause and save buttons
            <>
              <Button 
                onClick={pauseTimer} 
                className="bg-gradient-to-r from-yellow-500 to-yellow-600 hover:from-yellow-600 hover:to-yellow-700 text-white border-0 font-semibold py-2 px-4 rounded-xl shadow-lg"
              >
                <Pause className="w-5 h-5 ml-2" />
                השהה
              </Button>

              <Button 
                onClick={saveTimer} 
                className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white border-0 font-semibold py-2 px-4 rounded-xl shadow-lg"
              >
                <Save className="w-5 h-5 ml-2" />
                שמור
              </Button>
            </>
          )}
        </div>

        {/* Notification Test Section */}
        <div className="border-t pt-3 mb-3">
          <div className="text-sm font-medium mb-2">בדיקת התראות:</div>
          <WorkingNotificationTest />
        </div>

        {/* Time Summary */}
        {timeEntries.length > 0 && (
          <div className="border-t pt-3">
            <div className="text-sm font-medium mb-2">סיכום זמנים היום:</div>
            <div className="space-y-1 max-h-32 overflow-y-auto">
              {clients
                .filter(client => getTotalTimeForClient(client.id) > 0)
                .map((client) => (
                  <div key={client.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{client.name}</span>
                    <span className="font-mono">
                      {formatTime(getTotalTimeForClient(client.id))}
                    </span>
                  </div>
                ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>

    {/* דיאלוג הערות */}
    <Dialog open={showNotesDialog} onOpenChange={setShowNotesDialog}>
      <DialogContent className="max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>הוסף הערות לזמן שנשמר</DialogTitle>
          <DialogDescription>
            הטיימר נשמר בהצלחה. תוכל להוסיף הערות לרשומה זו (אופציונלי)
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="notes">הערות</Label>
            <Textarea
              id="notes"
              placeholder="הוסף הערות על העבודה שבוצעה..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="min-h-[100px] mt-2"
              dir="rtl"
            />
          </div>

          <div className="flex gap-3 justify-end">
            <Button
              variant="outline"
              onClick={skipNotes}
            >
              דלג
            </Button>
            <Button
              onClick={saveNotes}
              className="bg-blue-600 hover:bg-blue-700"
            >
              שמור הערות
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}