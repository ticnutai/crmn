import { useState, useCallback, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

interface LocalFile {
  name: string;
  path: string;
  size: number;
  type: string;
  lastModified: Date;
}

export const useLocalDrive = () => {
  const [files, setFiles] = useState<LocalFile[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [directoryHandle, setDirectoryHandle] = useState<any>(null);
  const { toast } = useToast();

  // Check if File System Access API is supported
  const isSupported = 'showDirectoryPicker' in window;

  // Load previously selected folder on mount
  useEffect(() => {
    const savedFolder = localStorage.getItem('selectedDriveFolder');
    if (savedFolder) {
      setSelectedFolder(savedFolder);
    }
  }, []);

  // Helper function to determine file type from extension
  const getFileTypeFromExtension = (filename: string): string => {
    const ext = filename.split('.').pop()?.toLowerCase();
    const typeMap: { [key: string]: string } = {
      pdf: 'application/pdf',
      doc: 'application/msword',
      docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      xls: 'application/vnd.ms-excel',
      xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      txt: 'text/plain',
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      zip: 'application/zip',
      rar: 'application/x-rar-compressed',
    };
    return typeMap[ext || ''] || 'application/octet-stream';
  };

  // Recursively read directory contents
  const readDirectory = useCallback(async (dirHandle: any, currentPath: string = '', maxDepth: number = 2): Promise<LocalFile[]> => {
    const fileList: LocalFile[] = [];
    const depth = currentPath.split('/').filter(Boolean).length;
    
    if (depth >= maxDepth) return fileList;

    try {
      for await (const [name, handle] of dirHandle.entries()) {
        const fullPath = currentPath ? `${currentPath}/${name}` : name;
        
        if (handle.kind === 'file') {
          try {
            const file = await handle.getFile();
            fileList.push({
              name: file.name,
              path: fullPath,
              size: file.size,
              type: file.type || getFileTypeFromExtension(file.name),
              lastModified: new Date(file.lastModified),
            });
          } catch (error) {
            
          }
        } else if (handle.kind === 'directory') {
          // Recursively read subdirectories
          try {
            const subFiles = await readDirectory(handle, fullPath, maxDepth);
            fileList.push(...subFiles);
          } catch (error) {
            
          }
        }
      }
    } catch (error) {
      
    }

    return fileList;
  }, []);

  const selectFolder = useCallback(async () => {
    if (!isSupported) {
      toast({
        title: "לא נתמך",
        description: "השתמש בדפדפן Chrome או Edge מעודכן לגישה לתיקיות מקומיות",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Request directory access with specific options for Google Drive folder
      const newDirectoryHandle = await (window as any).showDirectoryPicker({
        mode: 'readwrite',
        id: 'google-drive-sync-folder',
        startIn: 'documents', // Start in Documents folder where Google Drive is usually located
      });

      const fileList = await readDirectory(newDirectoryHandle);
      
      setFiles(fileList);
      setDirectoryHandle(newDirectoryHandle);
      setSelectedFolder(newDirectoryHandle.name);
      
      // Store directory handle reference for future sync operations
      localStorage.setItem('selectedDriveFolder', newDirectoryHandle.name);
      
      toast({
        title: "תיקיית Google Drive נבחרה בהצלחה",
        description: `נמצאו ${fileList.length} קבצים. התיקייה מוכנה לסנכרון אוטומטי`,
      });

    } catch (error: any) {
      if (error.name === 'AbortError') {
        toast({
          title: "הבחירה בוטלה",
          description: "לא נבחרה תיקייה",
        });
      } else {
        
        toast({
          title: "שגיאה בבחירת תיקייה",
          description: "ודא שתיקיית Google Drive נגישה ונסה שוב",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [isSupported, toast, readDirectory]);

  const syncWithGoogleDrive = useCallback(async (showNotification = false) => {
    if (!directoryHandle) {
      if (showNotification) {
        toast({
          title: "לא נבחרה תיקייה",
          description: "בחר תיקיית Google Drive תחילה",
          variant: "destructive",
        });
      }
      return;
    }

    try {
      setIsLoading(true);
      
      // Re-read the directory to check for changes
      const newFileList = await readDirectory(directoryHandle);
      
      // Compare with current files to detect changes
      const addedFiles = newFileList.filter(newFile => 
        !files.some(existingFile => 
          existingFile.path === newFile.path && 
          existingFile.lastModified.getTime() === newFile.lastModified.getTime()
        )
      );

      const removedFiles = files.filter(existingFile =>
        !newFileList.some(newFile => newFile.path === existingFile.path)
      );
      
      setFiles(newFileList);
      
      // Only show notification if explicitly requested or if there are changes
      if (showNotification || addedFiles.length > 0 || removedFiles.length > 0) {
        let message = `עודכנו ${newFileList.length} קבצים`;
        if (addedFiles.length > 0) {
          message += `, ${addedFiles.length} קבצים חדשים נמצאו`;
        }
        if (removedFiles.length > 0) {
          message += `, ${removedFiles.length} קבצים הוסרו`;
        }
        
        toast({
          title: "סנכרון הושלם",
          description: message,
        });
      }

    } catch (error: any) {
      
      if (showNotification) {
        toast({
          title: "שגיאה בסנכרון",
          description: "לא ניתן לגשת לתיקיית Google Drive. נסה לבחור אותה שוב",
          variant: "destructive",
        });
      }
    } finally {
      setIsLoading(false);
    }
  }, [files, toast, directoryHandle, readDirectory]);

  // Auto-sync every 10 seconds when folder is selected
  useEffect(() => {
    if (!directoryHandle) return;

    // Initial sync without notification
    syncWithGoogleDrive(false);
    
    const interval = setInterval(() => {
      syncWithGoogleDrive(false); // Silent sync every 10 seconds
    }, 10000); // Sync every 10 seconds for faster updates

    return () => clearInterval(interval);
  }, [directoryHandle, syncWithGoogleDrive]);

  const uploadFile = useCallback(async (file: File) => {
    if (!directoryHandle) {
      toast({
        title: "לא נבחרה תיקייה",
        description: "בחר תיקיית Google Drive תחילה",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // Create a new file in the selected directory
      const fileHandle = await directoryHandle.getFileHandle(file.name, { create: true });
      const writable = await fileHandle.createWritable();
      await writable.write(file);
      await writable.close();
      
      // Refresh file list
      await syncWithGoogleDrive(false);
      
      toast({
        title: "קובץ הועלה בהצלחה",
        description: `הקובץ ${file.name} נשמר בתיקיית Google Drive`,
      });

    } catch (error: any) {
      
      toast({
        title: "שגיאה בהעלאת קובץ",
        description: "לא ניתן לשמור את הקובץ. ודא שיש הרשאות כתיבה",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }, [directoryHandle, syncWithGoogleDrive, toast]);

  return {
    files,
    isLoading,
    isSupported,
    selectedFolder,
    selectFolder,
    syncWithGoogleDrive,
    uploadFile,
  };
};