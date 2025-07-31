import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { LogIn, Eye, EyeOff } from "lucide-react";

interface LoginData {
  email: string;
  password: string;
}

export default function EmailPasswordLogin() {
  const [loginData, setLoginData] = useState<LoginData>({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("התחברות נכשלה");
      }

      const userData = await response.json();
      localStorage.setItem('currentUser', JSON.stringify(userData));
      
      // רענון הדף כדי לטעון את המערכת עם המשתמש המחובר
      window.location.reload();
    } catch (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: "אימייל או סיסמה לא נכונים",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto shadow-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-right">התחברות למערכת</CardTitle>
        <CardDescription className="text-right">
          הזן אימייל וסיסמה כדי להיכנס למערכת
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <Label htmlFor="email" className="text-right block mb-2">אימייל</Label>
            <Input
              id="email"
              type="email"
              value={loginData.email}
              onChange={(e) => setLoginData({ ...loginData, email: e.target.value })}
              placeholder="your@email.com"
              required
              className="text-right"
            />
          </div>
          
          <div>
            <Label htmlFor="password" className="text-right block mb-2">סיסמה</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={loginData.password}
                onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                placeholder="הזן סיסמה"
                required
                className="text-right pr-12"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute left-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full bg-blue-600 hover:bg-blue-700"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white ml-2"></div>
                מתחבר...
              </div>
            ) : (
              <div className="flex items-center justify-center">
                <LogIn className="w-4 h-4 ml-2" />
                התחבר
              </div>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}