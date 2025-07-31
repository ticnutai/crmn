import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
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
  Eye, 
  FolderPlus,
  Folder,
  ExternalLink,
  Search,
  Database
} from 'lucide-react';
import type { Client } from '@shared/schema';
import GoogleDriveManager from './google-drive-manager';
import PersistentFileManager from './persistent-file-manager';

interface ClientFile {
  id: string;
  clientId: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  driveFileId?: string;
  dropboxPath?: string;
  uploadDate: Date;
  description?: string;
  tags?: string[];
  isPublic: boolean;
}

interface CloudFolder {
  id: string;
  name: string;
  clientId: string;
  driveId?: string;
  dropboxPath?: string;
  createdAt: Date;
}

const fileTypeIcons: Record<string, any> = {
  pdf: FileText,
  doc: FileText,
  docx: FileText,
  txt: FileText,
  jpg: Image,
  jpeg: Image,
  png: Image,
  gif: Image,
  mp4: Video,
  avi: Video,
  mov: Video,
  mp3: Music,
  wav: Music,
  zip: Archive,
  rar: Archive,
};

const getFileIcon = (fileType: string) => {
  const IconComponent = fileTypeIcons[fileType.toLowerCase()] || FileText;
  return IconComponent;
};

const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface ClientFilesProps {
  client: Client;
}

