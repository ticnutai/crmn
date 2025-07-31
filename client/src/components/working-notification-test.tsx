import React, { useState } from 'react';
import { Bell, Play, Volume2, Timer, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function WorkingNotificationTest() {
  const [minutes, setMinutes] = useState(1);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const { toast } = useToast();

  const createTimerNotification = async () => {
    console.log(`🔔 Creating timer for ${minutes} minutes...`);
    
    try {
      // Request permissions first
      if (Notification.permission === 'default') {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast({
            title: "נדרשות הרשאות",
            description: "אנא אפשר התראות בדפדפן",
            variant: "destructive",
          });
          return;
        }
      }

      if (Notification.permission !== 'granted') {
        toast({
          title: "אין הרשאות",
          description: "לא ניתן להציג התראות ללא הרשאה מהדפדפן",
          variant: "destructive",
        });
        return;
      }

      // Create audio context for sounds
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
      }

      // Play immediate confirmation sound
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(600, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.3);

      setIsTimerRunning(true);

      // Set the actual timer
      setTimeout(async () => {
        // Play notification sound
        try {
          const notificationOscillator = audioContext.createOscillator();
          const notificationGain = audioContext.createGain();
          
          notificationOscillator.connect(notificationGain);
          notificationGain.connect(audioContext.destination);
          
          // Create a more noticeable sound sequence
          notificationOscillator.frequency.setValueAtTime(800, audioContext.currentTime);
          notificationOscillator.frequency.setValueAtTime(1000, audioContext.currentTime + 0.2);
          notificationOscillator.frequency.setValueAtTime(800, audioContext.currentTime + 0.4);
          notificationOscillator.type = 'square';
          
          notificationGain.gain.setValueAtTime(0.5, audioContext.currentTime);
          notificationGain.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
          
          notificationOscillator.start(audioContext.currentTime);
          notificationOscillator.stop(audioContext.currentTime + 1.0);

          console.log('🎵 Timer notification sound played');
        } catch (soundError) {
          console.error('Sound error:', soundError);
        }

        // Show browser notification
        const notification = new Notification(`⏰ ${minutes} דקות עברו!`, {
          body: `הטיימר שהגדרת ל-${minutes} דקות הסתיים`,
          icon: '/favicon.ico',
          tag: 'timer-notification',
          requireInteraction: true
        });

        // Auto-close after 10 seconds
        setTimeout(() => {
          notification.close();
        }, 10000);

        setIsTimerRunning(false);
        
        toast({
          title: "⏰ הטיימר הסתיים!",
          description: `${minutes} דקות עברו`,
        });

        console.log(`✅ Timer completed after ${minutes} minutes`);
      }, minutes * 60 * 1000);

      toast({
        title: "טיימר הופעל",
        description: `התראה תגיע בעוד ${minutes} דקות`,
      });

    } catch (error) {
      console.error('❌ Timer error:', error);
      toast({
        title: "שגיאה",
        description: `לא ניתן ליצור טיימר: ${error}`,
        variant: "destructive",
      });
      setIsTimerRunning(false);
    }
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Timer className="w-5 h-5" />
          בדיקת התראת טיימר
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="minutes">זמן בדקות:</Label>
          <Input
            id="minutes"
            type="number"
            min="1"
            max="60"
            value={minutes}
            onChange={(e) => setMinutes(Math.max(1, parseInt(e.target.value) || 1))}
            disabled={isTimerRunning}
          />
        </div>
        
        <Button 
          onClick={createTimerNotification}
          disabled={isTimerRunning}
          className="w-full"
        >
          {isTimerRunning ? (
            <>
              <Clock className="w-4 h-4 mr-2 animate-spin" />
              טיימר פעיל...
            </>
          ) : (
            <>
              <Bell className="w-4 h-4 mr-2" />
              התחל טיימר ל-{minutes} דקות
            </>
          )}
        </Button>

        {isTimerRunning && (
          <div className="text-center text-sm text-gray-600">
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              טיימר פועל... התראה תגיע בעוד {minutes} דקות
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}