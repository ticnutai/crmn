import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Mail } from "lucide-react";

export default function QuickLogin() {
  const [email, setEmail] = useState("");
  const { login } = useSimpleAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email.trim()) {
      try {
        // קביעת סוג המשתמש לפי הדומיין
        const userType = email.includes('@company.com') ? 'employee' : 'client';
        await login(email, userType);
        // נקה את השדה אחרי התחברות מוצלחת
        setEmail("");
        alert(`התחברות מוצלחת! ברוך הבא ${email.split('@')[0]}`);
        // רענון אוטומטי של הדף
        setTimeout(() => {
          window.location.reload();
        }, 1000);
      } catch (error) {
        console.error('Login failed:', error);
        alert(`התחברות נכשלה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
      }
    }
  };

  // Quick login function
  const handleQuickLogin = async (email: string, userType: string) => {
    try {
      // Set the email in the input field
      setEmail(email);
      
      // Perform the login
      await login(email, userType);
      
      // Clear the input after successful login
      setEmail("");
      
      // Show success message
      alert(`התחברות מוצלחת! ברוך הבא ${email.split('@')[0]}`);
      
      // רענון אוטומטי של הדף
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } catch (error) {
      console.error('Quick login failed:', error);
      alert(`התחברות נכשלה: ${error instanceof Error ? error.message : 'שגיאה לא ידועה'}`);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100" dir="rtl">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center space-y-2">
          <CardTitle className="text-2xl font-bold text-gray-900">
            מערכת ניהול לקוחות
          </CardTitle>
          <p className="text-gray-600 text-sm">
            הזן אימייל כדי להיכנס למערכת
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <div className="relative">
                <Mail className="absolute right-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  type="email"
                  placeholder="your.email@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pr-10 text-left"
                  required
                  dir="ltr"
                />
              </div>
            </div>
            <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700">
              התחבר למערכת
            </Button>
          </form>
          <div className="mt-4 text-center text-xs text-gray-500">
            <p>לבדיקה השתמש באימיילים שונים:</p>
            <p>admin@company.com, user1@company.com, user2@company.com</p>
            <p className="mt-2 text-green-600 font-semibold">הסיסמה לכל המשתמשים: admin123</p>
            <p className="mt-1 text-red-500">כדי להפריד בין משתמשים השתמש באימיילים שונים בכל דפדפן</p>
          </div>

          {/* Quick login buttons */}
          <div className="mt-4 space-y-2">
            <Button
              onClick={() => handleQuickLogin('admin@example.com', 'employee')}
              className="w-full bg-green-600 hover:bg-green-700 text-white"
              type="button"
            >
              👨‍💼 מנהל מערכת (admin@example.com)
            </Button>
            <Button
              onClick={() => handleQuickLogin('admin@company.com', 'employee')}
              className="w-full bg-purple-600 hover:bg-purple-700 text-white"
              type="button"
            >
              👔 מנהל חברה (admin@company.com)
            </Button>
            <Button
              onClick={() => handleQuickLogin('user1@company.com', 'employee')}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              type="button"
            >
              👩‍💼 עובד 1 (user1@company.com)
            </Button>
            <Button
              onClick={() => handleQuickLogin('user2@company.com', 'employee')}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white"
              type="button"
            >
              👨‍💼 עובד 2 (user2@company.com)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}