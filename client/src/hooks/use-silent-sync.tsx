import { useEffect, useRef, useCallback } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SyncStatus {
  isOnline: boolean;
  lastSync: number;
  pendingChanges: number;
  syncInProgress: boolean;
}

export function useSilentSync() {
  const queryClient = useQueryClient();
  const syncStatusRef = useRef<SyncStatus>({
    isOnline: navigator.onLine,
    lastSync: Date.now(),
    pendingChanges: 0,
    syncInProgress: false
  });
  const syncIntervalRef = useRef<NodeJS.Timeout>();
  const retryTimeoutRef = useRef<NodeJS.Timeout>();

  // Silent sync function - no user notifications
  const performSilentSync = useCallback(async () => {
    if (syncStatusRef.current.syncInProgress) return;
    
    syncStatusRef.current.syncInProgress = true;
    
    try {
      // Get current user from localStorage
      const userStr = localStorage.getItem('currentUser');
      if (!userStr) return;
      
      const user = JSON.parse(userStr);
      
      // Sync critical data silently
      const syncPromises = [
        queryClient.invalidateQueries({ queryKey: ["/api/clients"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] }),
        queryClient.invalidateQueries({ queryKey: ["/api/users"] })
      ];
      
      await Promise.allSettled(syncPromises);
      
      // Update sync status
      syncStatusRef.current.lastSync = Date.now();
      syncStatusRef.current.pendingChanges = 0;
      
      // Store sync timestamp in localStorage for cross-tab sync
      localStorage.setItem('lastSyncTimestamp', Date.now().toString());
      
    } catch (error) {
      // Silent error handling - only log to console
      
      
      // Retry after 30 seconds on failure
      retryTimeoutRef.current = setTimeout(performSilentSync, 30000);
    } finally {
      syncStatusRef.current.syncInProgress = false;
    }
  }, [queryClient]);

  // Handle online/offline status changes
  const handleOnlineStatusChange = useCallback(() => {
    const isOnline = navigator.onLine;
    syncStatusRef.current.isOnline = isOnline;
    
    if (isOnline) {
      // Perform immediate sync when coming back online
      performSilentSync();
    }
  }, [performSilentSync]);

  // Handle visibility change (tab focus/blur)
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      // Check if we need to sync based on last sync time
      const lastSync = parseInt(localStorage.getItem('lastSyncTimestamp') || '0');
      const timeSinceLastSync = Date.now() - lastSync;
      
      // Sync if more than 2 minutes have passed
      if (timeSinceLastSync > 120000) {
        performSilentSync();
      }
    }
  }, [performSilentSync]);

  // Cross-tab sync mechanism
  const handleStorageChange = useCallback((e: StorageEvent) => {
    if (e.key === 'lastSyncTimestamp' && e.newValue) {
      // Another tab performed sync, update our cache
      queryClient.invalidateQueries();
    }
  }, [queryClient]);

  useEffect(() => {
    // Set up background sync interval (every 3 minutes)
    syncIntervalRef.current = setInterval(performSilentSync, 180000);
    
    // Set up event listeners
    window.addEventListener('online', handleOnlineStatusChange);
    window.addEventListener('offline', handleOnlineStatusChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('storage', handleStorageChange);
    
    // Perform initial sync after 5 seconds
    const initialSyncTimeout = setTimeout(performSilentSync, 5000);
    
    return () => {
      // Cleanup
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
      clearTimeout(initialSyncTimeout);
      
      window.removeEventListener('online', handleOnlineStatusChange);
      window.removeEventListener('offline', handleOnlineStatusChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [performSilentSync, handleOnlineStatusChange, handleVisibilityChange, handleStorageChange]);

  // Return sync status for debugging (not shown to user)
  return {
    isOnline: syncStatusRef.current.isOnline,
    lastSync: syncStatusRef.current.lastSync,
    syncInProgress: syncStatusRef.current.syncInProgress
  };
}