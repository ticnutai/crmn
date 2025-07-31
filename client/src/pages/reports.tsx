import { useQuery } from "@tanstack/react-query";
import { FileText, Download, Calendar, Users, TrendingUp, BarChart3, PieChart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import type { Client, User, Stats } from "@shared/schema";
import { useState } from "react";

export default function Reports() {
  const { toast } = useToast();
  const [selectedPeriod, setSelectedPeriod] = useState("monthly");
  const [selectedReport, setSelectedReport] = useState("overview");

  const { data: stats, isLoading: statsLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
  });

  const { data: clients, isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: users, isLoading: usersLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const isLoading = statsLoading || clientsLoading || usersLoading;

  // Calculate client status distribution
  const clientStatusData = clients?.reduce((acc, client) => {
    acc[client.status] = (acc[client.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate user role distribution
  const userRoleData = users?.reduce((acc, user) => {
    acc[user.role] = (acc[user.role] || 0) + 1;
    return acc;
  }, {} as Record<string, number>) || {};

  // Calculate recent activity (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const recentClients = clients?.filter(client => 
    client.createdAt && new Date(client.createdAt) >= thirtyDaysAgo
  ).length || 0;

  const recentUsers = users?.filter(user => 
    user.createdAt && new Date(user.createdAt) >= thirtyDaysAgo
  ).length || 0;

  const handleExportReport = () => {
    const reportData = {
      period: selectedPeriod,
      type: selectedReport,
      generatedAt: new Date().toISOString(),
      stats,
      clientStatusData,
      userRoleData,
      recentActivity: {
        clients: recentClients,
        users: recentUsers,
      },
    };

    const blob = new Blob([JSON.stringify(reportData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `report_${selectedReport}_${selectedPeriod}_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "דוח יוצא בהצלחה",
      description: "הדוח הורד למחשב שלך",
    });
  };

  const getStatusLabel = (status: string) => {
    const labels = {
      active: "פעיל",
      inactive: "לא פעיל",
      pending: "בהמתנה",
    };
    return labels[status as keyof typeof labels] || status;
  };

  const getRoleLabel = (role: string) => {
    const labels = {
      admin: "מנהל",
      manager: "מנהל צוות",
      user: "משתמש",
    };
    return labels[role as keyof typeof labels] || role;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">דוחות ואנליטיקה</h1>
          <p className="text-gray-600 mt-2">צפייה בנתונים סטטיסטיים ויצוא דוחות</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">יומי</SelectItem>
              <SelectItem value="weekly">שבועי</SelectItem>
              <SelectItem value="monthly">חודשי</SelectItem>
              <SelectItem value="yearly">שנתי</SelectItem>
            </SelectContent>
          </Select>
          
          <Select value={selectedReport} onValueChange={setSelectedReport}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">סקירה כללית</SelectItem>
              <SelectItem value="clients">דוח לקוחות</SelectItem>
              <SelectItem value="users">דוח משתמשים</SelectItem>
              <SelectItem value="activity">דוח פעילות</SelectItem>
            </SelectContent>
          </Select>
          
          <Button onClick={handleExportReport}>
            <Download className="w-4 h-4 ml-2" />
            יצא דוח
          </Button>
        </div>
      </div>

      {/* Overview Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="w-12 h-12 rounded-lg" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">סך הלקוחות</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalClients || 0}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">לקוחות פעילים</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.activeClients || 0}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">סך המשתמשים</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalUsers || 0}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">גיבויים</p>
                  <p className="text-3xl font-bold text-gray-900">{stats?.totalBackups || 0}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Charts and Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Client Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="w-5 h-5" />
              התפלגות סטטוס לקוחות
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(clientStatusData).map(([status, count]) => {
                  const total = Object.values(clientStatusData).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return (
                    <div key={status} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          status === 'active' ? 'bg-green-500' :
                          status === 'inactive' ? 'bg-red-500' : 'bg-yellow-500'
                        }`}></div>
                        <span className="text-sm text-gray-700">{getStatusLabel(status)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* User Role Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5" />
              התפלגות תפקידי משתמשים
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-10" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(userRoleData).map(([role, count]) => {
                  const total = Object.values(userRoleData).reduce((sum, val) => sum + val, 0);
                  const percentage = total > 0 ? Math.round((count / total) * 100) : 0;
                  
                  return (
                    <div key={role} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-3 h-3 rounded-full ${
                          role === 'admin' ? 'bg-red-500' :
                          role === 'manager' ? 'bg-blue-500' : 'bg-gray-500'
                        }`}></div>
                        <span className="text-sm text-gray-700">{getRoleLabel(role)}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{count}</span>
                        <span className="text-xs text-gray-500">({percentage}%)</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5" />
              פעילות אחרונה (30 יום)
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-4 w-8" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">לקוחות חדשים</span>
                  <span className="text-lg font-semibold text-blue-600">{recentClients}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-700">משתמשים חדשים</span>
                  <span className="text-lg font-semibold text-green-600">{recentUsers}</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Report Actions */}
        <Card>
          <CardHeader>
            <CardTitle>פעולות דוח</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button variant="outline" className="w-full justify-start" onClick={handleExportReport}>
              <FileText className="w-4 h-4 ml-2" />
              יצא דוח JSON
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => {
              toast({
                title: "תכונה בפיתוח",
                description: "יצוא PDF יהיה זמין בקרוב",
              });
            }}>
              <Download className="w-4 h-4 ml-2" />
              יצא PDF (בפיתוח)
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => {
              toast({
                title: "תכונה בפיתוח",
                description: "יצוא Excel יהיה זמין בקרוב",
              });
            }}>
              <FileText className="w-4 h-4 ml-2" />
              יצא Excel (בפיתוח)
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
