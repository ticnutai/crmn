import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Activity, AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

export default function MiniSystemStatus() {
  const { data: databaseStatus, isLoading: dbLoading } = useQuery<any>({
    queryKey: ["/api/system/database-status"],
    refetchInterval: 60000, // Check every minute
    staleTime: 45000,
  });

  const { data: apiStatus, isLoading: apiLoading } = useQuery<any>({
    queryKey: ["/api/system/api-status"],
    refetchInterval: 60000,
    staleTime: 45000,
  });

  console.log('📊 MiniSystemStatus render:', { databaseStatus, apiStatus, dbLoading, apiLoading });

  // Determine overall system status
  const getStatus = () => {
    if (dbLoading || apiLoading) return 'loading';
    if (!databaseStatus && !apiStatus) return 'loading';
    if (databaseStatus?.error || apiStatus?.error) return 'error';
    if (databaseStatus?.healthy === false || apiStatus?.healthy === false) return 'warning';
    if (databaseStatus?.healthy && apiStatus?.healthy) return 'healthy';
    return 'loading';
  };

  const status = getStatus();
  
  const statusConfig = {
    healthy: {
      icon: CheckCircle2,
      color: "bg-green-100 text-green-800 border-green-200",
      text: "תקין"
    },
    warning: {
      icon: AlertTriangle,
      color: "bg-yellow-100 text-yellow-800 border-yellow-200",
      text: "אזהרה"
    },
    error: {
      icon: XCircle,
      color: "bg-red-100 text-red-800 border-red-200",
      text: "שגיאה"
    },
    loading: {
      icon: Activity,
      color: "bg-blue-100 text-blue-800 border-blue-200",
      text: "בודק..."
    }
  };

  const config = statusConfig[status];
  const IconComponent = config.icon;

  return (
    <div className="flex items-center">
      <Badge 
        className={`${config.color} flex items-center gap-1 text-xs font-medium px-2 py-1 border`}
        title={`מצב המערכת: ${config.text} - לחץ לפרטים נוספים`}
      >
        <IconComponent className="w-3 h-3" />
        <span>{config.text}</span>
      </Badge>
    </div>
  );
}