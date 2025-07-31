import { useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSystem } from "@/hooks/use-notification-system";

export function useAutoBackup() {
  const { toast } = useToast();
  const { showAlert } = useNotificationSystem();
  const queryClient = useQueryClient();

  const createBackup = useMutation({
    mutationFn: async () => {
      const backupData = {
        filename: `backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
        size: Math.floor(Math.random() * 1000000) + 100000, // Simulate backup size
        status: "completed",
      };
      const res = await apiRequest("/api/backups", "POST", backupData);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      // הסרת הודעות גיבוי - רק לוג שקט
      
    },
    onError: () => {
      // התראה חמורה בפופ-אפ למעלה בשמאל
      showAlert(
        "שגיאה בגיבוי!", 
        "לא ניתן היה לבצע גיבוי אוטומטי - הנתונים עלולים להיות בסיכון",
        "error"
      );
      // גם toast רגיל
      toast({
        title: "שגיאה בגיבוי",
        description: "לא ניתן היה לבצע גיבוי אוטומטי",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    // בדיקת הגדרות המשתמש לגיבוי אוטומטי
    const autoBackupEnabled = localStorage.getItem('autoBackupEnabled') === 'true';
    const backupFrequency = localStorage.getItem('backupFrequency') || 'daily';
    
    if (!autoBackupEnabled) {
      
      return;
    }

    

    // חישוב מרווח זמן לפי תדירות
    const getIntervalMs = (frequency: string) => {
      switch (frequency) {
        case 'daily': return 24 * 60 * 60 * 1000; // 24 שעות
        case 'weekly': return 7 * 24 * 60 * 60 * 1000; // שבוע
        case 'monthly': return 30 * 24 * 60 * 60 * 1000; // חודש
        default: return 24 * 60 * 60 * 1000;
      }
    };

    // גיבוי ראשוני אחרי דקה אחת (רק כשנכנסים לעמוד הגיבויים)
    const initialTimeout = setTimeout(() => {
      if (localStorage.getItem('autoBackupEnabled') === 'true') {
        createBackup.mutate();
      }
    }, 60000);

    // גיבוי תקופתי לפי התדירות שנבחרה
    const intervalMs = getIntervalMs(backupFrequency);
    const interval = setInterval(() => {
      if (localStorage.getItem('autoBackupEnabled') === 'true') {
        createBackup.mutate();
      }
    }, intervalMs);

    return () => {
      clearTimeout(initialTimeout);
      clearInterval(interval);
    };
  }, []);

  return { createBackup };
}
