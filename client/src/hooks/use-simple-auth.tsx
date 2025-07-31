import { createContext, useContext, useEffect, useState, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  type: 'employee' | 'client';
  role?: string; // הוספת תפקיד
  avatar?: string;
}

interface SimpleAuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmployee: boolean;
  isClient: boolean;
  login: (email: string, userType: 'employee' | 'client') => Promise<void>;
  logout: () => void;
}

const SimpleAuthContext = createContext<SimpleAuthContextType | undefined>(undefined);

export const useSimpleAuth = () => {
  const context = useContext(SimpleAuthContext);
  if (context === undefined) {
    throw new Error('useSimpleAuth must be used within a SimpleAuthProvider');
  }
  return context;
};

interface SimpleAuthProviderProps {
  children: ReactNode;
}

export const SimpleAuthProvider = ({ children }: SimpleAuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored user in localStorage
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, userType: 'employee' | 'client') => {
    // התחברות פשוטה לפי אימייל - ללא צורך בסיסמה
    try {
      // קביעת סיסמה דיפולטיבית לפי סוג המשתמש
      const defaultPassword = email.includes('@company.com') ? 'admin123' : 'user123';

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          email, 
          password: defaultPassword,
          userType 
        }),
      });

      if (!response.ok) {
        // אם נכשל עם הסיסמה הדיפולטיבית, ננסה עם הסיסמה הרגילה
        const fallbackResponse = await fetch('/api/auth/login', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            email, 
            password: 'admin123',
            userType 
          }),
        });

        if (!fallbackResponse.ok) {
          throw new Error('התחברות נכשלה - משתמש לא נמצא');
        }

        const userData = await fallbackResponse.json();
        const newUser: User = {
          id: userData.id,
          name: userData.fullName || userData.username,
          email: userData.email,
          type: userType,
          role: userData.role,
        };

        setUser(newUser);
        localStorage.setItem('currentUser', JSON.stringify(newUser));
        return;
      }

      const userData = await response.json();
      const newUser: User = {
        id: userData.id,
        name: userData.fullName || userData.username,
        email: userData.email,
        type: userType,
        role: userData.role,
      };

      setUser(newUser);
      localStorage.setItem('currentUser', JSON.stringify(newUser));
      
      // כפה רענון של הקומפוננטה
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 100);
    } catch (error) {
      throw new Error('התחברות נכשלה - אנא בדוק את פרטי ההתחברות');
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
  };

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isEmployee: user?.type === 'employee',
    isClient: user?.type === 'client',
    login,
    logout,
  };

  return <SimpleAuthContext.Provider value={value}>{children}</SimpleAuthContext.Provider>;
};