import { useState, useEffect, useCallback } from 'react';
import { gapi } from 'gapi-script';

interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  size?: string;
  createdTime: string;
  modifiedTime: string;
  parents?: string[];
  webViewLink?: string;
  thumbnailLink?: string;
}

interface DriveApiResponse {
  files: DriveFile[];
  nextPageToken?: string;
}

interface UploadResult {
  id: string;
  name: string;
  mimeType: string;
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const DISCOVERY_DOCS = ['https://www.googleapis.com/discovery/v1/apis/drive/v3/rest'];
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

export const useGoogleDrive = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [user, setUser] = useState<gapi.auth2.GoogleUser | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize Google API
  useEffect(() => {
    const initializeGapi = async () => {
      if (!CLIENT_ID || !API_KEY) {
        setError('Google Drive API credentials not configured');
        return;
      }

      try {
        await new Promise<void>((resolve) => {
          gapi.load('client:auth2', resolve);
        });

        await gapi.client.init({
          apiKey: API_KEY,
          clientId: CLIENT_ID,
          discoveryDocs: DISCOVERY_DOCS,
          scope: SCOPES
        });

        const authInstance = gapi.auth2.getAuthInstance();
        setIsSignedIn(authInstance.isSignedIn.get());
        
        if (authInstance.isSignedIn.get()) {
          setUser(authInstance.currentUser.get());
        }

        authInstance.isSignedIn.listen(setIsSignedIn);
        setIsInitialized(true);
      } catch (error) {
        
        setError('Failed to initialize Google Drive API');
      }
    };

    initializeGapi();
  }, []);

  // Sign in to Google Drive
  const signIn = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      setLoading(true);
      const authInstance = gapi.auth2.getAuthInstance();
      const user = await authInstance.signIn();
      setUser(user);
      setError(null);
    } catch (error) {
      
      setError('Failed to sign in to Google Drive');
    } finally {
      setLoading(false);
    }
  }, [isInitialized]);

  // Sign out from Google Drive
  const signOut = useCallback(async () => {
    if (!isInitialized) return;
    
    try {
      const authInstance = gapi.auth2.getAuthInstance();
      await authInstance.signOut();
      setUser(null);
      setError(null);
    } catch (error) {
      
      setError('Failed to sign out from Google Drive');
    }
  }, [isInitialized]);

  // List files
  const listFiles = useCallback(async (
    pageSize = 10, 
    query = '', 
    folderId?: string
  ): Promise<DriveApiResponse> => {
    if (!isSignedIn) throw new Error('Not signed in to Google Drive');
    
    setLoading(true);
    setError(null);
    
    try {
      let searchQuery = query;
      if (folderId) {
        searchQuery = `'${folderId}' in parents`;
        if (query) {
          searchQuery += ` and ${query}`;
        }
      }

      const response = await (gapi.client as any).drive.files.list({
        pageSize,
        fields: 'nextPageToken, files(id, name, mimeType, size, createdTime, modifiedTime, parents, webViewLink, thumbnailLink)',
        q: searchQuery || 'trashed=false'
      });
      
      return response.result as DriveApiResponse;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to list files';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Create folder
  const createFolder = useCallback(async (
    name: string, 
    parentId = 'root'
  ): Promise<DriveFile> => {
    if (!isSignedIn) throw new Error('Not signed in to Google Drive');
    
    setLoading(true);
    setError(null);

    try {
      const fileMetadata = {
        name,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parentId]
      };

      const response = await (gapi.client as any).drive.files.create({
        resource: fileMetadata,
        fields: 'id, name, mimeType, createdTime, modifiedTime'
      });

      return response.result as DriveFile;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create folder';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Upload file
  const uploadFile = useCallback(async (
    file: File, 
    parentId = 'root',
    description?: string
  ): Promise<UploadResult> => {
    if (!isSignedIn) throw new Error('Not signed in to Google Drive');
    
    setLoading(true);
    setError(null);

    try {
      const fileMetadata = {
        name: file.name,
        parents: [parentId],
        description
      };

      const form = new FormData();
      form.append('metadata', new Blob([JSON.stringify(fileMetadata)], { type: 'application/json' }));
      form.append('file', file);

      const response = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
        },
        body: form
      });

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const result = await response.json();
      return result as UploadResult;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Download file
  const downloadFile = useCallback(async (fileId: string): Promise<Blob> => {
    if (!isSignedIn) throw new Error('Not signed in to Google Drive');
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
        headers: {
          'Authorization': `Bearer ${gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Download failed: ${response.statusText}`);
      }

      return await response.blob();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Delete file
  const deleteFile = useCallback(async (fileId: string): Promise<void> => {
    if (!isSignedIn) throw new Error('Not signed in to Google Drive');
    
    setLoading(true);
    setError(null);

    try {
      await (gapi.client as any).drive.files.delete({ fileId });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  // Search files
  const searchFiles = useCallback(async (searchTerm: string): Promise<DriveFile[]> => {
    const query = `name contains '${searchTerm}' and trashed=false`;
    const response = await listFiles(50, query);
    return response.files;
  }, [listFiles]);

  // Get file link
  const getFileLink = useCallback(async (fileId: string): Promise<string> => {
    if (!isSignedIn) throw new Error('Not signed in to Google Drive');
    
    try {
      const response = await (gapi.client as any).drive.files.get({
        fileId,
        fields: 'webViewLink'
      });
      
      return response.result.webViewLink || '';
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to get file link';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [isSignedIn]);

  return {
    // State
    isInitialized,
    isSignedIn,
    user,
    loading,
    error,
    
    // Actions
    signIn,
    signOut,
    listFiles,
    createFolder,
    uploadFile,
    downloadFile,
    deleteFile,
    searchFiles,
    getFileLink
  };
};