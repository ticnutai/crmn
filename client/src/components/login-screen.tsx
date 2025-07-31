import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Lock } from "lucide-react";

interface LoginScreenProps {
  onLogin: (userId: string, role: string) => void;
}

export function LoginScreen({ onLogin }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // נקה רווחים מיותרים מהנתונים
      const cleanUsername = username.trim();
      const cleanPassword = password.trim();

      if (!cleanUsername || !cleanPassword) {
        throw new Error('נא למלא שם משתמש וסיסמה');
      }

      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: cleanUsername,
          password: cleanPassword,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'שגיאה בהתחברות');
      }

      const userData = await response.json();
      onLogin(userData.id, userData.role);
    } catch (error) {
      
      setError(error instanceof Error ? error.message : 'שגיאה בהתחברות');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl font-bold">התחברות למערכת</CardTitle>
        <CardDescription>
          הכנס את פרטי ההתחברות שלך
          <br />
          <small className="text-xs text-muted-foreground mt-2 block">
            לבדיקה: admin / admin123 או testuser / test123
          </small>
        </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
           {error && (
              <div className="p-2 bg-red-100 text-red-600 rounded-md text-sm" role="alert">
                {error}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="username">שם משתמש</Label>
              <div className="relative">
                <User className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">סיסמה</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                  required
                />
              </div>
            </div>
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading}
            >
              {isLoading ? "מתחבר..." : "התחבר"}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-gray-50 rounded-lg text-sm">
            <p className="font-semibold mb-2">משתמשים זמינים:</p>
            <div className="space-y-1">
              <p><strong>מנהל:</strong> admin / admin123</p>
              <p><strong>עובד:</strong> employee / emp123</p>
              <p><strong>מנהל צוות:</strong> manager / manager123</p>
              <p><strong>משתמש בדיקה:</strong> testuser / test123</p>
            </div>
            <p className="text-xs text-gray-600 mt-2">
              ניתן להשתמש בשם המשתמש או באימייל מלא
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}