import { Bell, BellRing, Clock, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

export default function NotificationsPage() {
  const notifications = [
    {
      id: 1,
      title: "חשבונית חדשה נוצרה",
      message: "חשבונית מס' 1001 נוצרה עבור לקוח יוסי כהן",
      type: "invoice",
      urgent: false,
      read: false,
      timestamp: new Date(Date.now() - 30 * 60 * 1000), // 30 minutes ago
    },
    {
      id: 2,
      title: "תזכורת תשלום",
      message: "חשבונית מס' 995 בסכום 2,500 ₪ ממתינה לתשלום כבר 7 ימים",
      type: "payment",
      urgent: true,
      read: false,
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
    },
    {
      id: 3,
      title: "גיבוי הושלם",
      message: "גיבוי אוטומטי של המערכת הושלם בהצלחה",
      type: "system",
      urgent: false,
      read: true,
      timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000), // 1 day ago
    },
    {
      id: 4,
      title: "לקוח חדש נוסף",
      message: "נוסף לקוח חדש: שרה לוי, חברת טכנולוגיות מתקדמות",
      type: "client",
      urgent: false,
      read: true,
      timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
    },
  ];

  const formatTimestamp = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    if (minutes < 60) {
      return `לפני ${minutes} דקות`;
    } else if (hours < 24) {
      return `לפני ${hours} שעות`;
    } else {
      return `לפני ${days} ימים`;
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">📄</div>;
      case "payment":
        return <div className="w-8 h-8 bg-yellow-100 rounded-full flex items-center justify-center">💰</div>;
      case "system":
        return <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">⚙️</div>;
      case "client":
        return <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">👤</div>;
      default:
        return <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">📝</div>;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const urgentCount = notifications.filter(n => n.urgent && !n.read).length;

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Bell className="w-6 h-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">התראות מערכת</h1>
          {unreadCount > 0 && (
            <Badge variant="destructive" className="h-6">
              {unreadCount} חדשות
            </Badge>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {unreadCount > 0 && (
            <Button variant="outline" size="sm">
              סמן הכל כנקרא
            </Button>
          )}
          <Button variant="outline" size="sm">
            הגדרות התראות
          </Button>
        </div>
      </div>

      {urgentCount > 0 && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <div className="flex items-center gap-2">
            <BellRing className="w-5 h-5 text-red-600" />
            <span className="font-medium text-red-800">
              יש לך {urgentCount} התראות דחופות הדורשות תשומת לב מיידית
            </span>
          </div>
        </Card>
      )}

      <div className="space-y-4">
        {notifications.length === 0 ? (
          <Card className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">אין התראות</h3>
            <p className="text-gray-500">כל ההתראות שלך נקראו</p>
          </Card>
        ) : (
          notifications.map((notification) => (
            <Card 
              key={notification.id} 
              className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                !notification.read 
                  ? 'border-blue-200 bg-blue-50' 
                  : 'border-gray-200 bg-white'
              } ${notification.urgent && !notification.read ? 'border-red-300 bg-red-50' : ''}`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start gap-4 flex-1">
                  {getNotificationIcon(notification.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-medium text-gray-900 truncate">
                        {notification.title}
                      </h3>
                      {notification.urgent && !notification.read && (
                        <Badge variant="destructive" className="text-xs">
                          דחוף
                        </Badge>
                      )}
                      {!notification.read && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-gray-600 mb-3 leading-relaxed">
                      {notification.message}
                    </p>
                    <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Clock className="w-4 h-4" />
                      {formatTimestamp(notification.timestamp)}
                    </div>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="h-8 w-8 p-0 opacity-50 hover:opacity-100 hover:bg-red-100"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}