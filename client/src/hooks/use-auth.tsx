import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from 'firebase/auth';
import { auth, getCurrentUser } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  isEmployee: boolean;
  isClient: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Check if user is employee based on email domain
  const isEmployee = user?.email?.endsWith('@company.com') || user?.email?.endsWith('@office.com') || false;
  
  // Check if user is client (not employee)
  const isClient = user !== null && !isEmployee;

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    isEmployee,
    isClient,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};