import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Eye, Trash2, Search, Database, BellRing } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import ClientForm from "@/components/client-form";
import ImportExportDialog from "@/components/import-export-dialog";
import TableStyleSelector, { useTableStyle, getTableStyleClasses } from "@/components/table-style-selector";
import { useTableSticky } from "@/hooks/use-table-sticky";
import EditableHeader from "@/components/editable-header";
import AddNotificationButton from "@/components/add-notification-button";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client, TimeEntry } from "@shared/schema";
import { Link } from "wouter";

export default function Clients() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const { tableStyle, changeStyle } = useTableStyle();
  // Temporary simplified table columns
  const defaultColumns = [
    { id: 'select', label: '', type: 'select' },
    { id: 'name', label: 'שם לקוח', type: 'text' },
    { id: 'email', label: 'אימייל', type: 'email' },
    { id: 'phone', label: 'טלפון', type: 'phone' },
    { id: 'workHours', label: 'שעות עבודה', type: 'custom' },
    { id: 'status', label: 'סטטוס', type: 'status' },
    { id: 'actions', label: 'פעולות', type: 'actions' }
  ];
  const { stickyHeaders, stickyFirstColumn, setStickyHeaders, setStickyFirstColumn } = useTableSticky();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: timeEntries } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/clients/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "לקוח נמחק בהצלחה",
        description: "הלקוח הוסר מהמערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה למחוק את הלקוח",
        variant: "destructive",
      });
    },
  });

  const deleteMultipleClients = useMutation({
    mutationFn: async (ids: string[]) => {
      const res = await apiRequest("/api/clients", "DELETE", { ids });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      setSelectedClients([]);
      toast({
        title: "לקוחות נמחקו בהצלחה",
        description: `${data.deletedCount} לקוחות הוסרו מהמערכת`,
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה למחוק את הלקוחות",
        variant: "destructive",
      });
    },
  });

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email || "").toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.phone || "").includes(searchQuery)
  ) || [];

  const handleSelectClient = (clientId: string, checked: boolean) => {
    if (checked) {
      setSelectedClients(prev => [...prev, clientId]);
    } else {
      setSelectedClients(prev => prev.filter(id => id !== clientId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedClients(filteredClients.map(client => client.id));
    } else {
      setSelectedClients([]);
    }
  };

  const isAllSelected = filteredClients.length > 0 && selectedClients.length === filteredClients.length;
  const isPartiallySelected = selectedClients.length > 0 && selectedClients.length < filteredClients.length;

  const getStatusBadge = (status: string) => {
    const variants = {
      active: "bg-green-100 text-green-800 border-green-200 shadow-sm",
      inactive: "bg-red-100 text-red-800 border-red-200 shadow-sm",
      pending: "bg-yellow-100 text-yellow-800 border-yellow-200 shadow-sm",
    };
    
    const labels = {
      active: "פעיל",
      inactive: "לא פעיל", 
      pending: "בהמתנה",
    };

    const icons = {
      active: "●",
      inactive: "●",
      pending: "●",
    };

    return (
      <Badge className={`${variants[status as keyof typeof variants] || variants.active} px-3 py-1 font-medium border`}>
        <span className="mr-1">{icons[status as keyof typeof icons] || "●"}</span>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL').format(new Date(date));
  };

  // חישוב שעות עבודה לכל לקוח
  const getClientWorkHours = (clientId: string) => {
    if (!timeEntries) return 0;
    
    const clientEntries = timeEntries.filter(entry => entry.clientId === clientId);
    const totalSeconds = clientEntries.reduce((total, entry) => {
      return total + (entry.duration || 0);
    }, 0);
    
    return totalSeconds;
  };

  // חישוב מספר סשנים לכל לקוח
  const getClientSessionCount = (clientId: string) => {
    if (!timeEntries) return 0;
    return timeEntries.filter(entry => entry.clientId === clientId && (entry.duration || 0) > 0).length;
  };

  // חישוב הפעילות האחרונה לכל לקוח
  const getClientLastActivity = (clientId: string) => {
    if (!timeEntries) return null;
    
    const clientEntries = timeEntries
      .filter(entry => entry.clientId === clientId && entry.endTime)
      .sort((a, b) => new Date(b.endTime!).getTime() - new Date(a.endTime!).getTime());
    
    return clientEntries.length > 0 ? clientEntries[0].endTime : null;
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds} שנ'`;
    }
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}`;
    }
    
    return `${minutes} דק'`;
  };

  const handleFormSuccess = () => {
    
    setIsFormOpen(false);
    setSelectedClient(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול לקוחות</h1>
          <p className="text-gray-600 mt-2">רשימת כל הלקוחות במערכת</p>
        </div>
        <div className="flex items-center gap-3">
          <Button 
            onClick={() => {
              
              setIsImportExportOpen(true);
            }} 
            variant="outline"
          >
            <Database className="w-4 h-4 ml-2" />
            ייבוא/ייצוא
          </Button>
          <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => setSelectedClient(null)}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף לקוח חדש
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedClient ? "עריכת לקוח" : "הוספת לקוח חדש"}</DialogTitle>
            </DialogHeader>
            <ClientForm client={selectedClient || undefined} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>רשימת לקוחות</CardTitle>
            <div className="flex items-center gap-3">
              <AddNotificationButton context="clients" />
              {selectedClients.length > 0 && (
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button variant="destructive" disabled={deleteMultipleClients.isPending}>
                      <Trash2 className="w-4 h-4 ml-2" />
                      מחק נבחרים ({selectedClients.length})
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>מחיקת לקוחות</AlertDialogTitle>
                      <AlertDialogDescription>
                        האם אתה בטוח שברצונך למחוק {selectedClients.length} לקוחות?
                        פעולה זו תמחק גם את כל רשומות הזמן הקשורות ללקוחות אלו ולא ניתן לבטלה.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>ביטול</AlertDialogCancel>
                      <AlertDialogAction 
                        onClick={() => deleteMultipleClients.mutate(selectedClients)}
                        className="bg-red-600 hover:bg-red-700"
                      >
                        מחק
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              )}
              {/* Table customizer removed temporarily */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Add a new row/client
                    setSelectedClient(null);
                    setIsFormOpen(true);
                  }}
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף שורה
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    // Open quick add column dialog
                    const quickAddButton = document.querySelector('[data-quick-add-trigger]');
                    if (quickAddButton) {
                      (quickAddButton as HTMLElement).click();
                    }
                  }}
                  title="הוסף עמודה חדשה"
                >
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף עמודה
                </Button>
              </div>
              <TableStyleSelector currentStyle={tableStyle} onStyleChange={changeStyle} />
              <Button 
                onClick={() => {
                  localStorage.removeItem('clients-table');
                  
                  window.location.reload();
                }}
                variant="outline" 
                size="sm"
                className="bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
              >
                🔄 רענן עמודות
              </Button>
              <div className="relative w-64">
                <Input
                  placeholder="חיפוש לקוחות..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              ))}
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery ? "לא נמצאו לקוחות התואמים לחיפוש" : "אין לקוחות במערכת"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף לקוח ראשון
                </Button>
              )}
            </div>
          ) : (
            <div className={getTableStyleClasses(tableStyle).container}>
              <Table className={getTableStyleClasses(tableStyle).table}>
                <TableHeader className={getTableStyleClasses(tableStyle).header}>
                  <TableRow className={getTableStyleClasses(tableStyle).headerRow}>
                    <TableHead className={`text-center w-12 ${getTableStyleClasses(tableStyle).headerCell}`}>
                      <Checkbox
                        checked={isAllSelected}
                        onCheckedChange={handleSelectAll}
                        {...(isPartiallySelected && { "data-state": "indeterminate" })}
                      />
                    </TableHead>
                    <TableHead className={`text-right ${getTableStyleClasses(tableStyle).headerCell}`}>שם לקוח</TableHead>
                    <TableHead className={`text-left ${getTableStyleClasses(tableStyle).headerCell}`}>אימייל</TableHead>
                    <TableHead className={`text-left ${getTableStyleClasses(tableStyle).headerCell}`}>טלפון</TableHead>
                    <TableHead className={`text-center ${getTableStyleClasses(tableStyle).headerCell}`}>שעות עבודה</TableHead>
                    <TableHead className={`text-center ${getTableStyleClasses(tableStyle).headerCell}`}>מס' סשנים</TableHead>
                    <TableHead className={`text-center ${getTableStyleClasses(tableStyle).headerCell}`}>שעה אחרונה</TableHead>
                    <TableHead className={`text-center ${getTableStyleClasses(tableStyle).headerCell}`}>סטטוס</TableHead>
                    <TableHead className={`text-center ${getTableStyleClasses(tableStyle).headerCell}`}>פעולות</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredClients.slice(0, 50).map((client, index) => {
                    const styleClasses = getTableStyleClasses(tableStyle);
                    const rowClass = typeof styleClasses.bodyRow === 'function' 
                      ? styleClasses.bodyRow(index) 
                      : styleClasses.bodyRow;
                    
                    return (
                      <TableRow 
                        key={client.id} 
                        className={rowClass}
                      >
                        <TableCell className={`text-center ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          <Checkbox
                            checked={selectedClients.includes(client.id)}
                            onCheckedChange={(checked) => handleSelectClient(client.id, !!checked)}
                          />
                        </TableCell>
                        <TableCell className={`text-right ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          <Link href={`/clients/${client.id}`} className="text-blue-600 hover:underline">
                            {client.name}
                          </Link>
                        </TableCell>
                        <TableCell className={`text-left ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          {client.email || "-"}
                        </TableCell>
                        <TableCell className={`text-left ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          {client.phone || "-"}
                        </TableCell>
                        <TableCell className={`text-center ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {formatDuration(getClientWorkHours(client.id))}
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-center ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">
                            {getClientSessionCount(client.id)} סשנים
                          </Badge>
                        </TableCell>
                        <TableCell className={`text-center ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          {getClientLastActivity(client.id) ? (
                            <span className="text-sm text-gray-600">
                              {formatDate(getClientLastActivity(client.id)!)}
                            </span>
                          ) : (
                            <span className="text-sm text-gray-400">אין פעילות</span>
                          )}
                        </TableCell>
                        <TableCell className={`text-center ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          {getStatusBadge(client.status)}
                        </TableCell>
                        <TableCell className={`text-center ${getTableStyleClasses(tableStyle).bodyCell}`}>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedClient(client);
                                setIsFormOpen(true);
                              }}
                            >
                              <Edit className="w-4 h-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteClient.mutate(client.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      <ImportExportDialog 
        open={isImportExportOpen} 
        onOpenChange={setIsImportExportOpen} 
      />
    </div>
  );
}
