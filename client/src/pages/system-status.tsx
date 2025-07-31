import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Activity, 
  Server, 
  Database, 
  Users, 
  Clock, 
  MemoryStick,
  Cpu,
  RefreshCw,
  TrendingUp,
  AlertCircle
} from "lucide-react";
import SystemStatusIndicator from "@/components/system-status-indicator";

export default function SystemStatusPage() {
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds

  const { data: systemOverview, refetch: refetchOverview } = useQuery<any>({
    queryKey: ["/api/system/overview"],
    refetchInterval: refreshInterval,
  });

  const formatUptime = (seconds: number) => {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (days > 0) {
      return `${days} ימים, ${hours} שעות`;
    } else if (hours > 0) {
      return `${hours} שעות, ${minutes} דקות`;
    } else {
      return `${minutes} דקות`;
    }
  };

  const formatMemory = (bytes: number) => {
    const mb = bytes / 1024 / 1024;
    return `${mb.toFixed(1)} MB`;
  };

  const getMemoryUsagePercentage = () => {
    if (!systemOverview?.memoryUsage) return 0;
    const { used, total } = systemOverview.memoryUsage;
    return (used / total) * 100;
  };

  return (
    <div className="p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">מצב המערכת</h1>
          <p className="text-gray-600 mt-2">ניטור ובקרת תקינות הרכיבים</p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => refetchOverview()}
          >
            <RefreshCw className="w-4 h-4 ml-2" />
            רענן נתונים
          </Button>
          <select
            value={refreshInterval}
            onChange={(e) => setRefreshInterval(Number(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm"
          >
            <option value={5000}>כל 5 שניות</option>
            <option value={15000}>כל 15 שניות</option>
            <option value={30000}>כל 30 שניות</option>
            <option value={60000}>כל דקה</option>
            <option value={0}>ללא רענון</option>
          </select>
        </div>
      </div>

      {/* Main System Status Indicator */}
      <SystemStatusIndicator />

      {/* System Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">זמן פעילות</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemOverview?.systemUptime ? formatUptime(systemOverview.systemUptime) : "טוען..."}
            </div>
            <p className="text-xs text-muted-foreground">
              מאז הפעלה אחרונה
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">משתמשים במערכת</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemOverview?.totalUsers || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              משתמשים רשומים
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">לקוחות פעילים</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemOverview?.totalClients || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              סך הכל לקוחות
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">רשומות זמן</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {systemOverview?.totalTimeEntries || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              סך רשומות הזמן
            </p>
          </CardContent>
        </Card>
      </div>

      {/* System Resources */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MemoryStick className="w-5 h-5" />
              שימוש בזיכרון
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemOverview?.memoryUsage && (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>זיכרון בשימוש</span>
                    <span>{formatMemory(systemOverview.memoryUsage.used)}</span>
                  </div>
                  <Progress 
                    value={getMemoryUsagePercentage()} 
                    className="h-2"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">RSS:</span>
                    <div className="font-mono">{formatMemory(systemOverview.memoryUsage.rss)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">External:</span>
                    <div className="font-mono">{formatMemory(systemOverview.memoryUsage.external)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Heap Used:</span>
                    <div className="font-mono">{formatMemory(systemOverview.memoryUsage.heapUsed)}</div>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Heap Total:</span>
                    <div className="font-mono">{formatMemory(systemOverview.memoryUsage.heapTotal)}</div>
                  </div>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              פרטי השרת
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-muted-foreground">גרסת Node.js:</span>
                <span className="font-mono">{systemOverview?.nodeVersion || "לא זמין"}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">עדכון אחרון:</span>
                <span className="text-sm">
                  {systemOverview?.timestamp 
                    ? new Date(systemOverview.timestamp).toLocaleString('he-IL')
                    : "טוען..."
                  }
                </span>
              </div>

              <div className="flex justify-between">
                <span className="text-muted-foreground">סטטוס שרת:</span>
                <Badge className="bg-green-100 text-green-800">
                  פעיל
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* System Alerts */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5" />
            התראות מערכת
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-4 h-4 text-yellow-600" />
              <div>
                <p className="text-sm font-medium">גיבוי נדרש</p>
                <p className="text-xs text-muted-foreground">
                  לא בוצע גיבוי מערכת ב-24 השעות האחרונות
                </p>
              </div>
            </div>
            
            <div className="text-center text-sm text-muted-foreground py-4">
              אין התראות נוספות כרגע
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}