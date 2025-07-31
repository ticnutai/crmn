import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Shield, Users, Eye, Edit, Trash2, Plus, Settings, Database, FileText, CreditCard, BarChart3, Upload, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Permission {
  id: string;
  name: string;
  description: string;
  icon: any;
  category: 'clients' | 'users' | 'reports' | 'system' | 'files';
}

interface Role {
  id: string;
  name: string;
  displayName: string;
  description: string;
  color: string;
  permissions: string[];
}

const PERMISSIONS: Permission[] = [
  // ניהול לקוחות - מה שעובד רגיל מותר לעשות עם לקוחות
  { id: 'clients.view', name: 'צפייה בלקוחות', description: 'לראות רשימת לקוחות - שמות, טלפונים, פרטי קשר (ללא עריכה)', icon: Eye, category: 'clients' },
  { id: 'clients.create', name: 'הוספת לקוחות', description: 'להוסיף לקוחות חדשים למערכת - למלא פרטים כמו שם, טלפון, מייל', icon: Plus, category: 'clients' },
  { id: 'clients.edit', name: 'עריכת לקוחות', description: 'לשנות פרטי לקוחות קיימים - עדכון טלפון, כתובת, הערות, מצב תשלום', icon: Edit, category: 'clients' },
  { id: 'clients.delete', name: 'מחיקת לקוחות', description: 'למחוק לקוחות לצמיתות מהמערכת (פעולה מסוכנת - רק למנהלים)', icon: Trash2, category: 'clients' },
  
  // ניהול עובדים - מי יכול לנהל את צוות העובדים
  { id: 'users.view', name: 'צפייה בעובדים', description: 'לראות רשימת עובדים במערכת - שמות, תפקידים, תאריכי הצטרפות', icon: Users, category: 'users' },
  { id: 'users.create', name: 'הוספת עובדים', description: 'להוסיף עובדים חדשים - יצירת משתמש וסיסמה, הגדרת תפקיד', icon: Plus, category: 'users' },
  { id: 'users.edit', name: 'עריכת עובדים', description: 'לשנות פרטי עובדים - שינוי תפקיד, סיסמה, הרשאות', icon: Edit, category: 'users' },
  { id: 'users.delete', name: 'מחיקת עובדים', description: 'למחוק עובדים מהמערכת (רק מנהל ראשי - פעולה מסוכנת)', icon: Trash2, category: 'users' },
  
  // דוחות ונתונים - איך לגשת למידע עסקי
  { id: 'reports.view', name: 'צפייה בדוחות', description: 'לראות דוחות עסקיים - הכנסות, לקוחות פעילים, שעות עבודה', icon: BarChart3, category: 'reports' },
  { id: 'reports.export', name: 'יצוא דוחות', description: 'להוריד דוחות כקבצי Excel או PDF לצורך הצגה ללקוחות או הנהלה', icon: Download, category: 'reports' },
  
  // ניהול קבצים - איך לעבוד עם מסמכים
  { id: 'files.view', name: 'צפייה בקבצים', description: 'לראות קבצי לקוחות - מסמכים, תמונות, חוזים (ללא הורדה)', icon: FileText, category: 'files' },
  { id: 'files.upload', name: 'העלאת קבצים', description: 'להעלות קבצים חדשים - מסמכים, תמונות, קבלות ללקוחות', icon: Upload, category: 'files' },
  { id: 'files.download', name: 'הורדת קבצים', description: 'להוריד קבצים למחשב - לשתף עם לקוחות או לעבודה חיצונית', icon: Download, category: 'files' },
  { id: 'files.delete', name: 'מחיקת קבצים', description: 'למחוק קבצים לצמיתות (פעולה מסוכנת - רק למנהלים)', icon: Trash2, category: 'files' },
  
  // ניהול מערכת - הגדרות מתקדמות
  { id: 'system.backup', name: 'ניהול גיבויים', description: 'ליצור ולשחזר גיבויים של כל המערכת - הגנה מפני אובדן מידע', icon: Database, category: 'system' },
  { id: 'system.settings', name: 'הגדרות מערכת', description: 'לשנות הגדרות כלליות - ערכות נושא, שפה, התראות, אבטחה', icon: Settings, category: 'system' },
  { id: 'system.payments', name: 'ניהול תשלומים', description: 'לנהל שלבי תשלום - ליצור חשבוניות, לעקוב אחר תשלומים, לעדכן סטטוס', icon: CreditCard, category: 'system' },
];

