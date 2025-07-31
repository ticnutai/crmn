import React, { useState, useEffect } from 'react';
import { Timer, AlertCircle, X, Pause, CheckCircle, Clock, RotateCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface NotificationPopupProps {
  isVisible: boolean;
  title: string;
  message: string;
  type: 'timer' | 'scheduled';
  sound?: string;
  onDismiss: () => void;
  onSnooze?: (minutes: number) => void;
  remainingTime?: number; // For countdown display
}

export default function NotificationPopup({
  isVisible,
  title,
  message,
  type,
  sound,
  onDismiss,
  onSnooze,
  remainingTime
}: NotificationPopupProps) {
  const [countdown, setCountdown] = useState(remainingTime || 0);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    if (isVisible && sound) {
      playNotificationSound();
    }
  }, [isVisible, sound]);

  useEffect(() => {
    if (type === 'timer' && remainingTime && remainingTime > 0) {
      const interval = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [remainingTime, type]);

  const playNotificationSound = async () => {
    try {
      // Request permission for notifications if not already granted
      if (Notification.permission === 'default') {
        await Notification.requestPermission();
      }

      // Show browser notification
      if (Notification.permission === 'granted') {
        new Notification(title, {
          body: message,
          icon: '/favicon.ico',
          tag: 'timer-notification'
        });
      }

      // Play sound
      const audio = new Audio();
      if (sound && sound !== 'silent') {
        switch (sound) {
          case 'beep':
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgzfNeXF3U3hNV9NZdPA7N3L6N3L5p3L5p3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L5t3L';
            break;
          case 'bell':
            // Bell sound data
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgzfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeXKjYxfNeX';
            break;
          case 'chime':
            // Chime sound data
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgzfNexkJBQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQcJCQ';
            break;
          case 'alert':
            // Alert sound data
            audio.src = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgzfNelllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllllll';
            break;
          default:
            // Custom uploaded sound
            const soundData = localStorage.getItem(`notification-sound-${sound}`);
            if (soundData) {
              audio.src = soundData;
            }
        }
        
        audio.volume = 0.7;
        setIsPlaying(true);
        
        try {
          await audio.play();
        } catch (error) {
          console.log('Audio play failed:', error);
        }
        
        audio.onended = () => setIsPlaying(false);
      }
    } catch (error) {
      console.error('Notification error:', error);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className="w-96 max-w-[90vw] mx-4 shadow-2xl border-2 animate-in zoom-in-50 duration-300">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {type === 'timer' ? (
                <div className="p-2 bg-blue-100 rounded-full">
                  <Timer className="w-6 h-6 text-blue-600 animate-pulse" />
                </div>
              ) : (
                <div className="p-2 bg-amber-100 rounded-full">
                  <AlertCircle className="w-6 h-6 text-amber-600" />
                </div>
              )}
              <div>
                <CardTitle className="text-lg font-bold text-right">{title}</CardTitle>
                {type === 'timer' && (
                  <Badge variant="secondary" className="mt-1">
                    התראת טיימר
                  </Badge>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onDismiss}
              className="h-8 w-8 p-0 hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          <p className="text-center text-gray-700 font-medium">{message}</p>
          
          {/* Countdown Timer Display */}
          {type === 'timer' && countdown > 0 && (
            <div className="flex flex-col items-center p-4 bg-blue-50 rounded-lg relative overflow-hidden">
              <div className="relative">
                <Timer className="w-12 h-12 text-blue-600 mb-2 animate-bounce" />
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse flex items-center justify-center">
                  <span className="text-xs text-white font-bold">!</span>
                </div>
              </div>
              <div className="text-3xl font-mono font-bold text-blue-700 animate-pulse">
                {formatTime(countdown)}
              </div>
              <p className="text-sm text-blue-600 mt-1 flex items-center gap-1">
                <Clock className="w-4 h-4" />
                זמן נותר לסיום
              </p>
              
              {/* Animated progress bar */}
              <div className="w-full mt-3 bg-blue-200 rounded-full h-2 overflow-hidden">
                <div 
                  className="h-full bg-blue-600 rounded-full transition-all duration-1000 animate-pulse"
                  style={{
                    width: `${Math.max(0, (countdown / (remainingTime || countdown)) * 100)}%`
                  }}
                ></div>
              </div>
            </div>
          )}
          
          {/* Sound Status */}
          {isPlaying && (
            <div className="flex items-center justify-center gap-2 text-green-600">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm">מנגן צליל...</span>
            </div>
          )}
          
          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={onDismiss}
              variant="default"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="w-4 h-4 mr-2" />
              אישור
            </Button>
            
            {onSnooze && (
              <>
                <Button
                  onClick={() => onSnooze(5)}
                  variant="outline"
                  className="flex-1"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  סנוז 5 דק'
                </Button>
                <Button
                  onClick={() => onSnooze(10)}
                  variant="outline"
                  className="flex-1"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  סנוז 10 דק'
                </Button>
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}