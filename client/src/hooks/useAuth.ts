
import { useState, useEffect } from "react";
import { User } from "@shared/schema";

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is stored in localStorage
    const storedUser = localStorage.getItem("currentUser");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        // ודא שהמשתמש תקין עם userId חדש
        if (userData && userData.id && userData.email) {
          setUser(userData);
        } else {
          // נקה נתונים פגומים
          localStorage.removeItem("currentUser");
        }
      } catch (error) {
        // נקה נתונים פגומים
        localStorage.removeItem("currentUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (userEmail: string, role?: string) => {
    // יצירת userId קבוע על בסיס אימייל בלבד (ללא timestamp)
    const uniqueUserId = btoa(userEmail).replace(/[^a-zA-Z0-9]/g, '').substring(0, 20);
    
    const userData: User = {
      id: uniqueUserId,
      username: userEmail.split('@')[0],
      email: userEmail,
      fullName: userEmail.split('@')[0],
      role: role || "employee",
      password: "",
      notes: null,
      createdAt: new Date(),
    };
    
    console.log('✅ התחברות מוצלחת:', userData);
    setUser(userData);
    localStorage.setItem("currentUser", JSON.stringify(userData));
    
    // אין צורך ברענון - המצב מתעדכן אוטומטית
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  // Check if current user is admin
  const isAdmin = () => {
    return user?.role === 'admin' || user?.username === 'admin' || user?.email?.includes('admin');
  };

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    isAdmin: isAdmin(),
    login,
    logout,
  };
}
