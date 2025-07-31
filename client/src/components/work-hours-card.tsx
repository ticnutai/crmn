import { useState, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Clock, User, Calendar, ChevronDown, Eye, BellRing, Trash2, FileText, Filter, Users } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import TableStyleSelector, { useTableStyle, getTableStyleClasses } from "@/components/table-style-selector";

import type { Client, TimeEntry } from "@shared/schema";
import { Dialog, DialogContent, DialogClose, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import TimeInsightsTooltip from "./time-insights-tooltip";
import EnhancedNotificationSystem from "./enhanced-notification-system";

export default function WorkHoursCard() {
  const { user, isAdmin } = useAuth();
  const [viewPeriod, setViewPeriod] = useState<"today" | "week" | "month" | "year">("today");
  const [showDetails, setShowDetails] = useState(true); // מציג פירוט באופן קבוע
  const [selectedClientId, setSelectedClientId] = useState<string | null>(null); // פילטר לפי לקוח
  const [editingCell, setEditingCell] = useState<{ id: string; field: string } | null>(null);
  const [editValue, setEditValue] = useState("");
  const { tableStyle, changeStyle } = useTableStyle();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: clients = [], isLoading: clientsLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: timeEntries = [], isLoading: timeEntriesLoading } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  // Delete client mutation
  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: string) => {
      await apiRequest(`/api/clients/${clientId}`, 'DELETE');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      queryClient.invalidateQueries({ queryKey: ['/api/time-entries'] });
      toast({
        title: "לקוח נמחק",
        description: "הלקוח ושעות העבודה שלו נמחקו בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן למחוק את הלקוח",
        variant: "destructive",
      });
    },
  });

  const handleDeleteClient = async (clientId: string, clientName: string) => {
    if (window.confirm(`האם אתה בטוח שברצונך למחוק את ${clientName}?\nזה ימחוק גם את כל שעות העבודה שלו.`)) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    // Show time format without seconds for work hours display
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    } else if (minutes > 0) {
      return `${minutes} דק'`;
    } else {
      return `0 דק'`;
    }
  };

  const formatTime = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL', {
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    }).format(new Date(date));
  };

  const formatShortDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL', {
      month: 'short',
      day: 'numeric'
    }).format(new Date(date));
  };

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client?.name || "לקוח לא מוכר";
  };

  const filterEntriesByPeriod = () => {
    if (!user) return [];
    
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    return timeEntries.filter(entry => {
      // Admin can see all entries, regular users only their own
      if (!isAdmin && entry.userId !== user.id) return false;
      
      const entryDate = new Date(entry.startTime);

      switch (viewPeriod) {
        case "today":
          return entryDate >= today;
        case "week":
          const weekStart = new Date(today);
          weekStart.setDate(today.getDate() - today.getDay());
          return entryDate >= weekStart;
        case "month":
          const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
          return entryDate >= monthStart;
        case "year":
          const yearStart = new Date(today.getFullYear(), 0, 1);
          return entryDate >= yearStart;
        default:
          return true;
      }
    });
  };

  const filteredEntries = filterEntriesByPeriod();
  const totalDuration = filteredEntries.reduce((total, entry) => total + (entry.duration || 0), 0);

  const getCurrentTotal = () => {
    return totalDuration;
  };

  const getPeriodLabel = () => {
    switch (viewPeriod) {
      case "today": return "היום";
      case "week": return "השבוע";
      case "month": return "החודש";
      case "year": return "השנה";
      default: return "היום";
    }
  };

  const getActiveClients = () => {
    const clientMap = new Map();

    // Debug: log current clients data
    

    filteredEntries.forEach(entry => {
      // Always get fresh client data
      const fullClient = clients.find(c => c.id === entry.clientId);
      

      if (clientMap.has(entry.clientId)) {
        const existingClient = clientMap.get(entry.clientId);
        clientMap.set(entry.clientId, {
          ...existingClient,
          duration: existingClient.duration + (entry.duration || 0),
          isActive: !entry.endTime || existingClient.isActive,
          entries: [...existingClient.entries, entry],
          notes: fullClient?.notes || "", // Always use latest notes from server
        });
      } else {
        clientMap.set(entry.clientId, {
          id: entry.clientId,
          name: getClientName(entry.clientId),
          duration: entry.duration || 0,
          isActive: !entry.endTime,
          entries: [entry],
          notes: fullClient?.notes || "" // Use notes from server
        });
      }
    });

    const result = Array.from(clientMap.values()).sort((a, b) => b.duration - a.duration);
    
    return result;
  };

  const activeClients = getActiveClients();

  // Update time entry mutation
  const updateTimeEntryMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest(`/api/time-entries/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      toast({
        title: "נתונים עודכנו",
        description: "הרשומה עודכנה בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון",
        description: "לא ניתן היה לעדכן את הרשומה",
        variant: "destructive",
      });
    },
  });

  // Update client mutation
  const updateClientMutation = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: any }) => {
      return await apiRequest(`/api/clients/${id}`, "PATCH", updates);
    },
    onSuccess: () => {
      // Force refresh both clients and time entries
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/time-entries"] });
      // Force a fresh fetch
      setTimeout(() => {
        queryClient.refetchQueries({ queryKey: ["/api/clients"] });
      }, 100);
      toast({
        title: "הערות עודכנו",
        description: "הערות הלקוח עודכנו בהצלחה",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון",
        description: "לא ניתן היה לעדכן את הערות הלקוח",
        variant: "destructive",
      });
    },
  });

  // Handle cell editing
  const handleCellClick = (entryId: string, field: string, currentValue: string) => {
    
    setEditingCell({ id: entryId, field });
    setEditValue(currentValue || "");
    setTimeout(() => {
      if (inputRef.current) {
        inputRef.current.focus();
        inputRef.current.select();
      }
    }, 50);
  };

  const handleCellSave = () => {
    if (!editingCell) return;

    

    const updates = {
      [editingCell.field]: editValue.trim(),
    };

    updateTimeEntryMutation.mutate({
      id: editingCell.id,
      updates,
    });

    setEditingCell(null);
    setEditValue("");
  };

  const handleCellCancel = () => {
    setEditingCell(null);
    setEditValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editingCell?.id.startsWith('client-')) {
        const clientId = editingCell.id.replace('client-', '');
        handleClientNoteSave(clientId);
      } else {
        handleCellSave();
      }
    } else if (e.key === 'Escape') {
      handleCellCancel();
    }
  };

  const handleClientNoteSave = (clientId: string) => {
    if (!editingCell) return;

    

    const updates = {
      notes: editValue.trim(),
    };

    updateClientMutation.mutate({
      id: clientId,
      updates,
    });

    setEditingCell(null);
    setEditValue("");
  };

  const getDailyBreakdown = () => {
    const dailyMap = new Map();

    // Filter entries by selected client if any
    const entriesToProcess = selectedClientId 
      ? filteredEntries.filter(entry => entry.clientId === selectedClientId)
      : filteredEntries;

    entriesToProcess.forEach(entry => {
      const date = new Date(entry.startTime).toDateString();
      if (!dailyMap.has(date)) {
        dailyMap.set(date, {
          date: new Date(entry.startTime),
          entries: [],
          total: 0
        });
      }

      const day = dailyMap.get(date);
      day.entries.push(entry);
      day.total += entry.duration || 0;
    });

    return Array.from(dailyMap.values()).sort((a, b) => b.date.getTime() - a.date.getTime());
  };

  const dailyBreakdown = getDailyBreakdown();

  if (clientsLoading || timeEntriesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            שעות עבודה היום
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="h-6 w-16" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-purple-100 border-indigo-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-indigo-900">
            <Clock className="w-5 h-5" />
            שעות עבודה
            <TimeInsightsTooltip showGlobalInsights={true} />
          </div>
          <div className="flex items-center gap-3">
            <EnhancedNotificationSystem context="global" />
            <TableStyleSelector currentStyle={tableStyle} onStyleChange={changeStyle} />
            
            {/* Client Filter Display */}
            {selectedClientId && (
              <div className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded-md text-xs">
                <Filter className="w-3 h-3" />
                <span>פילטר: {getClientName(selectedClientId)}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-4 w-4 p-0 text-blue-600 hover:text-blue-800"
                  onClick={() => setSelectedClientId(null)}
                  title="בטל פילטר"
                >
                  ×
                </Button>
              </div>
            )}
            
            <Select value={viewPeriod} onValueChange={(value: "today" | "week" | "month" | "year") => setViewPeriod(value)}>
              <SelectTrigger className="w-28 h-8 text-sm bg-white/80">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="today">היום</SelectItem>
                <SelectItem value="week">שבוע</SelectItem>
                <SelectItem value="month">חודש</SelectItem>
                <SelectItem value="year">שנה</SelectItem>
              </SelectContent>
            </Select>
            <Badge className="bg-indigo-100 text-indigo-800 font-semibold">
              {formatDuration(getCurrentTotal())}
            </Badge>
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-indigo-700 hover:text-indigo-900">
                  <Eye className="w-4 h-4 ml-1" />
                  פירוט
                  <ChevronDown className={`w-4 h-4 mr-1 transition-transform ${showDetails ? 'rotate-180' : ''}`} />
                </Button>
              </CollapsibleTrigger>
            </Collapsible>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {filteredEntries.length === 0 ? (
          <div className="text-center py-4">
            <p className="text-indigo-700">לא נרשמו שעות עבודה ב{getPeriodLabel()}</p>
          </div>
        ) : (
          <>
            {/* Summary by client */}
            <div className="space-y-2">
              {activeClients.map((client) => (
                <div key={client.id} className="bg-white/70 rounded-lg p-3 border border-indigo-100">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-indigo-600" />
                      <span className="font-medium text-indigo-900">{client.name}</span>
                      {client.isActive && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          פעיל
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className="bg-indigo-100 text-indigo-800 font-semibold">
                        {formatDuration(client.duration)}
                      </Badge>
                      {/* Client Detail Filter Button */}
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`h-6 w-6 p-0 ${selectedClientId === client.id ? 'text-blue-600 bg-blue-100' : 'text-blue-500 hover:text-blue-700 hover:bg-blue-50'}`}
                        onClick={() => setSelectedClientId(selectedClientId === client.id ? null : client.id)}
                        title={selectedClientId === client.id ? 'הצג את כל הלקוחות' : `הצג רק פרטי ${client.name}`}
                      >
                        <FileText className="w-3 h-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 text-red-500 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDeleteClient(client.id, client.name)}
                        disabled={deleteClientMutation.isPending}
                        title={`מחק את ${client.name}`}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                  {/* Client Notes */}
                  <div className="text-xs text-gray-600 mb-2">
                    <strong>הערות:</strong>{' '}
                    <span 
                      className="cursor-pointer hover:bg-blue-50 rounded px-1 py-0.5 inline-block min-w-[60px]"
                      onClick={() => handleCellClick(`client-${client.id}`, 'notes', client.notes || '')}
                      title="לחץ לעריכת הערות הלקוח"
                    >
                      {editingCell?.id === `client-${client.id}` && editingCell.field === 'notes' ? (
                        <input
                          ref={inputRef}
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={handleKeyPress}
                          onBlur={() => handleClientNoteSave(client.id)}
                          autoFocus
                          className="w-full px-1 py-0.5 border border-blue-300 rounded text-xs bg-white"
                          placeholder="הוסף הערה..."
                        />
                      ) : (
                        client.notes || "לחץ להוספת הערה"
                      )}
                    </span>
                  </div>
                  {/* Total Hours Summary */}
                  <div className="text-xs text-indigo-700 bg-indigo-50 p-2 rounded">
                    <strong>סיכום שעות:</strong> {formatDuration(client.totalDuration || client.duration)}
                    {client.sessionCount && ` • ${client.sessionCount} סשנים`}
                  </div>
                </div>
              ))}
            </div>

            {/* Detailed breakdown */}
            <Collapsible open={showDetails} onOpenChange={setShowDetails}>
              <CollapsibleContent className="space-y-4 mt-4">
                {viewPeriod === "today" ? (
                  /* Today detailed view */
                  <div className="space-y-3">
                    <h4 className="font-semibold text-indigo-900 border-b border-indigo-200 pb-2">פירוט לפי שעות</h4>
                    <div className={getTableStyleClasses(tableStyle).container}>
                      <Table className={getTableStyleClasses(tableStyle).table}>
                        <TableHeader className={getTableStyleClasses(tableStyle).header}>
                          <TableRow className={getTableStyleClasses(tableStyle).headerRow}>
                            <TableHead className={`text-right ${getTableStyleClasses(tableStyle).headerCell}`}>לקוח</TableHead>
                            <TableHead className={`text-right ${getTableStyleClasses(tableStyle).headerCell}`}>שעת התחלה</TableHead>
                            <TableHead className={`text-right ${getTableStyleClasses(tableStyle).headerCell}`}>שעת סיום</TableHead>
                            <TableHead className={`text-right ${getTableStyleClasses(tableStyle).headerCell}`}>זמן</TableHead>
                            <TableHead className={`text-right ${getTableStyleClasses(tableStyle).headerCell}`}>תיאור</TableHead>
                            <TableHead className={`text-right ${getTableStyleClasses(tableStyle).headerCell}`}>הערות</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(selectedClientId 
                            ? filteredEntries.filter(entry => entry.clientId === selectedClientId)
                            : filteredEntries
                          ).map((entry, index) => (
                            <TableRow key={entry.id} className={(() => {
                              const bodyRowStyle = getTableStyleClasses(tableStyle).bodyRow;
                              return typeof bodyRowStyle === 'function' ? bodyRowStyle(index) : bodyRowStyle;
                            })()}>
                              <TableCell className={`text-right ${getTableStyleClasses(tableStyle).bodyCell}`}>{getClientName(entry.clientId)}</TableCell>
                              <TableCell className={`text-right ${getTableStyleClasses(tableStyle).bodyCell}`}>{formatTime(entry.startTime)}</TableCell>
                              <TableCell className={`text-right ${getTableStyleClasses(tableStyle).bodyCell}`}>
                                {entry.endTime ? formatTime(entry.endTime) : (
                                  <Badge className="bg-green-100 text-green-800">רץ</Badge>
                                )}
                              </TableCell>
                              <TableCell className={`text-right ${getTableStyleClasses(tableStyle).bodyCell}`}>{formatDuration(entry.duration || 0)}</TableCell>
                              <TableCell 
                                className={`text-right ${getTableStyleClasses(tableStyle).bodyCell} cursor-pointer hover:bg-blue-50`}
                                onClick={() => handleCellClick(entry.id, 'description', entry.description || '')}
                                title="לחץ לעריכה"
                              >
                                {editingCell?.id === entry.id && editingCell.field === 'description' ? (
                                  <input
                                    ref={inputRef}
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    onBlur={(e) => {
                                      // שמירה מיידית ללא עיכוב
                                      handleCellSave();
                                    }}
                                    autoFocus
                                    className="w-full px-2 py-1 border border-blue-300 rounded text-sm bg-white"
                                    placeholder="הוסף תיאור..."
                                  />
                                ) : (
                                  entry.description || "לחץ להוספת תיאור"
                                )}
                              </TableCell>
                              <TableCell 
                                className={`text-right ${getTableStyleClasses(tableStyle).bodyCell} cursor-pointer hover:bg-blue-50`}
                                onClick={() => handleCellClick(entry.id, 'notes', entry.notes || '')}
                                title="לחץ לעריכה"
                              >
                                {editingCell?.id === entry.id && editingCell.field === 'notes' ? (
                                  <input
                                    ref={inputRef}
                                    type="text"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onKeyDown={handleKeyPress}
                                    onBlur={(e) => {
                                      // שמירה מיידית ללא עיכוב
                                      handleCellSave();
                                    }}
                                    autoFocus
                                    className="w-full px-2 py-1 border border-blue-300 rounded text-sm bg-white"
                                    placeholder="הוסף הערה..."
                                  />
                                ) : (
                                  entry.notes || "לחץ להוספת הערה"
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-indigo-900 border-b border-indigo-200 pb-2">
                      פירוט לפי {viewPeriod === "week" ? "ימים" : viewPeriod === "month" ? "ימים" : "חודשים"}
                    </h4>
                    {dailyBreakdown.map((day) => (
                      <div key={day.date.toISOString()} className="bg-white/70 rounded-lg p-3 border border-indigo-100">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Calendar className="w-4 h-4 text-indigo-600" />
                            <span className="font-medium text-indigo-900">
                              {viewPeriod === "year" ? formatShortDate(day.date) : formatDate(day.date)}
                            </span>
                          </div>
                          <Badge className="bg-indigo-100 text-indigo-800 font-semibold">
                            {formatDuration(day.total)}
                          </Badge>
                        </div>
                        <div className="space-y-1 mr-6">
                          {day.entries.map((entry: TimeEntry) => (
                            <div key={entry.id} className="flex items-center justify-between text-sm">
                              <div className="flex items-center gap-2">
                                <span className="text-indigo-700">{getClientName(entry.clientId)}</span>
                                <span className="text-gray-500">
                                  {formatTime(entry.startTime)} - {entry.endTime ? formatTime(entry.endTime) : "רץ"}
                                </span>
                              </div>
                              <span className="font-mono text-indigo-600">
                                {formatDuration(entry.duration || 0)}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CollapsibleContent>
            </Collapsible>
          </>
        )}
      </CardContent>
    </Card>
  );
}