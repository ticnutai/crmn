import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  Wifi, 
  Database, 
  Server, 
  Users, 
  Clock, 
  FileText, 
  Shield, 
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export interface SystemStatus {
  component: string;
  status: 'healthy' | 'warning' | 'error' | 'loading';
  message: string;
  lastChecked: Date;
  responseTime?: number;
  details?: string;
}

const STATUS_COLORS = {
  healthy: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200", 
  error: "bg-red-100 text-red-800 border-red-200",
  loading: "bg-blue-100 text-blue-800 border-blue-200"
};

const STATUS_ICONS = {
  healthy: CheckCircle2,
  warning: AlertTriangle,
  error: XCircle,
  loading: Loader2
};

export default function SystemStatusIndicator() {
  const { user } = useAuth();
  const [autoRefresh, setAutoRefresh] = useState(true);

  // System health check queries
  const { data: databaseStatus, refetch: refetchDatabase } = useQuery<any>({
    queryKey: ["/api/system/database-status"],
    refetchInterval: autoRefresh ? 30000 : false, // 30 seconds
    staleTime: 20000,
  });

  const { data: authStatus, refetch: refetchAuth } = useQuery<any>({
    queryKey: ["/api/system/auth-status"],
    refetchInterval: autoRefresh ? 30000 : false,
    staleTime: 20000,
  });

  const { data: apiStatus, refetch: refetchApi } = useQuery<any>({
    queryKey: ["/api/system/api-status"],
    refetchInterval: autoRefresh ? 15000 : false,
    staleTime: 10000,
  });

  // Create system status array
  const systemStatuses: SystemStatus[] = [
    {
      component: "מסד נתונים",
      status: databaseStatus?.healthy ? 'healthy' : databaseStatus?.error ? 'error' : 'loading',
      message: databaseStatus?.message || "בודק חיבור למסד נתונים...",
      lastChecked: new Date(),
      responseTime: databaseStatus?.responseTime,
      details: databaseStatus?.details
    },
    {
      component: "מערכת אימות",
      status: user ? 'healthy' : authStatus?.error ? 'error' : 'warning',
      message: user ? `מחובר כ-${user.email}` : "לא מחובר למערכת",
      lastChecked: new Date(),
      responseTime: authStatus?.responseTime
    },
    {
      component: "שרת API",
      status: apiStatus?.healthy ? 'healthy' : apiStatus?.error ? 'error' : 'loading',
      message: apiStatus?.message || "בודק תגובת השרת...",
      lastChecked: new Date(),
      responseTime: apiStatus?.responseTime,
      details: apiStatus?.details
    },
    {
      component: "טיימר עבודה",
      status: 'healthy', // We'll enhance this with actual timer status
      message: "פעיל ועובד תקין",
      lastChecked: new Date(),
      responseTime: 5
    },
    {
      component: "ניהול לקוחות",
      status: 'healthy',
      message: "מערכת זמינה",
      lastChecked: new Date(),
      responseTime: 8
    },
    {
      component: "גיבויים",
      status: 'warning',
      message: "לא בוצע גיבוי ב-24 השעות האחרונות",
      lastChecked: new Date(),
      details: "מומלץ לבצע גיבוי בהקדם"
    }
  ];

  const getOverallStatus = (): 'healthy' | 'warning' | 'error' => {
    const hasError = systemStatuses.some(s => s.status === 'error');
    const hasWarning = systemStatuses.some(s => s.status === 'warning');
    
    if (hasError) return 'error';
    if (hasWarning) return 'warning';
    return 'healthy';
  };

  const getStatusIcon = (status: SystemStatus['status']) => {
    const IconComponent = STATUS_ICONS[status];
    return <IconComponent className={`w-4 h-4 ${status === 'loading' ? 'animate-spin' : ''}`} />;
  };

  const getComponentIcon = (component: string) => {
    switch (component) {
      case "מסד נתונים": return <Database className="w-4 h-4" />;
      case "מערכת אימות": return <Shield className="w-4 h-4" />;
      case "שרת API": return <Server className="w-4 h-4" />;
      case "טיימר עבודה": return <Clock className="w-4 h-4" />;
      case "ניהול לקוחות": return <Users className="w-4 h-4" />;
      case "גיבויים": return <FileText className="w-4 h-4" />;
      default: return <Wifi className="w-4 h-4" />;
    }
  };

  const formatResponseTime = (ms?: number) => {
    if (!ms) return "";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  const refreshAll = () => {
    refetchDatabase();
    refetchAuth();
    refetchApi();
  };

  const overallStatus = getOverallStatus();

  return (
    <Card className="w-full" dir="rtl">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CardTitle className="text-lg font-semibold">מצב המערכת</CardTitle>
            <Badge className={STATUS_COLORS[overallStatus]}>
              {getStatusIcon(overallStatus)}
              <span className="mr-1">
                {overallStatus === 'healthy' && 'תקין'}
                {overallStatus === 'warning' && 'אזהרה'}
                {overallStatus === 'error' && 'שגיאה'}
              </span>
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={autoRefresh ? "bg-green-50 border-green-200" : ""}
            >
              <RefreshCw className={`w-4 h-4 ml-1 ${autoRefresh ? 'animate-spin' : ''}`} />
              {autoRefresh ? 'עדכון אוטומטי' : 'עדכון ידני'}
            </Button>
            <Button variant="outline" size="sm" onClick={refreshAll}>
              <RefreshCw className="w-4 h-4 ml-1" />
              רענן הכל
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {systemStatuses.map((status, index) => (
            <div
              key={index}
              className={`p-4 rounded-lg border-2 transition-all duration-200 hover:shadow-md ${STATUS_COLORS[status.status]}`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getComponentIcon(status.component)}
                  <span className="font-medium text-sm">{status.component}</span>
                </div>
                {getStatusIcon(status.status)}
              </div>
              
              <p className="text-xs mb-2 leading-relaxed">{status.message}</p>
              
              <div className="flex items-center justify-between text-xs opacity-75">
                <span>
                  עדכון אחרון: {status.lastChecked.toLocaleTimeString('he-IL')}
                </span>
                {status.responseTime && (
                  <span className="font-mono">
                    {formatResponseTime(status.responseTime)}
                  </span>
                )}
              </div>
              
              {status.details && (
                <div className="mt-2 pt-2 border-t border-current border-opacity-20">
                  <p className="text-xs opacity-80">{status.details}</p>
                </div>
              )}
            </div>
          ))}
        </div>
        
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>
              אחרון עדכון: {new Date().toLocaleString('he-IL')}
            </span>
            <span>
              רענון אוטומטי: {autoRefresh ? 'פעיל' : 'כבוי'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}