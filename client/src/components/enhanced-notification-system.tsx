import { useState, useRef, useEffect } from "react";
import { Bell, Upload, Play, Square, Volume2, VolumeX, Plus, Calendar, Clock, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNotificationPermissions } from "@/hooks/useNotificationPermissions";
import NotificationPopup from "@/components/notification-popup";

interface NotificationSound {
  id: string;
  name: string;
  file: File | null;
  url: string | null;
  type: 'uploaded' | 'builtin';
}

interface NotificationRule {
  id: string;
  name: string;
  clientId?: string;
  clientName?: string;
  type: 'timer' | 'scheduled';
  triggerTime?: number; // minutes for timer notifications
  scheduledDate?: string; // ISO date string for scheduled notifications
  scheduledTime?: string; // HH:MM format for scheduled notifications  
  soundId: string;
  soundName: string;
  isActive: boolean;
  message: string;
  repeat?: 'none' | 'daily' | 'weekly' | 'monthly';
}

interface EnhancedNotificationSystemProps {
  clientId?: string;
  clientName?: string;
  context?: 'global' | 'client';
}

const BUILTIN_SOUNDS: NotificationSound[] = [
  { id: 'beep', name: 'ביפ פשוט', file: null, url: null, type: 'builtin' },
  { id: 'bell', name: 'פעמון', file: null, url: null, type: 'builtin' },
  { id: 'chime', name: 'פעמונים', file: null, url: null, type: 'builtin' },
  { id: 'alert', name: 'התראה', file: null, url: null, type: 'builtin' },
];

