import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useSimpleAuth } from '@/hooks/use-simple-auth';
import { Users, Building, LogIn, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function SimpleLogin() {
  const [email, setEmail] = useState('');
  const [userType, setUserType] = useState<'employee' | 'client'>('employee');
  const [isLoading, setIsLoading] = useState(false);
  const { login, user, isEmployee, isClient } = useSimpleAuth();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast({
        title: "שגיאה",
        description: "אנא הזן כתובת אימייל",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await login(email, userType);
      toast({
        title: "התחברות מוצלחת",
        description: `ברוך הבא למערכת, ${email.split('@')[0]}`,
      });
    } catch (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: error instanceof Error ? error.message : "אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isEmployee ? (
              <Building className="w-12 h-12 text-blue-500" />
            ) : (
              <Users className="w-12 h-12 text-green-500" />
            )}
          </div>
          <CardTitle className="text-xl">
            שלום {user.name}
          </CardTitle>
          <CardDescription className="flex items-center justify-center gap-2">
            <Mail className="w-4 h-4" />
            {user.email}
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <Badge 
            variant={isEmployee ? "default" : "secondary"}
            className="mb-4"
          >
            {isEmployee ? "עובד חברה" : "לקוח"}
          </Badge>
          <p className="text-sm text-gray-600">
            {isEmployee 
              ? "יש לך גישה מלאה למערכת ניהול הלקוחות"
              : "יש לך גישה לפרטים האישיים שלך ולמסמכים הרלוונטיים"
            }
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          <LogIn className="w-12 h-12 text-blue-500" />
        </div>
        <CardTitle className="text-2xl font-bold">
          התחברות למערכת
        </CardTitle>
        <CardDescription>
          בחר סוג משתמש והזן אימייל
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                type="button"
                variant={userType === 'employee' ? 'default' : 'outline'}
                onClick={() => setUserType('employee')}
                className="flex-1"
              >
                <Building className="w-4 h-4 mr-2" />
                עובד
              </Button>
              <Button
                type="button"
                variant={userType === 'client' ? 'default' : 'outline'}
                onClick={() => setUserType('client')}
                className="flex-1"
              >
                <Users className="w-4 h-4 mr-2" />
                לקוח
              </Button>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">כתובת אימייל</Label>
              <Input
                id="email"
                type="email"
                placeholder="example@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                dir="ltr"
              />
            </div>
          </div>
          
          <Button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-blue-600 hover:bg-blue-700"
            size="lg"
          >
            {isLoading ? "מתחבר..." : "התחבר למערכת"}
          </Button>
        </form>
        
        <div className="text-xs text-gray-500 text-center space-y-1">
          <p>דוגמאות:</p>
          <p>עובד: employee@company.com</p>
          <p>לקוח: client@gmail.com</p>
        </div>
      </CardContent>
    </Card>
  );
}