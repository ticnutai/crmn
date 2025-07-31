import { ReactNode } from 'react';
import { useAuth } from '@/hooks/use-auth';
import LoginPage from '@/pages/login';

interface AuthGuardProps {
  children: ReactNode;
  requireEmployee?: boolean;
}

export default function AuthGuard({ children, requireEmployee = false }: AuthGuardProps) {
  const { user, loading, isEmployee } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">טוען...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  if (requireEmployee && !isEmployee) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h2 className="text-lg font-semibold text-yellow-800 mb-2">
              גישה מוגבלת
            </h2>
            <p className="text-yellow-700">
              עמוד זה מיועד לעובדי החברה בלבד. אם אתה עובד, אנא התחבר עם חשבון הרשמי של החברה.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}