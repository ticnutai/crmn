import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  BellRing,
  Plus,
  Upload,
  Music,
  Volume2,
  Play,
  Pause,
  X,
  Clock,
  Calendar,
  AlertTriangle,
  Info,
  CheckCircle
} from "lucide-react";

interface NotificationData {
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error' | 'reminder';
  scheduledTime?: Date;
  soundFile?: File;
  soundType: 'default' | 'custom' | 'music';
  repeat?: boolean;
  repeatInterval?: number;
}

interface AddNotificationButtonProps {
  context?: 'clients' | 'time-entries' | 'general';
  contextId?: string;
  onNotificationAdded?: (notification: NotificationData) => void;
}

export default function AddNotificationButton({ 
  context = 'general', 
  contextId,
  onNotificationAdded 
}: AddNotificationButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [notificationData, setNotificationData] = useState<NotificationData>({
    title: '',
    message: '',
    type: 'info',
    soundType: 'default',
    repeat: false
  });
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedSounds, setUploadedSounds] = useState<File[]>([]);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const notificationTypes = [
    { value: 'info', label: 'מידע', icon: Info, color: 'text-blue-500' },
    { value: 'warning', label: 'אזהרה', icon: AlertTriangle, color: 'text-yellow-500' },
    { value: 'success', label: 'הצלחה', icon: CheckCircle, color: 'text-green-500' },
    { value: 'error', label: 'שגיאה', icon: AlertTriangle, color: 'text-red-500' },
    { value: 'reminder', label: 'תזכורת', icon: Clock, color: 'text-purple-500' }
  ];

  const defaultSounds = [
    { name: 'צליל ברירת מחדל', value: 'default' },
    { name: 'צליל פעמון', value: 'bell' },
    { name: 'צליל צפצוף', value: 'beep' },
    { name: 'צליל נעים', value: 'pleasant' }
  ];

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const audioFiles = Array.from(files).filter(file => 
        file.type.startsWith('audio/') || 
        file.name.endsWith('.mp3') || 
        file.name.endsWith('.wav') || 
        file.name.endsWith('.m4a')
      );
      
      if (audioFiles.length === 0) {
        toast({
          title: "שגיאה",
          description: "אנא בחר קבצי שמע בלבד (MP3, WAV, M4A)",
          variant: "destructive",
        });
        return;
      }

      setUploadedSounds(prev => [...prev, ...audioFiles]);
      toast({
        title: "הועלה בהצלחה",
        description: `${audioFiles.length} קבצי שמע הועלו`,
      });
    }
  };

  const playTestSound = (soundFile?: File) => {
    if (soundFile && audioRef.current) {
      const url = URL.createObjectURL(soundFile);
      audioRef.current.src = url;
      audioRef.current.play();
      setIsPlaying(true);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        URL.revokeObjectURL(url);
      };
    } else {
      // נגן צליל ברירת מחדל
      playDefaultSound();
    }
  };

  const playDefaultSound = () => {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.5);
    
    setIsPlaying(true);
    setTimeout(() => setIsPlaying(false), 500);
  };

  const stopSound = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const removeSound = (index: number) => {
    setUploadedSounds(prev => prev.filter((_, i) => i !== index));
  };

  const createNotification = () => {
    if (!notificationData.title.trim() || !notificationData.message.trim()) {
      toast({
        title: "שגיאה",
        description: "אנא מלא כותרת והודעה",
        variant: "destructive",
      });
      return;
    }

    const contextTitles = {
      clients: 'התראה ללקוחות',
      'time-entries': 'התראה לשעות עבודה',
      general: 'התראה כללית'
    };

    const finalNotification = {
      ...notificationData,
      title: `${contextTitles[context]}: ${notificationData.title}`,
      soundFile: notificationData.soundType === 'custom' ? uploadedSounds[0] : undefined
    };

    // שמירת ההתראה (בסימולציה)
    if (onNotificationAdded) {
      onNotificationAdded(finalNotification);
    }

    // הוספת התראה למערכת
    toast({
      title: "התראה נוצרה",
      description: `התראה "${notificationData.title}" נוצרה בהצלחה`,
    });

    // איפוס הטופס
    setNotificationData({
      title: '',
      message: '',
      type: 'info',
      soundType: 'default',
      repeat: false
    });
    setIsOpen(false);
  };

  const getContextTitle = () => {
    switch (context) {
      case 'clients': return 'הוסף התראה ללקוחות';
      case 'time-entries': return 'הוסף התראה לשעות עבודה';
      default: return 'הוסף התראה';
    }
  };

  const selectedType = notificationTypes.find(t => t.value === notificationData.type);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="flex items-center gap-2 bg-yellow-50 hover:bg-yellow-100 border-yellow-200"
            title={getContextTitle()}
          >
            <BellRing className="w-4 h-4 text-yellow-600" />
            <span className="hidden sm:inline">הוסף התראה</span>
          </Button>
        </DialogTrigger>
        
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-yellow-600" />
              {getContextTitle()}
            </DialogTitle>
            <DialogDescription>
              צור התראה מותאמת אישית עם צלילים וזמני הזכרה
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Basic Information */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">פרטי ההתראה</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="title">כותרת התראה</Label>
                  <Input
                    id="title"
                    value={notificationData.title}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                    placeholder="הזן כותרת להתראה..."
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="message">תוכן ההודעה</Label>
                  <Textarea
                    id="message"
                    value={notificationData.message}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="הזן את תוכן ההתראה..."
                    className="mt-1"
                    rows={3}
                  />
                </div>

                <div>
                  <Label>סוג התראה</Label>
                  <Select 
                    value={notificationData.type} 
                    onValueChange={(value: any) => setNotificationData(prev => ({ ...prev, type: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue>
                        {selectedType && (
                          <div className="flex items-center gap-2">
                            <selectedType.icon className={`w-4 h-4 ${selectedType.color}`} />
                            {selectedType.label}
                          </div>
                        )}
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      {notificationTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex items-center gap-2">
                            <type.icon className={`w-4 h-4 ${type.color}`} />
                            {type.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Sound Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Music className="w-5 h-5" />
                  הגדרות צליל
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label>סוג צליל</Label>
                  <Select 
                    value={notificationData.soundType} 
                    onValueChange={(value: any) => setNotificationData(prev => ({ ...prev, soundType: value }))}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">צליל ברירת מחדל</SelectItem>
                      <SelectItem value="custom">העלה קובץ שמע</SelectItem>
                      <SelectItem value="music">בחר משירים</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {notificationData.soundType === 'default' && (
                  <div className="space-y-2">
                    <Label>צלילי מערכת</Label>
                    <div className="grid grid-cols-2 gap-2">
                      {defaultSounds.map((sound) => (
                        <Button
                          key={sound.value}
                          variant="outline"
                          size="sm"
                          onClick={() => playDefaultSound()}
                          className="justify-start"
                        >
                          <Volume2 className="w-4 h-4 ml-2" />
                          {sound.name}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {notificationData.soundType === 'custom' && (
                  <div className="space-y-4">
                    <div>
                      <Button
                        variant="outline"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full"
                      >
                        <Upload className="w-4 h-4 ml-2" />
                        העלה קבצי שמע (MP3, WAV, M4A)
                      </Button>
                      <input
                        ref={fileInputRef}
                        type="file"
                        multiple
                        accept="audio/*,.mp3,.wav,.m4a"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </div>

                    {uploadedSounds.length > 0 && (
                      <div className="space-y-2">
                        <Label>קבצי שמע שהועלו</Label>
                        {uploadedSounds.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <div className="flex items-center gap-2 flex-1">
                              <Music className="w-4 h-4 text-blue-500" />
                              <span className="text-sm truncate">{file.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {(file.size / 1024 / 1024).toFixed(1)} MB
                              </Badge>
                            </div>
                            <div className="flex items-center gap-1">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => isPlaying ? stopSound() : playTestSound(file)}
                              >
                                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => removeSound(index)}
                                className="text-red-500 hover:text-red-700"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {notificationData.soundType === 'music' && (
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-700">
                      תכונה זו תאפשר בחירת שירים מספרייה מובנית במערכת
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Timing Settings */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  הגדרות זמן
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scheduled-time">זמן שליחה מתוכנן (אופציונלי)</Label>
                  <Input
                    id="scheduled-time"
                    type="datetime-local"
                    value={notificationData.scheduledTime ? notificationData.scheduledTime.toISOString().slice(0, 16) : ''}
                    onChange={(e) => setNotificationData(prev => ({ 
                      ...prev, 
                      scheduledTime: e.target.value ? new Date(e.target.value) : undefined 
                    }))}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="repeat"
                    checked={notificationData.repeat}
                    onChange={(e) => setNotificationData(prev => ({ ...prev, repeat: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="repeat">חזור על ההתראה</Label>
                </div>

                {notificationData.repeat && (
                  <div>
                    <Label htmlFor="repeat-interval">מרווח חזרה (דקות)</Label>
                    <Input
                      id="repeat-interval"
                      type="number"
                      min="1"
                      value={notificationData.repeatInterval || ''}
                      onChange={(e) => setNotificationData(prev => ({ 
                        ...prev, 
                        repeatInterval: parseInt(e.target.value) || undefined 
                      }))}
                      placeholder="הזן מרווח בדקות..."
                      className="mt-1"
                    />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              ביטול
            </Button>
            <Button onClick={createNotification} className="bg-yellow-600 hover:bg-yellow-700">
              <BellRing className="w-4 h-4 ml-2" />
              צור התראה
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <audio ref={audioRef} style={{ display: 'none' }} />
    </>
  );
}