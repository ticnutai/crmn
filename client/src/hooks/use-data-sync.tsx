import { useEffect, useCallback, useRef } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface SyncConfig {
  endpoint: string;
  queryKey: string[];
  syncInterval: number; // in milliseconds
  priority: 'high' | 'medium' | 'low';
}

const SYNC_CONFIGS: SyncConfig[] = [
  {
    endpoint: '/api/time-entries',
    queryKey: ['/api/time-entries'],
    syncInterval: 30000, // 30 seconds for active timers
    priority: 'high'
  },
  {
    endpoint: '/api/clients',
    queryKey: ['/api/clients'],
    syncInterval: 120000, // 2 minutes for client data
    priority: 'medium'
  },
  {
    endpoint: '/api/users',
    queryKey: ['/api/users'],
    syncInterval: 300000, // 5 minutes for user data
    priority: 'low'
  }
];

export function useDataSync() {
  const queryClient = useQueryClient();
  const syncTimersRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const lastSyncRef = useRef<Map<string, number>>(new Map());

  // Silent data comparison and sync
  const syncEndpoint = useCallback(async (config: SyncConfig) => {
    try {
      const user = JSON.parse(localStorage.getItem('currentUser') || '{}');
      if (!user.id) return;

      // Get current cached data
      const cachedData = queryClient.getQueryData(config.queryKey);
      
      // Fetch fresh data
      const response = await fetch(config.endpoint, {
        headers: {
          'Authorization': `Bearer ${user.id}`,
          'x-user-email': user.email || '',
        },
        credentials: 'include'
      });

      if (!response.ok) return;
      
      const freshData = await response.json();
      
      // Compare data and update only if different
      const currentHash = JSON.stringify(cachedData);
      const freshHash = JSON.stringify(freshData);
      
      if (currentHash !== freshHash) {
        queryClient.setQueryData(config.queryKey, freshData);
        
      }
      
      lastSyncRef.current.set(config.endpoint, Date.now());
      
    } catch (error) {
      // Silent error handling
      
    }
  }, [queryClient]);

  // Set up sync timers for each endpoint
  const setupSyncTimers = useCallback(() => {
    SYNC_CONFIGS.forEach(config => {
      // Clear existing timer
      const existingTimer = syncTimersRef.current.get(config.endpoint);
      if (existingTimer) {
        clearInterval(existingTimer);
      }

      // Set up new timer
      const timer = setInterval(() => {
        syncEndpoint(config);
      }, config.syncInterval);

      syncTimersRef.current.set(config.endpoint, timer);
    });
  }, [syncEndpoint]);

  // Handle page visibility changes
  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'visible') {
      // Sync high priority data immediately when tab becomes visible
      const highPriorityConfigs = SYNC_CONFIGS.filter(c => c.priority === 'high');
      highPriorityConfigs.forEach(config => {
        const lastSync = lastSyncRef.current.get(config.endpoint) || 0;
        const timeSinceLastSync = Date.now() - lastSync;
        
        // Sync if more than 30 seconds have passed
        if (timeSinceLastSync > 30000) {
          syncEndpoint(config);
        }
      });
    }
  }, [syncEndpoint]);

  // Handle network status changes
  const handleNetworkChange = useCallback(() => {
    if (navigator.onLine) {
      // Sync all data when network is restored
      SYNC_CONFIGS.forEach(config => {
        setTimeout(() => syncEndpoint(config), Math.random() * 5000); // Stagger requests
      });
    }
  }, [syncEndpoint]);

  // WebSocket-like real-time sync for critical updates
  const setupRealtimeSync = useCallback(() => {
    // Simulate real-time updates using polling for active timers
    const checkActiveTimers = async () => {
      try {
        const timeEntries = queryClient.getQueryData(['/api/time-entries']) as any[];
        const hasActiveTimer = timeEntries?.some(entry => entry.isActive);
        
        if (hasActiveTimer) {
          // More frequent sync for active timers
          syncEndpoint(SYNC_CONFIGS[0]); // time-entries config
        }
      } catch (error) {
        // Silent handling
      }
    };

    const realtimeTimer = setInterval(checkActiveTimers, 10000); // Check every 10 seconds
    return realtimeTimer;
  }, [queryClient, syncEndpoint]);

  useEffect(() => {
    // Initial setup
    setupSyncTimers();
    const realtimeTimer = setupRealtimeSync();

    // Event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('online', handleNetworkChange);
    window.addEventListener('offline', handleNetworkChange);

    // Initial sync after 2 seconds
    const initialSyncTimer = setTimeout(() => {
      SYNC_CONFIGS.forEach(config => {
        setTimeout(() => syncEndpoint(config), config.priority === 'high' ? 0 : Math.random() * 3000);
      });
    }, 2000);

    return () => {
      // Cleanup all timers
      syncTimersRef.current.forEach(timer => clearInterval(timer));
      syncTimersRef.current.clear();
      
      clearInterval(realtimeTimer);
      clearTimeout(initialSyncTimer);

      // Remove event listeners
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleNetworkChange);
      window.removeEventListener('offline', handleNetworkChange);
    };
  }, [setupSyncTimers, setupRealtimeSync, handleVisibilityChange, handleNetworkChange, syncEndpoint]);

  // Return minimal status for debugging
  return {
    isActive: syncTimersRef.current.size > 0,
    lastSyncTimes: Object.fromEntries(lastSyncRef.current)
  };
}