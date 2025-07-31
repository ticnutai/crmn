import { useState, useEffect } from 'react';

export interface NotificationPermissions {
  permission: NotificationPermission;
  isSupported: boolean;
  requestPermission: () => Promise<NotificationPermission>;
  hasPermission: boolean;
}

export function useNotificationPermissions(): NotificationPermissions {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [isSupported] = useState(() => 'Notification' in window);

  useEffect(() => {
    if (isSupported) {
      setPermission(Notification.permission);
    }
  }, [isSupported]);

  const requestPermission = async (): Promise<NotificationPermission> => {
    if (!isSupported) {
      return 'denied';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      return result;
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      return 'denied';
    }
  };

  return {
    permission,
    isSupported,
    requestPermission,
    hasPermission: permission === 'granted'
  };
}