export default function EnhancedNotificationSystem({ 
  clientId, 
  clientName, 
  context = 'global' 
}: EnhancedNotificationSystemProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sounds, setSounds] = useState<NotificationSound[]>([...BUILTIN_SOUNDS]);
  const [rules, setRules] = useState<NotificationRule[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  
  // Form states
  const [notificationName, setNotificationName] = useState('');
  const [notificationType, setNotificationType] = useState<'timer' | 'scheduled'>('timer');
  const [triggerTime, setTriggerTime] = useState('');
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [repeatOption, setRepeatOption] = useState<'none' | 'daily' | 'weekly' | 'monthly'>('none');
  const [selectedSound, setSelectedSound] = useState('');
  const [customMessage, setCustomMessage] = useState('');
  
  // Notification popup states
  const [showNotificationPopup, setShowNotificationPopup] = useState(false);
  const [currentNotification, setCurrentNotification] = useState<{
    title: string;
    message: string;
    type: 'timer' | 'scheduled';
    sound: string;
    remainingTime?: number;
  } | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { hasPermission, requestPermission } = useNotificationPermissions();

  // Request notification permissions on component mount
  useEffect(() => {
    if (!hasPermission) {
      requestPermission();
    }
  }, [hasPermission, requestPermission]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach(file => {
      // Check if it's an audio file
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "קובץ לא נתמך",
          description: `${file.name} אינו קובץ שמע תקין`,
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "קובץ גדול מדי",
          description: `${file.name} גדול מ-5MB`,
          variant: "destructive",
        });
        return;
      }

      const url = URL.createObjectURL(file);
      const newSound: NotificationSound = {
        id: `uploaded_${Date.now()}_${Math.random()}`,
        name: file.name.replace(/\.[^/.]+$/, ""), // Remove extension
        file,
        url,
        type: 'uploaded'
      };

      setSounds(prev => [...prev, newSound]);
      toast({
        title: "צליל הועלה בהצלחה",
        description: `${file.name} נוסף למערכת`,
      });
    });

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const playSound = async (soundId: string) => {
    // Request notification permissions first
    if (Notification.permission === 'default') {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        toast({
          title: "דרושות הרשאות",
          description: "אנא אפשר התראות בדפדפן כדי לשמוע צלילים",
          variant: "destructive",
        });
        return;
      }
    }

    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingSound(null);
    }

    const sound = sounds.find(s => s.id === soundId);
    if (!sound) return;

    try {
      let audio: HTMLAudioElement;

      if (sound.type === 'builtin') {
        // Create builtin sound using Web Audio API with user interaction
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        
        // Resume audio context if suspended
        if (audioContext.state === 'suspended') {
          await audioContext.resume();
        }
        
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);
        
        // Different frequencies for different sounds
        const frequencies = {
          'beep': 800,
          'bell': 400,
          'chime': 600,
          'alert': 1000
        };
        
        oscillator.frequency.setValueAtTime(frequencies[soundId as keyof typeof frequencies] || 800, audioContext.currentTime);
        oscillator.type = 'sine';
        
        gainNode.gain.setValueAtTime(0.5, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 1.0);
        
        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 1.0);
        
        setPlayingSound(soundId);
        setTimeout(() => setPlayingSound(null), 1000);
        return;
      } else if (sound.url) {
        // Play uploaded file
        audio = new Audio(sound.url);
        audio.volume = 0.8;
        
        setCurrentAudio(audio);
        setPlayingSound(soundId);
        
        audio.onended = () => {
          setCurrentAudio(null);
          setPlayingSound(null);
        };
        
        // Ensure audio can play
        await audio.play();
      }
    } catch (error) {
      console.error('Sound play error:', error);
      toast({
        title: "שגיאה בהשמעת צליל",
        description: "לא ניתן להשמיע את הצליל. אנא בדוק הרשאות דפדפן.",
        variant: "destructive",
      });
      setPlayingSound(null);
    }
  };

  const stopSound = () => {
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
    }
    setPlayingSound(null);
  };

  const createNotification = () => {
    console.log('🔔 Creating notification...', {
      notificationName: notificationName.trim(),
      notificationType,
      triggerTime,
      scheduledDate,
      scheduledTime,
      selectedSound,
      clientId,
      clientName
    });

    // Validate required fields based on notification type
    const isTimerValid = notificationType === 'timer' && triggerTime;
    const isScheduledValid = notificationType === 'scheduled' && scheduledDate && scheduledTime;
    
    if (!notificationName.trim() || !selectedSound || (!isTimerValid && !isScheduledValid)) {
      console.log('❌ Missing required fields:', {
        name: !notificationName.trim(),
        sound: !selectedSound,
        timerValid: isTimerValid,
        scheduledValid: isScheduledValid
      });
      
      toast({
        title: "נתונים חסרים",
        description: notificationType === 'timer' 
          ? "אנא מלא שם התראה, זמן הפעלה וצליל"
          : "אנא מלא שם התראה, תאריך, שעה וצליל",
        variant: "destructive",
      });
      return;
    }

    const selectedSoundObj = sounds.find(s => s.id === selectedSound);
    if (!selectedSoundObj) {
      console.log('❌ Sound not found:', selectedSound);
      return;
    }

    // Create default message based on type
    let defaultMessage = '';
    if (notificationType === 'timer') {
      defaultMessage = `זמן עבודה הגיע ל-${triggerTime} דקות${clientName ? ` עבור ${clientName}` : ''}!`;
    } else {
      const dateObj = new Date(scheduledDate);
      const formattedDate = dateObj.toLocaleDateString('he-IL');
      defaultMessage = `תזכורת${clientName ? ` עבור ${clientName}` : ''} - ${formattedDate} בשעה ${scheduledTime}`;
    }

    const newRule: NotificationRule = {
      id: `rule_${Date.now()}`,
      name: notificationName.trim(),
      clientId,
      clientName,
      type: notificationType,
      triggerTime: notificationType === 'timer' ? parseInt(triggerTime) : undefined,
      scheduledDate: notificationType === 'scheduled' ? scheduledDate : undefined,
      scheduledTime: notificationType === 'scheduled' ? scheduledTime : undefined,
      repeat: notificationType === 'scheduled' ? repeatOption : undefined,
      soundId: selectedSound,
      soundName: selectedSoundObj.name,
      isActive: true,
      message: customMessage.trim() || defaultMessage
    };

    console.log('✅ Creating new rule:', newRule);
    setRules(prev => {
      const updated = [...prev, newRule];
      console.log('✅ Updated rules:', updated);
      return updated;
    });
    
    // Reset form
    setNotificationName('');
    setTriggerTime('');
    setScheduledDate('');
    setScheduledTime('');
    setRepeatOption('none');
    setSelectedSound('');
    setCustomMessage('');
    
    toast({
      title: "התראה נוצרה בהצלחה",
      description: `התראה "${newRule.name}" נוספה למערכת`,
    });
  };

  const toggleRule = (ruleId: string) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, isActive: !rule.isActive } : rule
    ));
  };

  const deleteRule = (ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
    toast({
      title: "התראה נמחקה",
      description: "ההתראה הוסרה מהמערכת",
    });
  };

  const deleteSound = (soundId: string) => {
    const sound = sounds.find(s => s.id === soundId);
    if (sound?.type === 'builtin') {
      toast({
        title: "לא ניתן למחוק",
        description: "לא ניתן למחוק צלילים מובנים",
        variant: "destructive",
      });
      return;
    }

    setSounds(prev => prev.filter(s => s.id !== soundId));
    
    // Remove from rules using this sound
    setRules(prev => prev.filter(rule => rule.soundId !== soundId));
    
    toast({
      title: "צליל נמחק",
      description: "הצליל והתראות הקשורות אליו הוסרו",
    });
  };

  const contextTitle = context === 'client' && clientName ? `התראות עבור ${clientName}` : 'התראות המערכת';
  const relevantRules = context === 'client' ? rules.filter(r => r.clientId === clientId) : rules;

  // Function to show notification popup
  const showNotification = (title: string, message: string, type: 'timer' | 'scheduled', sound: string, remainingTime?: number) => {
    setCurrentNotification({ title, message, type, sound, remainingTime });
    setShowNotificationPopup(true);
  };

  // Function to handle notification dismiss
  const handleNotificationDismiss = () => {
    setShowNotificationPopup(false);
    setCurrentNotification(null);
  };

  // Function to handle snooze
  const handleSnooze = (minutes: number) => {
    if (currentNotification) {
      // Schedule new notification after snooze period
      setTimeout(() => {
        showNotification(
          currentNotification.title,
          `התראה חוזרת (לאחר סנוז ${minutes} דקות): ${currentNotification.message}`,
          currentNotification.type,
          currentNotification.sound,
          currentNotification.remainingTime
        );
      }, minutes * 60 * 1000);
      
      toast({
        title: "התראה נדחתה",
        description: `התראה תחזור בעוד ${minutes} דקות`,
      });
    }
    handleNotificationDismiss();
  };

  // Function to test notification with popup
  const testNotification = (rule: NotificationRule) => {
    const message = rule.type === 'timer' 
      ? `זמן עבודה הגיע ל-${rule.triggerTime} דקות!`
      : rule.message || `התראה מתוזמנת: ${rule.name}`;
    
    showNotification(
      rule.name,
      message,
      rule.type,
      rule.soundId,
      rule.type === 'timer' ? (rule.triggerTime || 0) * 60 : undefined
    );
  };

  return (
    <>
      {/* Notification Popup */}
      {showNotificationPopup && currentNotification && (
        <NotificationPopup
          isVisible={showNotificationPopup}
          title={currentNotification.title}
          message={currentNotification.message}
          type={currentNotification.type}
          sound={currentNotification.sound}
          remainingTime={currentNotification.remainingTime}
          onDismiss={handleNotificationDismiss}
          onSnooze={handleSnooze}
        />
      )}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 text-orange-600 hover:text-orange-700 hover:bg-orange-50"
          title={`הוסף התראה${clientName ? ` עבור ${clientName}` : ''}`}
        >
          <Plus className="w-3 h-3" />
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" dir="rtl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Bell className="w-5 h-5 text-orange-600" />
            {contextTitle}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Sound Management */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold flex items-center gap-2">
                  <Volume2 className="w-4 h-4" />
                  ניהול צלילים
                </h3>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2"
                >
                  <Upload className="w-4 h-4" />
                  העלה צליל
                </Button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                multiple
                onChange={handleFileUpload}
                className="hidden"
              />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {sounds.map(sound => (
                  <div key={sound.id} className="flex items-center justify-between p-2 border rounded">
                    <div className="flex items-center gap-2">
                      <Badge variant={sound.type === 'builtin' ? 'default' : 'secondary'}>
                        {sound.type === 'builtin' ? 'מובנה' : 'מועלה'}
                      </Badge>
                      <span className="text-sm">{sound.name}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {playingSound === sound.id ? (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={stopSound}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          <Square className="w-3 h-3" />
                        </Button>
                      ) : (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => playSound(sound.id)}
                          className="h-6 w-6 p-0 text-green-600"
                        >
                          <Play className="w-3 h-3" />
                        </Button>
                      )}
                      {sound.type === 'uploaded' && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteSound(sound.id)}
                          className="h-6 w-6 p-0 text-red-600"
                        >
                          <VolumeX className="w-3 h-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <Separator />

          {/* Create New Notification */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4" />
                יצירת התראה חדשה
              </h3>
              
              <div className="space-y-4">
                {/* Notification Name */}
                <div>
                  <Label htmlFor="notification-name">שם ההתראה</Label>
                  <Input
                    id="notification-name"
                    value={notificationName}
                    onChange={(e) => setNotificationName(e.target.value)}
                    placeholder="למשל: התראת עבודה"
                  />
                </div>

                {/* Notification Type Tabs */}
                <Tabs value={notificationType} onValueChange={(value) => setNotificationType(value as 'timer' | 'scheduled')} className="w-full">
                  <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="timer" className="flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      התראת טיימר
                    </TabsTrigger>
                    <TabsTrigger value="scheduled" className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      התראה מתוזמנת
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="timer" className="space-y-4">
                    <div>
                      <Label htmlFor="trigger-time">זמן הפעלה (דקות)</Label>
                      <Input
                        id="trigger-time"
                        type="number"
                        value={triggerTime}
                        onChange={(e) => setTriggerTime(e.target.value)}
                        placeholder="למשל: 30"
                        min="1"
                      />
                      <p className="text-xs text-gray-500 mt-1">
                        התראה תופעל כאשר הטיימר יגיע לזמן הנקוב
                      </p>
                    </div>
                  </TabsContent>

                  <TabsContent value="scheduled" className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="scheduled-date">תאריך</Label>
                        <Input
                          id="scheduled-date"
                          type="date"
                          value={scheduledDate}
                          onChange={(e) => setScheduledDate(e.target.value)}
                          min={new Date().toISOString().split('T')[0]}
                        />
                      </div>
                      <div>
                        <Label htmlFor="scheduled-time">שעה</Label>
                        <Input
                          id="scheduled-time"
                          type="time"
                          value={scheduledTime}
                          onChange={(e) => setScheduledTime(e.target.value)}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <Label htmlFor="repeat-select">חזרה</Label>
                      <Select value={repeatOption} onValueChange={(value: 'none' | 'daily' | 'weekly' | 'monthly') => setRepeatOption(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר אפשרות חזרה" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">ללא חזרה</SelectItem>
                          <SelectItem value="daily">יומי</SelectItem>
                          <SelectItem value="weekly">שבועי</SelectItem>
                          <SelectItem value="monthly">חודשי</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>
                </Tabs>

                {/* Sound Selection */}
                <div>
                  <Label htmlFor="sound-select">בחר צליל</Label>
                  <Select value={selectedSound} onValueChange={setSelectedSound}>
                    <SelectTrigger>
                      <SelectValue placeholder="בחר צליל התראה" />
                    </SelectTrigger>
                    <SelectContent>
                      {sounds.map(sound => (
                        <SelectItem key={sound.id} value={sound.id}>
                          <div className="flex items-center gap-2">
                            <Badge variant={sound.type === 'builtin' ? 'default' : 'secondary'} className="text-xs">
                              {sound.type === 'builtin' ? 'מובנה' : 'מועלה'}
                            </Badge>
                            {sound.name}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Custom Message */}
                <div>
                  <Label htmlFor="custom-message">הודעה מותאמת (אופציונלי)</Label>
                  <Input
                    id="custom-message"
                    value={customMessage}
                    onChange={(e) => setCustomMessage(e.target.value)}
                    placeholder={
                      notificationType === 'timer' 
                        ? `זמן עבודה הגיע ל-${triggerTime || 'X'} דקות${clientName ? ` עבור ${clientName}` : ''}!`
                        : `תזכורת${clientName ? ` עבור ${clientName}` : ''} - ${scheduledDate ? new Date(scheduledDate).toLocaleDateString('he-IL') : 'תאריך'} בשעה ${scheduledTime || 'שעה'}`
                    }
                  />
                </div>
              </div>
              
              <Button 
                onClick={createNotification}
                className="w-full mt-4"
                disabled={
                  !notificationName.trim() || 
                  !selectedSound || 
                  (notificationType === 'timer' && !triggerTime) ||
                  (notificationType === 'scheduled' && (!scheduledDate || !scheduledTime))
                }
              >
                <Plus className="w-4 h-4 ml-2" />
                צור התראה
              </Button>
            </CardContent>
          </Card>

          <Separator />

          {/* Active Notifications */}
          <Card>
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4" />
                התראות פעילות ({relevantRules.length})
              </h3>
              
              {relevantRules.length === 0 ? (
                <p className="text-gray-500 text-center py-4">אין התראות פעילות</p>
              ) : (
                <div className="space-y-2">
                  {relevantRules.map(rule => (
                    <div key={rule.id} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Badge variant={rule.isActive ? 'default' : 'secondary'}>
                            {rule.isActive ? 'פעיל' : 'כבוי'}
                          </Badge>
                          <span className="font-medium">{rule.name}</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          {rule.type === 'timer' ? (
                            <span>כל {rule.triggerTime} דקות • צליל: {rule.soundName}</span>
                          ) : (
                            <span>
                              {rule.scheduledDate && new Date(rule.scheduledDate).toLocaleDateString('he-IL')} בשעה {rule.scheduledTime}
                              {rule.repeat !== 'none' && ` • חזרה: ${
                                rule.repeat === 'daily' ? 'יומי' : 
                                rule.repeat === 'weekly' ? 'שבועי' : 
                                rule.repeat === 'monthly' ? 'חודשי' : ''
                              }`}
                              • צליל: {rule.soundName}
                            </span>
                          )}
                          {rule.clientName && <span> • לקוח: {rule.clientName}</span>}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {rule.message}
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRule(rule.id)}
                          className="h-8 w-8 p-0"
                        >
                          {rule.isActive ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => testNotification(rule)}
                          className="h-8 w-8 p-0 text-blue-600"
                          title="בדוק התראה"
                        >
                          <Play className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteRule(rule.id)}
                          className="h-8 w-8 p-0 text-red-600"
                        >
                          <VolumeX className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
    </>
  );
}