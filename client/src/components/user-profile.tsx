import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/use-auth';
import { signOutUser } from '@/lib/firebase';
import { LogOut, User, Building, Users, Mail, Phone } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function UserProfile() {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const { user, isEmployee, isClient } = useAuth();
  const { toast } = useToast();

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOutUser();
      toast({
        title: "התנתקת בהצלחה",
        description: "להתראות!",
      });
    } catch (error) {
      toast({
        title: "שגיאה בהתנתקות",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  if (!user) return null;

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <div className="flex justify-center mb-4">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "משתמש"}
              className="w-16 h-16 rounded-full border-2 border-blue-200"
            />
          ) : (
            <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
          )}
        </div>
        <CardTitle className="text-xl">
          {user.displayName || "משתמש"}
        </CardTitle>
        <div className="flex justify-center">
          <Badge 
            variant={isEmployee ? "default" : "secondary"}
            className="flex items-center gap-1"
          >
            {isEmployee ? (
              <>
                <Building className="w-3 h-3" />
                עובד חברה
              </>
            ) : (
              <>
                <Users className="w-3 h-3" />
                לקוח
              </>
            )}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        <div className="space-y-3">
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            <Mail className="w-4 h-4 text-gray-600" />
            <div className="text-sm">
              <div className="font-medium">אימייל</div>
              <div className="text-gray-600">{user.email}</div>
            </div>
          </div>
          
          {isEmployee && (
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Building className="w-4 h-4 text-blue-600" />
              <div className="text-sm">
                <div className="font-medium text-blue-800">הרשאות עובד</div>
                <div className="text-blue-600">גישה מלאה לכל המערכת</div>
              </div>
            </div>
          )}
          
          {isClient && (
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Users className="w-4 h-4 text-green-600" />
              <div className="text-sm">
                <div className="font-medium text-green-800">לקוח רשום</div>
                <div className="text-green-600">גישה לפרטים אישיים ומסמכים</div>
              </div>
            </div>
          )}
        </div>
        
        <Button 
          onClick={handleSignOut}
          disabled={isSigningOut}
          variant="outline"
          className="w-full"
        >
          <LogOut className="w-4 h-4 mr-2" />
          {isSigningOut ? "מתנתק..." : "התנתק"}
        </Button>
      </CardContent>
    </Card>
  );
}