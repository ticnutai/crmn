import { useState } from "react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, Mail, Phone, Building, User, Calendar, Clock, FolderOpen, Files } from "lucide-react";
import { Link } from "wouter";
import type { Client, TimeEntry } from "@shared/schema";
import { format } from "date-fns";
import SimpleFileManager from "@/components/simple-file-manager";

export default function ClientDetail() {
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState<'info' | 'time' | 'files'>('info');

  const { data: client, isLoading: clientLoading } = useQuery<Client>({
    queryKey: ["/api/clients", id],
  });

  const { data: timeEntries = [], isLoading: timeLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries", { clientId: id }],
  });

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200",
      inactive: "bg-red-100 text-red-800 border-red-200",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
    };
    
    const labels = {
      active: "פעיל",
      inactive: "לא פעיל", 
      pending: "בהמתנה",
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants] || variants.active} px-3 py-1 font-medium border`}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL').format(new Date(date));
  };

  const formatDuration = (start: Date, end: Date | null) => {
    if (!end) return "פעיל כעת";
    const diff = new Date(end).getTime() - new Date(start).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}:${minutes.toString().padStart(2, '0')}`;
  };

  const totalHours = timeEntries.reduce((total, entry) => {
    if (!entry.endTime) return total;
    const diff = new Date(entry.endTime).getTime() - new Date(entry.startTime).getTime();
    return total + (diff / (1000 * 60 * 60));
  }, 0);

  if (clientLoading || timeLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="h-64 bg-gray-200 rounded"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (!client) {
    return (
      <div className="p-6 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">לקוח לא נמצא</h1>
        <p className="text-gray-600 mb-6">לא ניתן למצוא לקוח עם המזהה שצוין</p>
        <Link href="/clients">
          <Button>
            <ArrowRight className="w-4 h-4 ml-2" />
            חזרה לרשימת הלקוחות
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/clients">
            <Button variant="outline" size="sm">
              <ArrowRight className="w-4 h-4 ml-2" />
              חזרה
            </Button>
          </Link>
          <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-2xl shadow-lg">
            {client.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{client.name}</h1>
            <p className="text-gray-600">{client.company}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {getStatusBadge(client.status)}
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8">
          <button
            onClick={() => setActiveTab('info')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'info'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <User className="w-4 h-4 inline ml-2" />
            פרטי לקוח
          </button>
          <button
            onClick={() => setActiveTab('time')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'time'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Clock className="w-4 h-4 inline ml-2" />
            שעות עבודה
          </button>
          <button
            onClick={() => setActiveTab('files')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'files'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <Files className="w-4 h-4 inline ml-2" />
            קבצים ומסמכים
          </button>
        </nav>
      </div>

      {/* Tab Content */}
      {activeTab === 'info' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Client Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                פרטי לקוח
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <Mail className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{client.email || "לא הוזן אימייל"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Phone className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{client.phone || "לא הוזן טלפון"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Building className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">{client.company || "לא הוזנה חברה"}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <span className="text-sm">נוצר: {client.createdAt ? formatDate(client.createdAt) : "לא זמין"}</span>
                </div>
              </div>
              
              <div className="pt-4 border-t">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">סטטוס לקוח</span>
                  {getStatusBadge(client.status)}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                סיכום שעות עבודה
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center pb-4 border-b">
                <div className="text-3xl font-bold text-blue-600">{totalHours.toFixed(1)}</div>
                <div className="text-sm text-gray-500">סה"כ שעות עבודה</div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>מספר סשנים:</span>
                  <span className="font-medium">{timeEntries.length}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>פגישה אחרונה:</span>
                  <span className="font-medium">
                    {timeEntries.length > 0 
                      ? formatDate(timeEntries[timeEntries.length - 1].startTime)
                      : "אין רישומים"
                    }
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'time' && (
        <Card>
          <CardHeader>
            <CardTitle>היסטוריית שעות עבודה</CardTitle>
          </CardHeader>
          <CardContent>
            {timeEntries.length > 0 ? (
              <div className="space-y-3">
                {timeEntries.map((entry) => (
                  <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-4">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <div className="font-medium text-sm">
                          {formatDate(entry.startTime)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(entry.startTime).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                          {entry.endTime && ` - ${new Date(entry.endTime).toLocaleTimeString('he-IL', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-sm font-medium">
                      {formatDuration(entry.startTime, entry.endTime)}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <Clock className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                <h3 className="text-lg font-medium mb-2">אין רישומי זמן</h3>
                <p>עדיין לא נרשמו שעות עבודה עבור לקוח זה</p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'files' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderOpen className="w-5 h-5" />
              קבצים ומסמכים
            </CardTitle>
          </CardHeader>
          <CardContent>
            <SimpleFileManager client={client} />
          </CardContent>
        </Card>
      )}
    </div>
  );
}