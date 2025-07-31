import React, { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Upload, Play, Square, Volume2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface RingtoneUploaderProps {
  onRingtoneSelect: (audioUrl: string, name: string) => void;
}

const RingtoneUploader: React.FC<RingtoneUploaderProps> = ({ onRingtoneSelect }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [uploadedRingtones, setUploadedRingtones] = useState<Array<{name: string, url: string}>>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // טעינת רינגטונים שמורים מ-localStorage
  React.useEffect(() => {
    const saved = localStorage.getItem('customRingtones');
    if (saved) {
      setUploadedRingtones(JSON.parse(saved));
    }
  }, []);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // בדיקת סוג קובץ אודיו
      if (!file.type.startsWith('audio/')) {
        toast({
          title: "שגיאה",
          description: "אנא בחר קובץ אודיו תקני (MP3, WAV, OGG)",
          variant: "destructive"
        });
        return;
      }

      // בדיקת גודל קובץ (מקסימום 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "שגיאה", 
          description: "קובץ האודיו גדול מדי (מקסימום 5MB)",
          variant: "destructive"
        });
        return;
      }

      setSelectedFile(file);
      toast({
        title: "קובץ נבחר",
        description: `נבחר: ${file.name}`
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      // המרת קובץ ל-Base64 URL לשמירה מקומית
      const reader = new FileReader();
      reader.onload = (e) => {
        const audioUrl = e.target?.result as string;
        const newRingtone = {
          name: selectedFile.name,
          url: audioUrl
        };

        const updatedRingtones = [...uploadedRingtones, newRingtone];
        setUploadedRingtones(updatedRingtones);
        
        // שמירה ב-localStorage
        localStorage.setItem('customRingtones', JSON.stringify(updatedRingtones));
        
        setSelectedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        toast({
          title: "הועלה בהצלחה!",
          description: `רינגטון ${selectedFile.name} נשמר במערכת`
        });
      };
      
      reader.readAsDataURL(selectedFile);
    } catch (error) {
      toast({
        title: "שגיאה בהעלאה",
        description: "לא ניתן היה לשמור את הרינגטון",
        variant: "destructive"
      });
    }
  };

  const playRingtone = (url: string) => {
    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(url);
    audioRef.current = audio;
    
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => {
      setIsPlaying(false);
      toast({
        title: "שגיאת נגינה",
        description: "לא ניתן לנגן את הרינגטון",
        variant: "destructive"
      });
    };

    audio.play()
      .then(() => setIsPlaying(true))
      .catch(() => {
        toast({
          title: "שגיאת נגינה", 
          description: "לא ניתן לנגן את הרינגטון",
          variant: "destructive"
        });
      });
  };

  const stopRingtone = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
  };

  const selectRingtone = (ringtone: {name: string, url: string}) => {
    onRingtoneSelect(ringtone.url, ringtone.name);
    toast({
      title: "רינגטון נבחר",
      description: `${ringtone.name} יופעל בהתראות`
    });
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Volume2 className="w-5 h-5" />
          העלאת רינגטונים מותאמים
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* העלאת קובץ */}
        <div className="space-y-2">
          <Label htmlFor="ringtone-file">בחר קובץ אודיו</Label>
          <Input
            ref={fileInputRef}
            id="ringtone-file"
            type="file"
            accept="audio/*"
            onChange={handleFileSelect}
          />
          {selectedFile && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600">{selectedFile.name}</span>
              <Button onClick={handleUpload} size="sm">
                <Upload className="w-4 h-4 ml-1" />
                העלה
              </Button>
            </div>
          )}
        </div>

        {/* רשימת רינגטונים שהועלו */}
        {uploadedRingtones.length > 0 && (
          <div className="space-y-2">
            <Label>רינגטונים שמורים</Label>
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {uploadedRingtones.map((ringtone, index) => (
                <div key={index} className="flex items-center justify-between p-2 border rounded">
                  <span className="text-sm truncate flex-1">{ringtone.name}</span>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => playRingtone(ringtone.url)}
                      disabled={isPlaying}
                    >
                      <Play className="w-3 h-3" />
                    </Button>
                    {isPlaying && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={stopRingtone}
                      >
                        <Square className="w-3 h-3" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => selectRingtone(ringtone)}
                    >
                      <Check className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500">
          תומך בפורמטים: MP3, WAV, OGG (מקסימום 5MB)
        </div>
      </CardContent>
    </Card>
  );
};

export default RingtoneUploader;