export default function ClientFiles({ client }: ClientFilesProps) {
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);
  const [isFolderDialogOpen, setIsFolderDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFolder, setSelectedFolder] = useState<string>('all');
  const [cloudProvider, setCloudProvider] = useState<'google' | 'dropbox'>('google');

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Mock data for now - will be replaced with actual API calls
  const files: ClientFile[] = [
    {
      id: '1',
      clientId: client.id,
      fileName: 'חוזה עבודה.pdf',
      fileType: 'pdf',
      fileSize: 245760,
      uploadDate: new Date('2024-01-15'),
      description: 'חוזה עבודה מעודכן',
      tags: ['חוזה', 'משפטי'],
      isPublic: false
    },
    {
      id: '2',
      clientId: client.id,
      fileName: 'דוח התקדמות.docx',
      fileType: 'docx',
      fileSize: 125440,
      uploadDate: new Date('2024-01-20'),
      description: 'דוח התקדמות חודשי',
      tags: ['דוח', 'התקדמות'],
      isPublic: true
    }
  ];

  const folders: CloudFolder[] = [
    {
      id: '1',
      name: 'מסמכים משפטיים',
      clientId: client.id,
      createdAt: new Date('2024-01-01')
    },
    {
      id: '2', 
      name: 'דוחות',
      clientId: client.id,
      createdAt: new Date('2024-01-02')
    }
  ];

  const filesLoading = false;
  const foldersLoading = false;

  // Upload file mutation
  const uploadMutation = useMutation({
    mutationFn: async (fileData: FormData) => {
      const response = await fetch('/api/client-files/upload', {
        method: 'POST',
        body: fileData,
      });
      if (!response.ok) throw new Error('Upload failed');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'הקובץ הועלה בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['/api/client-files'] });
      setIsUploadDialogOpen(false);
      setSelectedFile(null);
      setDescription('');
      setTags('');
    },
    onError: () => {
      toast({ 
        title: 'שגיאה', 
        description: 'העלאת הקובץ נכשלה',
        variant: 'destructive' 
      });
    },
  });

  // Create folder mutation
  const createFolderMutation = useMutation({
    mutationFn: async (folderData: any) => {
      const response = await fetch('/api/client-folders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(folderData),
      });
      if (!response.ok) throw new Error('Folder creation failed');
      return response.json();
    },
    onSuccess: () => {
      toast({ title: 'התיקייה נוצרה בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['/api/client-folders'] });
      setIsFolderDialogOpen(false);
    },
    onError: () => {
      toast({ 
        title: 'שגיאה', 
        description: 'יצירת התיקייה נכשלה',
        variant: 'destructive' 
      });
    },
  });

  // Delete file mutation
  const deleteMutation = useMutation({
    mutationFn: async (fileId: string) => {
      const response = await fetch(`/api/client-files/${fileId}`, {
        method: 'DELETE',
      });
      if (!response.ok) throw new Error('Delete failed');
    },
    onSuccess: () => {
      toast({ title: 'הקובץ נמחק בהצלחה' });
      queryClient.invalidateQueries({ queryKey: ['/api/client-files'] });
    },
    onError: () => {
      toast({ 
        title: 'שגיאה', 
        description: 'מחיקת הקובץ נכשלה',
        variant: 'destructive' 
      });
    },
  });

  const handleUpload = () => {
    if (!selectedFile) return;

    const formData = new FormData();
    formData.append('file', selectedFile);
    formData.append('clientId', client.id);
    formData.append('description', description);
    formData.append('tags', tags);
    formData.append('isPublic', isPublic.toString());
    formData.append('cloudProvider', cloudProvider);

    uploadMutation.mutate(formData);
  };

  const handleCreateFolder = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    createFolderMutation.mutate({
      clientId: client.id,
      name: formData.get('folderName'),
      cloudProvider,
    });
  };

  const filteredFiles = files.filter((file: ClientFile) => {
    const matchesSearch = file.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         file.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFolder = selectedFolder === 'all' || file.tags?.includes(selectedFolder);
    return matchesSearch && matchesFolder;
  });

  if (filesLoading || foldersLoading) {
    return <div className="text-center py-8">טוען קבצים...</div>;
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl">קבצי {client.name}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              ניהול מסמכים וקבצים בענן
            </p>
          </div>
          <div className="flex gap-2">
            <Dialog open={isFolderDialogOpen} onOpenChange={setIsFolderDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <FolderPlus className="w-4 h-4 ml-2" />
                  תיקייה חדשה
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreateFolder} className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">שם התיקייה</label>
                    <Input name="folderName" placeholder="הזן שם תיקייה" required />
                  </div>
                  <div>
                    <label className="text-sm font-medium">שירות ענן</label>
                    <Select value={cloudProvider} onValueChange={(value: any) => setCloudProvider(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Drive</SelectItem>
                        <SelectItem value="dropbox">Dropbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setIsFolderDialogOpen(false)}>
                      ביטול
                    </Button>
                    <Button type="submit" disabled={createFolderMutation.isPending}>
                      {createFolderMutation.isPending ? 'יוצר...' : 'צור תיקייה'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isUploadDialogOpen} onOpenChange={setIsUploadDialogOpen}>
              <DialogTrigger asChild>
                <Button size="sm">
                  <Upload className="w-4 h-4 ml-2" />
                  העלאת קובץ
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>העלאת קובץ חדש</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">בחר קובץ</label>
                    <Input
                      type="file"
                      onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                      className="mt-1"
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium">תיאור</label>
                    <Textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="תיאור הקובץ (אופציונלי)"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">תגיות</label>
                    <Input
                      value={tags}
                      onChange={(e) => setTags(e.target.value)}
                      placeholder="תגיות מופרדות בפסיקים"
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium">שירות ענן</label>
                    <Select value={cloudProvider} onValueChange={(value: any) => setCloudProvider(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="google">Google Drive</SelectItem>
                        <SelectItem value="dropbox">Dropbox</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="isPublic"
                      checked={isPublic}
                      onChange={(e) => setIsPublic(e.target.checked)}
                    />
                    <label htmlFor="isPublic" className="text-sm">קובץ ציבורי</label>
                  </div>

                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => setIsUploadDialogOpen(false)}
                    >
                      ביטול
                    </Button>
                    <Button 
                      onClick={handleUpload} 
                      disabled={!selectedFile || uploadMutation.isPending}
                    >
                      {uploadMutation.isPending ? 'מעלה...' : 'העלה'}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <Tabs defaultValue="drive" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="drive">Google Drive</TabsTrigger>
            <TabsTrigger value="files">קבצים מקומיים</TabsTrigger>
            <TabsTrigger value="folders">תיקיות</TabsTrigger>
          </TabsList>

          <TabsContent value="drive" className="space-y-4">
            <GoogleDriveManager client={client} />
          </TabsContent>

          <TabsContent value="files" className="space-y-4">
            {/* Search and Filter */}
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="חיפוש קבצים..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select value={selectedFolder} onValueChange={setSelectedFolder}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="סנן לפי תיקייה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">כל הקבצים</SelectItem>
                  {folders.map((folder: CloudFolder) => (
                    <SelectItem key={folder.id} value={folder.name}>
                      {folder.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Files Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFiles.map((file: ClientFile) => {
                const IconComponent = getFileIcon(file.fileType);
                return (
                  <Card key={file.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-5 h-5 text-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <h4 className="font-medium text-sm truncate">{file.fileName}</h4>
                            <p className="text-xs text-muted-foreground">
                              {formatFileSize(file.fileSize)}
                            </p>
                          </div>
                        </div>
                        {file.isPublic && (
                          <Badge variant="secondary" className="text-xs">ציבורי</Badge>
                        )}
                      </div>

                      {file.description && (
                        <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                          {file.description}
                        </p>
                      )}

                      {file.tags && file.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {file.tags.slice(0, 2).map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                          {file.tags.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{file.tags.length - 2}
                            </Badge>
                          )}
                        </div>
                      )}

                      <div className="flex justify-between items-center text-xs text-muted-foreground">
                        <span>{new Date(file.uploadDate).toLocaleDateString('he-IL')}</span>
                        <div className="flex items-center gap-1">
                          {file.driveFileId && (
                            <Badge variant="outline" className="text-xs">Drive</Badge>
                          )}
                          {file.dropboxPath && (
                            <Badge variant="outline" className="text-xs">Dropbox</Badge>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-end gap-1 mt-3">
                        <Button size="sm" variant="ghost" className="p-1 h-7 w-7">
                          <Eye className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="p-1 h-7 w-7">
                          <Download className="w-3 h-3" />
                        </Button>
                        <Button size="sm" variant="ghost" className="p-1 h-7 w-7">
                          <ExternalLink className="w-3 h-3" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="p-1 h-7 w-7 text-destructive"
                          onClick={() => deleteMutation.mutate(file.id)}
                        >
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {filteredFiles.length === 0 && (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  אין קבצים
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {searchTerm ? 'לא נמצאו קבצים התואמים לחיפוש' : 'העלה קבצים כדי להתחיל'}
                </p>
                <Button onClick={() => setIsUploadDialogOpen(true)}>
                  <Upload className="w-4 h-4 ml-2" />
                  העלה קובץ ראשון
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value="folders" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {folders.map((folder: CloudFolder) => (
                <Card key={folder.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Folder className="w-5 h-5 text-muted-foreground" />
                        <div>
                          <h4 className="font-medium text-sm">{folder.name}</h4>
                          <p className="text-xs text-muted-foreground">
                            {new Date(folder.createdAt).toLocaleDateString('he-IL')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        {folder.driveId && (
                          <Badge variant="outline" className="text-xs">Drive</Badge>
                        )}
                        {folder.dropboxPath && (
                          <Badge variant="outline" className="text-xs">Dropbox</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {folders.length === 0 && (
              <div className="text-center py-12">
                <Folder className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-medium text-muted-foreground mb-2">
                  אין תיקיות
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  צור תיקיות לארגון טוב יותר של הקבצים
                </p>
                <Button onClick={() => setIsFolderDialogOpen(true)}>
                  <FolderPlus className="w-4 h-4 ml-2" />
                  צור תיקייה ראשונה
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}