import { useState } from "react";
import { Info, TrendingUp, Clock, Calendar, Target } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Badge } from "@/components/ui/badge";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { TimeEntry } from "@shared/schema";

interface TimeInsightsTooltipProps {
  clientId?: string;
  showGlobalInsights?: boolean;
}

export default function TimeInsightsTooltip({ 
  clientId, 
  showGlobalInsights = false 
}: TimeInsightsTooltipProps) {
  const { user } = useAuth();
  
  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  const calculateInsights = () => {
    // Filter entries based on context
    let relevantEntries = timeEntries;
    if (clientId) {
      relevantEntries = timeEntries.filter(entry => entry.clientId === clientId);
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    // Calculate time periods
    const todayEntries = relevantEntries.filter(entry => 
      entry.startTime && new Date(entry.startTime) >= today
    );
    const yesterdayEntries = relevantEntries.filter(entry => 
      entry.startTime && 
      new Date(entry.startTime) >= yesterday && 
      new Date(entry.startTime) < today
    );
    const weekEntries = relevantEntries.filter(entry => 
      entry.startTime && new Date(entry.startTime) >= weekAgo
    );
    const monthEntries = relevantEntries.filter(entry => 
      entry.startTime && new Date(entry.startTime) >= monthAgo
    );

    // Calculate durations
    const todayTime = todayEntries.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);
    const yesterdayTime = yesterdayEntries.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);
    const weekTime = weekEntries.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);
    const monthTime = monthEntries.reduce((sum, entry) => sum + (entry.duration ?? 0), 0);

    // Calculate averages
    const weeklyAverage = weekTime / 7;
    const monthlyAverage = monthTime / 30;

    // Calculate trends
    const dailyTrend = yesterdayTime > 0 ? ((todayTime - yesterdayTime) / yesterdayTime) * 100 : 0;
    const weeklyTrend = weeklyAverage > 0 ? ((todayTime - weeklyAverage) / weeklyAverage) * 100 : 0;

    // Calculate session patterns
    const sessionCounts = {
      today: todayEntries.length,
      week: weekEntries.length,
      month: monthEntries.length
    };

    const averageSessionLength = todayEntries.length > 0 
      ? todayTime / todayEntries.length 
      : 0;

    // Find most productive hours
    const hourStats = new Array(24).fill(0);
    weekEntries.forEach(entry => {
      if (entry.startTime) {
        const hour = new Date(entry.startTime).getHours();
        hourStats[hour] += entry.duration ?? 0;
      }
    });
    const mostProductiveHour = hourStats.indexOf(Math.max(...hourStats));

    return {
      todayTime,
      yesterdayTime,
      weekTime,
      monthTime,
      weeklyAverage,
      monthlyAverage,
      dailyTrend,
      weeklyTrend,
      sessionCounts,
      averageSessionLength,
      mostProductiveHour
    };
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else {
      return `${minutes} דק'`;
    }
  };

  const formatTrend = (trend: number) => {
    const sign = trend >= 0 ? '+' : '';
    return `${sign}${trend.toFixed(1)}%`;
  };

  const getTrendColor = (trend: number) => {
    if (trend > 10) return 'text-green-600';
    if (trend > 0) return 'text-green-500';
    if (trend > -10) return 'text-yellow-600';
    return 'text-red-600';
  };

  const insights = calculateInsights();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <button className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-blue-100 hover:bg-blue-200 transition-colors">
            <Info className="w-3 h-3 text-blue-600" />
          </button>
        </TooltipTrigger>
        <TooltipContent 
          side="left" 
          className="w-80 p-4 bg-white border shadow-lg" 
          dir="rtl"
        >
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-600" />
              <h3 className="font-semibold text-sm">
                {clientId ? "תובנות לקוח" : "תובנות זמן כללי"}
              </h3>
            </div>

            {/* Today's Summary */}
            <div className="border-b pb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600">היום</span>
                <span className="font-mono font-semibold">
                  {formatDuration(insights.todayTime)}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-500">
                  {insights.sessionCounts.today} סשנים
                </span>
                {insights.averageSessionLength > 0 && (
                  <>
                    <span className="text-xs text-gray-400">•</span>
                    <span className="text-xs text-gray-500">
                      ממוצע {formatDuration(insights.averageSessionLength)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Trends */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">מגמות</h4>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">לעומת אתמול</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getTrendColor(insights.dailyTrend)}`}
                >
                  {formatTrend(insights.dailyTrend)}
                </Badge>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">לעומת ממוצע שבועי</span>
                <Badge 
                  variant="outline" 
                  className={`text-xs ${getTrendColor(insights.weeklyTrend)}`}
                >
                  {formatTrend(insights.weeklyTrend)}
                </Badge>
              </div>
            </div>

            {/* Weekly/Monthly Summary */}
            <div className="space-y-2 border-t pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">השבוע</span>
                <span className="text-xs font-mono">
                  {formatDuration(insights.weekTime)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-600">החודש</span>
                <span className="text-xs font-mono">
                  {formatDuration(insights.monthTime)}
                </span>
              </div>
            </div>

            {/* Most Productive Hour */}
            {insights.mostProductiveHour >= 0 && (
              <div className="border-t pt-3">
                <div className="flex items-center gap-2">
                  <Target className="w-3 h-3 text-green-600" />
                  <span className="text-xs text-gray-600">
                    השעה הפרודוקטיבית ביותר
                  </span>
                </div>
                <div className="text-xs font-semibold text-green-700 mr-5">
                  {insights.mostProductiveHour}:00-{insights.mostProductiveHour + 1}:00
                </div>
              </div>
            )}

            {/* Data Period Info */}
            <div className="border-t pt-2">
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-gray-400" />
                <span className="text-xs text-gray-400">
                  מבוסס על {insights.sessionCounts.month} סשנים ב-30 הימים האחרונים
                </span>
              </div>
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}