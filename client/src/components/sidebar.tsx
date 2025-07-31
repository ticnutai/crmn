import { Link, useLocation } from "wouter";
import { Users, LayoutDashboard, UserCheck, BarChart3, Database, FileText, CreditCard, Upload, Download, FolderOpen, User, LogOut, Calculator, Bell, MessageCircle, Settings, Monitor, Activity } from "lucide-react";
import { useSimpleAuth } from "@/hooks/use-simple-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

const navigation = [
  { name: "לוח הבקרה", href: "/", icon: LayoutDashboard },
  { name: "לקוחות", href: "/clients", icon: Users },
  { name: "קבצי לקוח", href: "/client-files", icon: FolderOpen },
  { name: "יבוא לקוחות", href: "/import-clients", icon: Upload },
  { name: "יצוא נתונים", href: "/export-data", icon: Download },
  { name: "משתמשים", href: "/users", icon: UserCheck },
  { name: "שלבי תשלום", href: "/payment-stages", icon: CreditCard },
  { name: "דוחות", href: "/reports", icon: BarChart3 },
  { name: "גיבוי אוטומטי", href: "/backup", icon: Database },
  { name: "חשבוניות", href: "/invoices", icon: FileText },
  { name: "דוחות כספיים", href: "/financial-reports", icon: Calculator },
  { name: "מצב המערכת", href: "/system-status", icon: Activity },
];

function UserProfileMenu() {
  const { user, isEmployee, logout } = useSimpleAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "התנתקת בהצלחה",
      description: "להתראות!",
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
        <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
          <User className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex-1">
          <div className="text-sm font-medium text-gray-900">{user.name}</div>
          <div className="text-xs text-gray-500">{user.email}</div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Badge 
          variant={isEmployee ? "default" : "secondary"}
          className="text-xs"
        >
          {isEmployee ? "עובד חברה" : "לקוח"}
        </Badge>

        <Button 
          size="sm" 
          variant="ghost" 
          onClick={handleLogout}
          className="text-gray-500 hover:text-red-600"
        >
          <LogOut className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user, isEmployee } = useSimpleAuth();

  return (
    <aside className="w-64 bg-white shadow-lg border-l border-gray-200 flex flex-col">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Users className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">ניהול לקוחות</h1>
            <p className="text-sm text-gray-500">מערכת CRM מתקדמת</p>
          </div>
        </div>
      </div>
      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          {navigation.map((item) => {
            // Users page is accessible to all authenticated users
            if (item.href === "/import-clients" && !isEmployee) return null;
            if (item.href === "/export-data" && !isEmployee) return null;
            if (item.href === "/backup" && !isEmployee) return null;
            // מצב המערכת זמין לכל המשתמשים לצפייה
            // if (item.href === "/system-status" && !isEmployee) return null;

            const isActive = location === item.href;
            const Icon = item.icon;

            return (
              <li key={item.name}>
                <Link href={item.href}>
                  <div
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                      isActive
                        ? "text-blue-600 bg-blue-50 border-r-4 border-blue-500 font-medium"
                        : "text-gray-700 hover:bg-gray-50"
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </div>
                </Link>
              </li>
            );
          })}

          {/* רובריקה נפרדת לתקשורת */}
          <li className="mt-6">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              תקשורת
            </div>
          </li>

          {/* התראות */}
          

          {/* צ'אט */}
          <li>
            <Link href="/chat">
              <div
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                  location === "/chat"
                    ? "text-blue-600 bg-blue-50 border-r-4 border-blue-500 font-medium"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <MessageCircle className="w-5 h-5" />
                <span>צ'אט</span>
              </div>
            </Link>
          </li>

          {/* רובריקה נפרדת למערכת */}
          <li className="mt-6">
            <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase tracking-wider border-b border-gray-200">
              מערכת
            </div>
          </li>

          {/* אבחון מערכת */}
          {isEmployee && (
            <li>
              <Link href="/system-diagnostics">
                <div
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer ${
                    location === "/system-diagnostics"
                      ? "text-blue-600 bg-blue-50 border-r-4 border-blue-500 font-medium"
                      : "text-gray-700 hover:bg-gray-50"
                  }`}
                >
                  <Monitor className="w-5 h-5" />
                  <span>אבחון מערכת</span>
                </div>
              </Link>
            </li>
          )}
        </ul>
      </nav>
      {/* User Profile */}
      <div className="p-4 border-t border-gray-200">
        <UserProfileMenu />
      </div>
    </aside>
  );
}