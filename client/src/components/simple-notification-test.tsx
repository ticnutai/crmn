import React, { useState } from 'react';
import { Bell, Play, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import NotificationPopup from './notification-popup';

export default function SimpleNotificationTest() {
  const [showPopup, setShowPopup] = useState(false);
  const { toast } = useToast();

  const testNotification = async () => {
    console.log('🔔 Testing notification...');
    
    // First, try to get user interaction for audio context
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      console.log('🎵 Audio context state:', audioContext.state);
      
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log('🎵 Audio context resumed');
      }

      // Request notification permission with explicit user interaction
      if (Notification.permission === 'default') {
        console.log('🔔 Requesting notification permission...');
        const permission = await Notification.requestPermission();
        console.log('🔔 Permission result:', permission);
        
        if (permission !== 'granted') {
          toast({
            title: "הרשאות נדרשות",
            description: "אנא אפשר התראות בדפדפן כדי לקבל התראות",
            variant: "destructive",
          });
          return;
        }
      }

      // Play sound immediately after user interaction
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
      oscillator.type = 'sine';
      
      gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
      
      oscillator.start(audioContext.currentTime);
      oscillator.stop(audioContext.currentTime + 0.5);

      console.log('🎵 Sound played successfully');

      // Show popup
      setShowPopup(true);

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification('בדיקת התראה מהמערכת', {
          body: 'זהו מבחן פשוט להתראה - עובד!',
          icon: '/favicon.ico',
          tag: 'test-notification'
        });
        console.log('🔔 Browser notification shown');
      }

      // Create a real timer notification for 1 minute from now
      setTimeout(() => {
        if (Notification.permission === 'granted') {
          new Notification('התראת טיימר - דקה עברה!', {
            body: 'זהו מבחן של התראה אמיתית לאחר דקה',
            icon: '/favicon.ico',
            tag: 'timer-test'
          });
        }
        
        // Play sound again
        const newOscillator = audioContext.createOscillator();
        const newGainNode = audioContext.createGain();
        
        newOscillator.connect(newGainNode);
        newGainNode.connect(audioContext.destination);
        
        newOscillator.frequency.setValueAtTime(1000, audioContext.currentTime);
        newOscillator.type = 'square';
        
        newGainNode.gain.setValueAtTime(0.4, audioContext.currentTime);
        newGainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
        
        newOscillator.start(audioContext.currentTime);
        newOscillator.stop(audioContext.currentTime + 1.0);

        console.log('⏰ Timer notification triggered after 1 minute!');
      }, 60000); // 1 minute

      toast({
        title: "בדיקת התראה הופעלה",
        description: "התראה נוספת תגיע בעוד דקה!",
      });

    } catch (error) {
      console.error('❌ Notification error:', error);
      toast({
        title: "שגיאה",
        description: `לא ניתן להפעיל התראות: ${error}`,
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        onClick={testNotification}
        variant="outline"
        size="sm"
        className="flex items-center gap-2 text-blue-600 border-blue-200 hover:bg-blue-50"
      >
        <Bell className="w-4 h-4" />
        בדיקת התראה
      </Button>

      {showPopup && (
        <NotificationPopup
          isVisible={showPopup}
          title="בדיקת התראה"
          message="זהו מבחן פשוט להתראה עם פופ-אפ מעוצב!"
          type="timer"
          sound="beep"
          remainingTime={60}
          onDismiss={() => setShowPopup(false)}
          onSnooze={(minutes) => {
            setShowPopup(false);
            toast({
              title: "התראה נדחתה",
              description: `תחזור בעוד ${minutes} דקות`,
            });
          }}
        />
      )}
    </div>
  );
}