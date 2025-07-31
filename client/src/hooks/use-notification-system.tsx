import React, { createContext, useContext, ReactNode } from 'react';

interface NotificationContextType {
  showNotification: (notification: any) => void;
  showAlert: (title: string, message: string, type?: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotificationSystem = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    // החזרת פונקציות ריקות במקום שגיאה
    return {
      showNotification: () => {},
      showAlert: () => {}
    };
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({ children }: NotificationProviderProps) => {
  const value = {
    showNotification: () => {},
    showAlert: () => {}
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};