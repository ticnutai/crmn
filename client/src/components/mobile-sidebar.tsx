import { useState } from "react";
import { Menu, X, Home, Users, BarChart3, Database, CreditCard, Download, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";

export default function MobileSidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const [location] = useLocation();
  const { user } = useAuth();

  const menuItems = [
    { path: "/", icon: Home, label: "דשבורד", color: "text-blue-600" },
    { path: "/clients", icon: Users, label: "לקוחות", color: "text-green-600" },
    { path: "/payment-stages", icon: CreditCard, label: "שלבי תשלום", color: "text-purple-600" },
    { path: "/reports", icon: BarChart3, label: "דוחות", color: "text-orange-600" },
    { path: "/backup", icon: Database, label: "גיבויים", color: "text-red-600" },
    { path: "/import-clients", icon: Download, label: "יבוא לקוחות", color: "text-indigo-600" },
    { path: "/export-data", icon: Download, label: "ייצוא נתונים", color: "text-teal-600" },
  ];

  if (user?.role === "admin") {
    menuItems.splice(4, 0, { path: "/users", icon: Settings, label: "משתמשים", color: "text-gray-600" });
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="fixed top-4 right-4 z-50 md:hidden bg-white shadow-lg border"
        >
          <Menu className="w-6 h-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-80 p-0">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-800">תפריט ראשי</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
          
          <nav className="flex-1 p-4">
            <ul className="space-y-2">
              {menuItems.map((item) => {
                const Icon = item.icon;
                const isActive = location === item.path;
                
                return (
                  <li key={item.path}>
                    <Link href={item.path}>
                      <Button
                        variant={isActive ? "default" : "ghost"}
                        className={`w-full justify-start gap-3 h-12 ${
                          isActive 
                            ? "bg-blue-600 text-white" 
                            : "hover:bg-gray-100"
                        }`}
                        onClick={() => setIsOpen(false)}
                      >
                        <Icon className={`w-5 h-5 ${isActive ? "text-white" : item.color}`} />
                        <span className="text-base">{item.label}</span>
                      </Button>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          
          <div className="p-4 border-t bg-gray-50">
            <div className="text-center text-sm text-gray-600">
              <p className="font-medium">מערכת ניהול לקוחות</p>
              <p>גרסה 1.0</p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}