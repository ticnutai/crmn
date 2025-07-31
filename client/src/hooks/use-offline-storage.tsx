import { useCallback, useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

interface OfflineAction {
  id: string;
  type: 'CREATE' | 'UPDATE' | 'DELETE';
  endpoint: string;
  data: any;
  timestamp: number;
  retries: number;
}

export function useOfflineStorage() {
  const queryClient = useQueryClient();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [pendingActions, setPendingActions] = useState<OfflineAction[]>([]);

  // Load pending actions from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('offlineActions');
    if (stored) {
      try {
        setPendingActions(JSON.parse(stored));
      } catch (error) {
        localStorage.removeItem('offlineActions');
      }
    }
  }, []);

  // Save pending actions to localStorage
  const savePendingActions = useCallback((actions: OfflineAction[]) => {
    localStorage.setItem('offlineActions', JSON.stringify(actions));
    setPendingActions(actions);
  }, []);

  // Add action to offline queue
  const queueOfflineAction = useCallback((
    type: OfflineAction['type'],
    endpoint: string,
    data: any
  ) => {
    const action: OfflineAction = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retries: 0
    };

    const newActions = [...pendingActions, action];
    savePendingActions(newActions);
    
    return action.id;
  }, [pendingActions, savePendingActions]);

  // Process offline actions when online
  const processOfflineActions = useCallback(async () => {
    if (!isOnline || pendingActions.length === 0) return;

    const actionsToProcess = [...pendingActions];
    const failedActions: OfflineAction[] = [];

    for (const action of actionsToProcess) {
      try {
        let method: string;
        switch (action.type) {
          case 'CREATE':
            method = 'POST';
            break;
          case 'UPDATE':
            method = 'PUT';
            break;
          case 'DELETE':
            method = 'DELETE';
            break;
          default:
            continue;
        }

        const response = await fetch(action.endpoint, {
          method,
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${JSON.parse(localStorage.getItem('currentUser') || '{}').id}`,
          },
          body: action.data ? JSON.stringify(action.data) : undefined,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        // Action succeeded, remove from queue
        
        
      } catch (error) {
        // Action failed, increment retry count
        action.retries += 1;
        
        // Keep retrying up to 3 times
        if (action.retries < 3) {
          failedActions.push(action);
        } else {
          
        }
      }
    }

    // Update pending actions with only failed ones
    savePendingActions(failedActions);
    
    // Refresh data after processing
    if (failedActions.length < actionsToProcess.length) {
      queryClient.invalidateQueries();
    }
  }, [isOnline, pendingActions, savePendingActions, queryClient]);

  // Handle online/offline events
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
    };

    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Process actions when coming online
  useEffect(() => {
    if (isOnline) {
      processOfflineActions();
    }
  }, [isOnline, processOfflineActions]);

  return {
    isOnline,
    pendingActions: pendingActions.length,
    queueOfflineAction
  };
}