import { useState, useEffect } from 'react';

declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export const useGoogleAuth = () => {
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [isLoaded, setIsLoaded] = useState(true); // Start as loaded to avoid auth errors
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    // Skip Google Auth initialization to avoid runtime errors
    // This is a placeholder implementation
    const timer = setTimeout(() => {
      setIsLoaded(true);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  const signIn = async () => {
    // Simulate sign in
    setIsSignedIn(true);
    setUser({ name: 'Demo User' });
  };

  const signOut = async () => {
    // Simulate sign out
    setIsSignedIn(false);
    setUser(null);
  };

  return {
    isSignedIn,
    isLoaded,
    user,
    signIn,
    signOut
  };
};