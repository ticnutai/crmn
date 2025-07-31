import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { signInWithGoogle } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import { Users, Building, LogIn, Mail } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function GoogleAuthLogin() {
  const [isLoading, setIsLoading] = useState(false);
  const { user, isEmployee, isClient } = useAuth();
  const { toast } = useToast();

  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    try {
      await signInWithGoogle();
      toast({
        title: "התחברות מוצלחת",
        description: "ברוך הבא למערכת ניהול הלקוחות",
      });
    } catch (error) {
      toast({
        title: "שגיאה בהתחברות",
        description: "אנא נסה שוב מאוחר יותר",
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
            שלום {user.displayName}
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
          התחבר באמצעות חשבון Google שלך
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
            <Building className="w-5 h-5 text-blue-600" />
            <div className="text-sm">
              <div className="font-medium text-blue-800">עובדי החברה</div>
              <div className="text-blue-600">גישה מלאה לכל המערכת</div>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
            <Users className="w-5 h-5 text-green-600" />
            <div className="text-sm">
              <div className="font-medium text-green-800">לקוחות</div>
              <div className="text-green-600">גישה לפרטים אישיים ומסמכים</div>
            </div>
          </div>
        </div>
        
        <Button 
          onClick={handleGoogleSignIn} 
          disabled={isLoading}
          className="w-full bg-blue-600 hover:bg-blue-700"
          size="lg"
        >
          {isLoading ? "מתחבר..." : "התחבר עם Google"}
        </Button>
        
        <p className="text-xs text-gray-500 text-center">
          בהתחברות אתה מסכים לתנאי השימוש ומדיניות הפרטיות
        </p>
      </CardContent>
    </Card>
  );
}