const DEFAULT_ROLES: Role[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'מנהל מערכת',
    description: 'בעל החברה או מנהל ראשי - יכול לעשות הכל במערכת',
    color: 'bg-red-100 text-red-800',
    permissions: PERMISSIONS.map(p => p.id), // All permissions
  },
  {
    id: 'manager',
    name: 'manager', 
    displayName: 'מנהל צוות',
    description: 'מנהל משמרת או מחלקה - יכול לנהל לקוחות ולראות דוחות, אבל לא למחוק',
    color: 'bg-blue-100 text-blue-800',
    permissions: [
      'clients.view', 'clients.create', 'clients.edit',
      'users.view',
      'reports.view', 'reports.export',
      'files.view', 'files.upload', 'files.download',
      'system.payments'
    ],
  },
  {
    id: 'user',
    name: 'user',
    displayName: 'עובד רגיל',
    description: 'עובד בסיסי - יכול לראות לקוחות ולעבוד עם קבצים, אבל לא לשנות דברים חשובים',
    color: 'bg-gray-100 text-gray-800',
    permissions: [
      'clients.view',
      'files.view', 'files.download',
      'reports.view'
    ],
  },
];

export default function RolePermissionsManager() {
  const [roles, setRoles] = useState<Role[]>(DEFAULT_ROLES);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const { toast } = useToast();

  const togglePermission = (roleId: string, permissionId: string) => {
    setRoles(roles.map(role => {
      if (role.id === roleId) {
        const hasPermission = role.permissions.includes(permissionId);
        return {
          ...role,
          permissions: hasPermission 
            ? role.permissions.filter(p => p !== permissionId)
            : [...role.permissions, permissionId]
        };
      }
      return role;
    }));
  };

  const savePermissions = () => {
    // Here you would save to the backend
    toast({
      title: "הרשאות נשמרו בהצלחה",
      description: "השינויים בהרשאות התפקידים נשמרו במערכת",
    });
  };

  const getPermissionsByCategory = (category: string) => {
    return PERMISSIONS.filter(p => p.category === category);
  };

  const categories = [
    { id: 'clients', name: 'ניהול לקוחות', icon: Users },
    { id: 'users', name: 'ניהול עובדים', icon: Shield },
    { id: 'files', name: 'ניהול קבצים', icon: FileText },
    { id: 'reports', name: 'דוחות ונתונים', icon: BarChart3 },
    { id: 'system', name: 'הגדרות מערכת', icon: Settings },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">ניהול הרשאות</h2>
          <p className="text-gray-600 mt-1">מה כל עובד מותר לעשות במערכת - לבחור תפקיד ולהגדיר הרשאות</p>
        </div>
        <Button onClick={savePermissions} className="bg-blue-600 hover:bg-blue-700">
          שמור שינויים
        </Button>
      </div>

      {/* Role Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {roles.map(role => (
          <Card 
            key={role.id} 
            className={`cursor-pointer transition-all hover:shadow-md ${
              selectedRole?.id === role.id ? 'ring-2 ring-blue-500 bg-blue-50' : ''
            }`}
            onClick={() => setSelectedRole(role)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{role.displayName}</CardTitle>
                <Badge className={role.color}>
                  {role.permissions.length} הרשאות
                </Badge>
              </div>
              <p className="text-sm text-gray-600">{role.description}</p>
            </CardHeader>
          </Card>
        ))}
      </div>

      {/* Permissions Matrix */}
      {selectedRole && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              הרשאות עבור {selectedRole.displayName}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {categories.map(category => {
                const categoryPermissions = getPermissionsByCategory(category.id);
                const Icon = category.icon;
                
                return (
                  <div key={category.id} className="border rounded-lg p-4">
                    <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                      <Icon className="w-5 h-5" />
                      {category.name}
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {categoryPermissions.map(permission => {
                        const hasPermission = selectedRole.permissions.includes(permission.id);
                        const PermIcon = permission.icon;
                        
                        return (
                          <div key={permission.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <div className="flex items-center gap-3">
                              <PermIcon className="w-4 h-4 text-gray-600" />
                              <div>
                                <div className="font-medium text-sm">{permission.name}</div>
                                <div className="text-xs text-gray-500">{permission.description}</div>
                              </div>
                            </div>
                            <Switch
                              checked={hasPermission}
                              onCheckedChange={() => togglePermission(selectedRole.id, permission.id)}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}