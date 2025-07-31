import { useState, useEffect } from 'react';
import { useGoogleDrive } from '@/hooks/useGoogleDrive';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Cloud, 
  FolderPlus, 
  Upload, 
  Download, 
  ExternalLink,
  Trash2,
  FileText,
  Image,
  Video,
  Music,
  Archive,
  Loader2,
  AlertCircle,
  LogIn,
  LogOut
} from 'lucide-react';
import type { Client } from '@shared/schema';

interface GoogleDriveManagerProps {
  client: Client;
}

const getFileIcon = (mimeType: string) => {
  if (mimeType.includes('image')) return Image;
  if (mimeType.includes('video')) return Video;
  if (mimeType.includes('audio')) return Music;
  if (mimeType.includes('zip') || mimeType.includes('rar')) return Archive;
  return FileText;
};

const formatFileSize = (bytes?: string): string => {
  if (!bytes) return 'Unknown size';
  const size = parseInt(bytes);
  if (size === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(size) / Math.log(k));
  return parseFloat((size / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export default function GoogleDriveManager({ client }: GoogleDriveManagerProps) {
  const {
    isInitialized,
    isSignedIn,
    user,
    loading,
    error,
    signIn,
    signOut,
    listFiles,
    createFolder,
    uploadFile,
    downloadFile,
    deleteFile,
    searchFiles
  } = useGoogleDrive();

  const [files, setFiles] = useState<any[]>([]);
  const [currentFolder, setCurrentFolder] = useState<string>('root');
  const [clientFolderId, setClientFolderId] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  const { toast } = useToast();

  // Load files when signed in or folder changes
  useEffect(() => {
    if (isSignedIn && currentFolder) {
      loadFiles();
    }
  }, [isSignedIn, currentFolder]);

  // Initialize client folder on sign in
  useEffect(() => {
    if (isSignedIn && !clientFolderId) {
      initializeClientFolder();
    }
  }, [isSignedIn]);

  const loadFiles = async () => {
    try {
      const response = await listFiles(50, '', currentFolder);
      setFiles(response.files);
    } catch (error) {
      
      toast({
        title: 'שגיאה',
        description: 'טעינת הקבצים נכשלה',
        variant: 'destructive'
      });
    }
  };

  const initializeClientFolder = async () => {
    try {
      // Check if client folder already exists
      const response = await listFiles(50, `name='${client.name}' and mimeType='application/vnd.google-apps.folder'`);
      
      let folderId: string;
      
      if (response.files.length > 0) {
        // Use existing folder
        folderId = response.files[0].id;
      } else {
        // Create new folder for client
        const folder = await createFolder(client.name);
        folderId = folder.id;
        
        toast({
          title: 'תיקייה נוצרה',
          description: `נוצרה תיקייה חדשה עבור ${client.name}`,
        });
      }
      
      setClientFolderId(folderId);
      setCurrentFolder(folderId);
    } catch (error) {
      
      toast({
        title: 'שגיאה',
        description: 'יצירת תיקיית הלקוח נכשלה',
        variant: 'destructive'
      });
    }
  };

  const handleUpload = async () => {
    if (!selectedFile || !clientFolderId) return;

    try {
      await uploadFile(selectedFile, clientFolderId, `קובץ עבור לקוח: ${client.name}`);
      
      toast({
        title: 'הועלה בהצלחה',
        description: `הקובץ ${selectedFile.name} הועלה לGoogle Drive`,
      });
      
      setSelectedFile(null);
      setIsUploadDialogOpen(false);
      await loadFiles();
    } catch (error) {
      
      toast({
        title: 'שגיאה',
        description: 'העלאת הקובץ נכשלה',
        variant: 'destructive'
      });
    }
  };

  const handleDownload = async (file: any) => {
    try {
      const blob = await downloadFile(file.id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      toast({
        title: 'הורד בהצלחה',
        description: `הקובץ ${file.name} הורד בהצלחה`,
      });
    } catch (error) {
      
      toast({
        title: 'שגיאה',
        description: 'הורדת הקובץ נכשלה',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (fileId: string, fileName: string) => {
    try {
      await deleteFile(fileId);
      
      toast({
        title: 'נמחק בהצלחה',
        description: `הקובץ ${fileName} נמחק מGoogle Drive`,
      });
      
      await loadFiles();
    } catch (error) {
      
      toast({
        title: 'שגיאה',
        description: 'מחיקת הקובץ נכשלה',
        variant: 'destructive'
      });
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      await loadFiles();
      return;
    }
    
    try {
      const searchResults = await searchFiles(searchTerm);
      setFiles(searchResults);
    } catch (error) {
      
      toast({
        title: 'שגיאה',
        description: 'החיפוש נכשל',
        variant: 'destructive'
      });
    }
  };

  const handleCreateFolder = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const folderName = formData.get('folderName') as string;
    
    if (!folderName || !clientFolderId) return;

    try {
      await createFolder(folderName, clientFolderId);
      
      toast({
        title: 'תיקייה נוצרה',
        description: `התיקייה ${folderName} נוצרה בהצלחה`,
      });
      
      setIsFolderDialogOpen(false);
      await loadFiles();
    } catch (error) {
      
      toast({
        title: 'שגיאה',
        description: 'יצירת התיקייה נכשלה',
        variant: 'destructive'
      });
    }
  };

  if (!isInitialized) {
    return (
      <Card className="w-full">
        <CardContent className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">מאתחל Google Drive...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error && !isSignedIn) {
    return (
      <Card className="w-full">
        <CardContent className="py-12">
          <div className="text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">שגיאה בהגדרות Google Drive</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <p className="text-sm text-muted-foreground">
              יש צורך בהגדרת API credentials של Google Drive
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!isSignedIn) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Cloud className="w-5 h-5" />
            Google Drive - קבצי {client.name}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Cloud className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">התחבר לGoogle Drive</h3>
            <p className="text-muted-foreground mb-6">
              התחבר כדי לנהל קבצי לקוח ישירות מהמערכת
            </p>
            <Button onClick={signIn} disabled={loading}>
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin ml-2" />
              ) : (
                <LogIn className="w-4 h-4 ml-2" />
              )}
              התחבר לGoogle Drive
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Cloud className="w-5 h-5" />
              Google Drive - קבצי {client.name}
            </CardTitle>
            {user && (
              <p className="text-sm text-muted-foreground mt-1">
                מחובר כ: {user.getBasicProfile().getEmail()}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderPlus className="w-4 h-4 ml-2" />
                  תיקייה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateFolder} className="space-y-4">
                  <Input name="folderName" placeholder="שם התיקייה" required />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button type="submit" disabled={loading}>
                      {loading ? 'יוצר...' : 'צור תיקייה'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="w-4 h-4 ml-2" />
                  העלאה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>העלאת קובץ לGoogle Drive</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <Input
                    type="file"
                    onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  />
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsUploadDialogOpen(false)}
                    >
                      ביטול
                    </Button>
                    <Button 
                      onClick={handleUpload} 
                      disabled={!selectedFile || loading}
                    >
                      {loading ? (
                        <Loader2 className="w-4 h-4 animate-spin ml-2" />
                      ) : (
                        <Upload className="w-4 h-4 ml-2" />
                      )}
                      העלה
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={signOut}>
              <LogOut className="w-4 h-4 ml-2" />
              התנתק
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Search */}
        <div className="flex gap-2 mb-6">
          <Input
            placeholder="חיפוש קבצים..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button onClick={handleSearch} disabled={loading}>
            חפש
          </Button>
          <Button variant="outline" onClick={loadFiles} disabled={loading}>
            הצג הכל
          </Button>
        </div>

        {/* Files Grid */}
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-8 h-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {files.map((file) => {
              const IconComponent = getFileIcon(file.mimeType);
              const isFolder = file.mimeType === 'application/vnd.google-apps.folder';
              
              return (
                <Card key={file.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <IconComponent className="w-5 h-5 text-muted-foreground flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <h4 className="font-medium text-sm truncate">{file.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {isFolder ? 'תיקייה' : formatFileSize(file.size)}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Drive
                      </Badge>
                    </div>

                    <div className="flex justify-between items-center text-xs text-muted-foreground mb-3">
                      <span>{new Date(file.modifiedTime).toLocaleDateString('he-IL')}</span>
                    </div>

                    <div className="flex justify-end gap-1">
                      {!isFolder && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-7 w-7"
                          onClick={() => handleDownload(file)}
                        >
                          <Download className="w-3 h-3" />
                        </Button>
                      )}
                      {file.webViewLink && (
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-7 w-7"
                          onClick={() => window.open(file.webViewLink, '_blank')}
                        >
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                      )}
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="p-1 h-7 w-7 text-destructive"
                        onClick={() => handleDelete(file.id, file.name)}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {files.length === 0 && !loading && (
          <div className="text-center py-12">
            <Cloud className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-medium text-muted-foreground mb-2">
              אין קבצים
            </h3>
            <p className="text-sm text-muted-foreground mb-4">
              העלה קובץ ראשון לתיקיית הלקוח
            </p>
            <Button onClick={() => setIsUploadDialogOpen(true)}>
              <Upload className="w-4 h-4 ml-2" />
              העלה קובץ
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}