import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Users, UserCheck, DollarSign, Briefcase, TrendingUp, TrendingDown } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import type { Stats } from "@/lib/types";

export default function StatsCards() {
  const { data: stats, isLoading } = useQuery<Stats>({
    queryKey: ["/api/stats"],
    staleTime: 120000, // נתונים טריים ל-2 דקות
    refetchInterval: 300000, // רענון כל 5 דקות
    refetchOnWindowFocus: false,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-8 w-16" />
                  <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="w-12 h-12 rounded-lg" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: "סך הלקוחות",
      value: stats?.totalClients || 0,
      change: "+12.5%",
      trend: "up",
      icon: Users,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "לקוחות פעילים",
      value: stats?.activeClients || 0,
      change: "+8.2%",
      trend: "up",
      icon: UserCheck,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "הכנסות חודשיות",
      value: "₪45,230",
      change: "-3.1%",
      trend: "down",
      icon: DollarSign,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
    },
    {
      title: "פרויקטים פתוחים",
      value: 156,
      change: "+24%",
      trend: "up",
      icon: Briefcase,
      bgColor: "bg-orange-100",
      iconColor: "text-orange-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {statCards.map((stat, index) => {
        const Icon = stat.icon;
        const TrendIcon = stat.trend === "up" ? TrendingUp : TrendingDown;
        const trendColor = stat.trend === "up" ? "text-green-600" : "text-red-600";

        return (
          <Card key={index} className="card-hover">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  <p className={`text-sm flex items-center gap-1 ${trendColor}`}>
                    <TrendIcon className="w-4 h-4" />
                    <span>{stat.change}</span>
                  </p>
                </div>
                <div className={`w-12 h-12 ${stat.bgColor} rounded-lg flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
