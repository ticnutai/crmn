import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import AddNotificationButton from "@/components/add-notification-button";
import {
  FolderPlus,
  FileText,
  Upload,
  Download,
  Trash2,
  Eye,
  Folder,
  File,
  Plus,
  Search,
  BellRing
} from "lucide-react";

interface ClientFile {
  id: string;
  name: string;
  type: 'file' | 'folder';
  size?: number;
  createdAt: Date;
  path: string;
}

interface ClientFileManagerProps {
  clientId?: string;
  clientName?: string;
}

export default function ClientFileManager({ clientId, clientName }: ClientFileManagerProps) {
  const [files, setFiles] = useState<ClientFile[]>([
    {
      id: '1',
      name: 'מסמכים כלליים',
      type: 'folder',
      createdAt: new Date(),
      path: '/מסמכים כלליים'
    },
    {
      id: '2',
      name: 'חוזים',
      type: 'folder',
      createdAt: new Date(),
      path: '/חוזים'
    },
    {
      id: '3',
      name: 'חוזה ראשי.pdf',
      type: 'file',
      size: 2048576,
      createdAt: new Date(),
      path: '/חוזים/חוזה ראשי.pdf'
    }
  ]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [newFolderName, setNewFolderName] = useState('');
  const [showCreateFolder, setShowCreateFolder] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState(false);
  const { toast } = useToast();

  const filteredFiles = files.filter(file => 
    file.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleCreateFolder = () => {
    if (!newFolderName.trim()) {
      toast({
        title: "שגיאה",
        description: "נא הזן שם תיקייה",
        variant: "destructive",
      });
      return;
    }

    const newFolder: ClientFile = {
      id: Date.now().toString(),
      name: newFolderName.trim(),
      type: 'folder',
      createdAt: new Date(),
      path: `/${newFolderName.trim()}`
    };

    setFiles(prev => [...prev, newFolder]);
    setNewFolderName('');
    setShowCreateFolder(false);
    
    toast({
      title: "תיקייה נוצרה",
      description: `התיקייה "${newFolderName}" נוצרה בהצלחה`,
    });
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const uploadedFiles = event.target.files;
    if (!uploadedFiles) return;

    setUploadingFiles(true);
    
    Array.from(uploadedFiles).forEach(file => {
      const newFile: ClientFile = {
        id: Date.now().toString() + Math.random(),
        name: file.name,
        type: 'file',
        size: file.size,
        createdAt: new Date(),
        path: `/${file.name}`
      };
      
      setFiles(prev => [...prev, newFile]);
    });

    setUploadingFiles(false);
    toast({
      title: "קבצים הועלו",
      description: `${uploadedFiles.length} קבצים הועלו בהצלחה`,
    });
  };

  const handleDeleteFile = (fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    toast({
      title: "קובץ נמחק",
      description: "הקובץ נמחק בהצלחה",
    });
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return '';
    const mb = bytes / (1024 * 1024);
    return mb < 1 ? `${Math.round(bytes / 1024)} KB` : `${mb.toFixed(1)} MB`;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">📁 ניהול קבצים</h2>
          {clientName && (
            <p className="text-gray-600">לקוח: {clientName}</p>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          <AddNotificationButton context="clients" contextId={clientId} />
          <Dialog open={showCreateFolder} onOpenChange={setShowCreateFolder}>
            <DialogTrigger asChild>
              <Button className="flex items-center gap-2">
                <FolderPlus className="w-4 h-4" />
                תיקייה חדשה
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>יצירת תיקייה חדשה</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>שם התיקייה</Label>
                  <Input
                    value={newFolderName}
                    onChange={(e) => setNewFolderName(e.target.value)}
                    placeholder="הזן שם תיקייה..."
                    onKeyPress={(e) => e.key === 'Enter' && handleCreateFolder()}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setShowCreateFolder(false)}>
                    ביטול
                  </Button>
                  <Button onClick={handleCreateFolder}>
                    צור תיקייה
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>

          <Button variant="outline" className="relative">
            <input
              type="file"
              multiple
              onChange={handleFileUpload}
              className="absolute inset-0 opacity-0 cursor-pointer"
              disabled={uploadingFiles}
            />
            <Upload className="w-4 h-4 mr-2" />
            {uploadingFiles ? 'מעלה...' : 'העלה קבצים'}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
          <Input
            placeholder="חפש קבצים ותיקיות..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Badge variant="secondary">
          {filteredFiles.length} פריטים
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredFiles.map(file => (
          <Card key={file.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {file.type === 'folder' ? (
                    <Folder className="w-8 h-8 text-blue-500" />
                  ) : (
                    <File className="w-8 h-8 text-gray-500" />
                  )}
                  <div>
                    <h3 className="font-medium text-sm truncate max-w-[150px]" title={file.name}>
                      {file.name}
                    </h3>
                    <p className="text-xs text-gray-500">
                      {file.createdAt.toLocaleDateString('he-IL')}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost">
                    <Eye className="w-3 h-3" />
                  </Button>
                  <Button size="sm" variant="ghost">
                    <Download className="w-3 h-3" />
                  </Button>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDeleteFile(file.id)}
                  >
                    <Trash2 className="w-3 h-3 text-red-500" />
                  </Button>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <Badge variant={file.type === 'folder' ? 'default' : 'secondary'}>
                  {file.type === 'folder' ? 'תיקייה' : 'קובץ'}
                </Badge>
                {file.size && (
                  <span className="text-xs text-gray-500">
                    {formatFileSize(file.size)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredFiles.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchTerm ? 'לא נמצאו קבצים' : 'אין קבצים עדיין'}
          </h3>
          <p className="text-gray-500">
            {searchTerm 
              ? 'נסה חיפוש אחר או נקה את מונח החיפוש'
              : 'התחל על ידי יצירת תיקייה או העלאת קבצים'
            }
          </p>
        </div>
      )}
    </div>
  );
}