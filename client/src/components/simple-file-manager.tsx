import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { 
  FileText, 
  Image, 
  Video, 
  Music, 
  Archive, 
  Download, 
  Upload, 
  Trash2, 
  Plus,
  Database,
  Cloud,
  Folder,
  RefreshCw,
  Save
} from 'lucide-react';
import type { Client } from '@shared/schema';
import GoogleDriveManager from './google-drive-manager';
import { useLocalDrive } from '@/hooks/use-local-drive';

interface SimpleFileManagerProps {
  client: Client;
}

interface ClientFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  clientId: string;
  uploadedBy: string;
  uploadedAt: string;
  description?: string;
  tags: string[];
  isPublic: boolean;
  fileData?: string;
}

const fileTypeIcons: Record<string, any> = {
  'image/': Image,
  'video/': Video,
  'audio/': Music,
  'application/pdf': FileText,
  'application/zip': Archive,
  'text/': FileText,
};

const getFileIcon = (mimeType: string) => {
  for (const [type, Icon] of Object.entries(fileTypeIcons)) {
    if (mimeType.startsWith(type)) {
      return Icon;
    }
  }
  return FileText;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

function PersistentFileTab({ client }: { client: Client }) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch files from database
  const { data: files = [], isLoading, refetch } = useQuery<ClientFile[]>({
    queryKey: ['clientFiles', client.id],
    queryFn: async () => {
      
      const response = await fetch(`/api/client-files/${client.id}`);
      if (!response.ok) {
        
        throw new Error('Failed to fetch files');
      }
      const data = await response.json();
      
      return data;
    },
  });

  // Upload mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileData: { file: File; description: string; tags: string[] }) => {
      setIsUploading(true);
      
      // Convert file to base64 for storage
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(',')[1]); // Remove data:...;base64, prefix
        };
        reader.readAsDataURL(fileData.file);
      });

      const payload = {
        fileName: fileData.file.name,
        fileSize: fileData.file.size,
        mimeType: fileData.file.type,
        clientId: client.id,
        uploadedBy: "165378c1-a470-4cdb-87f7-5f8761709763", // Default user ID
        description: fileData.description,
        tags: fileData.tags,
        fileData: base64,
        isPublic: false
      };

      
      const response = await fetch('/api/client-files', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        
        throw new Error('Upload failed');
      }
      const result = await response.json();
      
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientFiles', client.id] });
      setSelectedFile(null);
      setDescription('');
      setTags('');
      setIsUploadDialogOpen(false);
      setIsUploading(false);
      
      toast({
        title: '✅ הועלה בהצלחה',
        description: 'הקובץ נשמר במסד הנתונים ולא ייעלם ברענון',
      });
    },
    onError: () => {
      setIsUploading(false);
      toast({
        title: 'שגיאה בהעלאה',
        description: 'הקובץ לא הועלה. נסה שוב.',
        variant: 'destructive'
      });
    }
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/client-files/${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientFiles', client.id] });
      toast({
        title: '✅ נמחק בהצלחה',
        description: 'הקובץ הוסר מהמערכת',
      });
    }
  });

  const handleUpload = () => {
    if (!selectedFile) return;

    const tagList = tags.split(',').map(tag => tag.trim()).filter(Boolean);
    uploadMutation.mutate({ 
      file: selectedFile, 
      description, 
      tags: tagList 
    });
  };

  const handleDelete = (fileId: string, fileName: string) => {
    if (confirm(`האם אתה בטוח שברצונך למחוק את הקובץ "${fileName}"?`)) {
      deleteMutation.mutate(fileId);
    }
  };

  const downloadFile = (file: ClientFile) => {
    if (!file.fileData) {
      toast({
        title: 'שגיאה',
        description: 'לא ניתן להוריד את הקובץ',
        variant: 'destructive'
      });
      return;
    }

    const byteCharacters = atob(file.fileData);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: file.mimeType });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = file.fileName;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Database className="w-5 h-5" />
              קבצים קבועים
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              קבצים שנשמרים במסד הנתונים ולא ייעלמו ברענון
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => refetch()} size="sm" variant="outline">
              <RefreshCw className="w-4 h-4 ml-1" />
              רענן
            </Button>
            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Plus className="w-4 h-4 ml-1" />
                  העלה קובץ
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md" dir="rtl">
                <DialogHeader>
                  <DialogTitle>העלאת קובץ חדש</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="file">בחר קובץ</Label>
                    <Input
                      id="file"
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="description">תיאור</Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="תיאור הקובץ..."
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="tags">תגיות (מופרדות בפסיק)</Label>
                    <Input
                      id="tags"
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="חוזה, חשוב, פרויקט"
                      className="mt-1"
                    />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button 
                      onClick={handleUpload} 
                      disabled={!selectedFile || isUploading}
                      className="flex-1"
                    >
                      {isUploading ? (
                        <>
                          <RefreshCw className="w-4 h-4 ml-1 animate-spin" />
                          מעלה...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4 ml-1" />
                          שמור
                        </>
                      )}
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setIsUploadDialogOpen(false)}
                      className="flex-1"
                    >
                      ביטול
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin ml-2" />
            טוען קבצים...
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Database className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">לא נמצאו קבצים</p>
            <p className="text-sm">העלה קובץ ראשון כדי להתחיל</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file) => {
              const FileIcon = getFileIcon(file.mimeType);
              return (
                <div
                  key={file.id}
                  className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
                >
                  <FileIcon className="w-8 h-8 text-blue-600 shrink-0" />
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h4 className="font-medium truncate">{file.fileName}</h4>
                      <Badge variant="secondary" className="text-xs">
                        {formatFileSize(file.fileSize)}
                      </Badge>
                    </div>
                    
                    {file.description && (
                      <p className="text-sm text-gray-600 mb-1">{file.description}</p>
                    )}
                    
                    {file.tags.length > 0 && (
                      <div className="flex gap-1 mb-2">
                        {file.tags.map((tag, i) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                    
                    <p className="text-xs text-gray-500">
                      הועלה ב-{new Date(file.uploadedAt).toLocaleDateString('he-IL')}
                    </p>
                  </div>
                  
                  <div className="flex gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadFile(file)}
                      title="הורד קובץ"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDelete(file.id, file.fileName)}
                      title="מחק קובץ"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function LocalDriveTab({ client }: { client: Client }) {
  const {
    files,
    selectedFolder,
    isLoading,
    selectFolder,
    uploadFile
  } = useLocalDrive();

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl flex items-center gap-2">
              <Folder className="w-5 h-5" />
              תיקיות מקומיות
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              גישה לקבצים במחשב שלך עם סנכרון Google Drive
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={selectFolder} size="sm">
              {selectedFolder ? 'שנה תיקייה' : 'בחר תיקיית Google Drive'}
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <CardContent>
        {!selectedFolder ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">לא נבחרה תיקייה</p>
            <p className="text-sm">לחץ על "בחר תיקיית Google Drive" כדי להתחיל</p>
          </div>
        ) : isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin ml-2" />
            סורק קבצים...
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Folder className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">התיקייה ריקה</p>
            <p className="text-sm">לא נמצאו קבצים בתיקייה הנבחרת</p>
          </div>
        ) : (
          <div className="space-y-3">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50"
              >
                <FileText className="w-8 h-8 text-blue-600 shrink-0" />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium truncate">{file.name}</h4>
                    <Badge variant="secondary" className="text-xs">
                      {formatFileSize(file.size)}
                    </Badge>
                  </div>
                  
                  <p className="text-xs text-gray-500 mb-1">
                    {file.path}
                  </p>
                  
                  <p className="text-xs text-gray-500">
                    עדכון אחרון: {file.lastModified.toLocaleDateString('he-IL')}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default function SimpleFileManager({ client }: SimpleFileManagerProps) {
  return (
    <div className="space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">קבצי {client.name}</h1>
        <Badge variant="outline" className="text-sm">
          ניהול קבצים מתקדם
        </Badge>
      </div>

      <Tabs defaultValue="persistent" className="w-full">
        <TabsList className="w-full h-12">
          <TabsTrigger value="persistent" className="flex-1 text-lg py-2">
            <Database className="w-5 h-5 ml-2" />
            קבצים קבועים
          </TabsTrigger>
          <TabsTrigger value="google-drive" className="flex-1 text-lg py-2">
            <Cloud className="w-5 h-5 ml-2" />
            Google Drive
          </TabsTrigger>
          <TabsTrigger value="local-drive" className="flex-1 text-lg py-2">
            <Folder className="w-5 h-5 ml-2" />
            תיקיות מקומיות
          </TabsTrigger>
        </TabsList>

        <TabsContent value="persistent" className="mt-6">
          <PersistentFileTab client={client} />
        </TabsContent>

        <TabsContent value="google-drive" className="mt-6">
          <GoogleDriveManager client={client} />
        </TabsContent>

        <TabsContent value="local-drive" className="mt-6">
          <LocalDriveTab client={client} />
        </TabsContent>
      </Tabs>
    </div>
  );
}