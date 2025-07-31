import { useState, useRef, useEffect } from "react";
import { useAutoBackup } from "@/hooks/use-auto-backup";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Download, Trash2, Database, Play, Pause, RefreshCw, Calendar, HardDrive, CheckCircle, XCircle, Clock, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Backup } from "@shared/schema";

export default function BackupPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // הפעלת גיבוי אוטומטי רק בעמוד הגיבויים
  useAutoBackup();
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(() => {
    return localStorage.getItem('autoBackupEnabled') === 'true';
  });
  const [backupFrequency, setBackupFrequency] = useState(() => {
    return localStorage.getItem('backupFrequency') || "daily";
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { data: backups, isLoading } = useQuery<Backup[]>({
    queryKey: ["/api/backups"],
  });

  const createBackup = useMutation({
    mutationFn: async () => {
      const backupData = {
        filename: `manual_backup_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`,
        size: Math.floor(Math.random() * 5000000) + 1000000, // Simulate backup size 1-5MB
        status: "completed",
      };
      return await apiRequest("/api/backups", "POST", backupData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      toast({
        title: "גיבוי נוצר בהצלחה",
        description: "הגיבוי החדש נשמר במערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בגיבוי",
        description: "לא ניתן היה ליצור גיבוי",
        variant: "destructive",
      });
    },
  });

  const deleteBackup = useMutation({
    mutationFn: async (id: string) => {
      return await apiRequest(`/api/backups/${id}`, "DELETE");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      toast({
        title: "גיבוי נמחק בהצלחה",
        description: "הגיבוי הוסר מהמערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה למחוק את הגיבוי",
        variant: "destructive",
      });
    },
  });

  const formatFileSize = (bytes: number) => {
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    if (bytes === 0) return '0 Bytes';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(new Date(date));
  };

  const getStatusBadge = (status: string) => {
    const variants = {
      completed: { color: "bg-green-100 text-green-800", icon: CheckCircle },
      failed: { color: "bg-red-100 text-red-800", icon: XCircle },
      in_progress: { color: "bg-blue-100 text-blue-800", icon: Clock },
    };
    
    const labels = {
      completed: "הושלם",
      failed: "נכשל",
      in_progress: "בתהליך",
    };

    const variant = variants[status as keyof typeof variants] || variants.completed;
    const Icon = variant.icon;

    return (
      <Badge className={variant.color}>
        <Icon className="w-3 h-3 ml-1" />
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  const handleDownloadBackup = (backup: Backup) => {
    // Simulate backup download
    const backupData = {
      id: backup.id,
      filename: backup.filename,
      createdAt: backup.createdAt,
      size: backup.size,
      status: backup.status,
      // This would typically contain the actual backup data
      data: "מידע גיבוי מדומה - בסביבת ייצור זה יכיל את כל נתוני המערכת",
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], {
      type: "application/json",
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = backup.filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "גיבוי הורד בהצלחה",
      description: `הקובץ ${backup.filename} הורד למחשב שלך`,
    });
  };

  const restoreBackup = useMutation({
    mutationFn: async (backupId: string) => {
      return await apiRequest(`/api/backups/${backupId}/restore`, "POST");
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "שחזור הושלם בהצלחה",
        description: "כל נתוני המערכת שוחזרו מהגיבוי",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה בשחזור",
        description: "לא ניתן היה לשחזר את הגיבוי",
        variant: "destructive",
      });
    },
  });

  const importBackup = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('backup', file);
      
      const response = await fetch('/api/backups/import', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        throw new Error('Import failed');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries();
      toast({
        title: "יבוא הושלם בהצלחה",
        description: "הגיבוי יובא ונתוני המערכת עודכנו",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה ביבוא",
        description: "לא ניתן היה ליבא את הגיבוי",
        variant: "destructive",
      });
    },
  });

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "שגיאה",
        description: "אנא בחר קובץ גיבוי תקין (JSON)",
        variant: "destructive",
      });
      return;
    }

    importBackup.mutate(file);
  };

  const handleRestoreBackup = (backupId: string, filename: string) => {
    if (window.confirm(`האם אתה בטוח שברצונך לשחזר את הגיבוי "${filename}"?\nזה יחליף את כל נתוני המערכת הנוכחיים!`)) {
      restoreBackup.mutate(backupId);
    }
  };

  const handleAutoBackupToggle = (enabled: boolean) => {
    setAutoBackupEnabled(enabled);
    localStorage.setItem('autoBackupEnabled', enabled.toString());
    
    toast({
      title: enabled ? "גיבוי אוטומטי הופעל" : "גיבוי אוטומטי הושבת",
      description: enabled ? "המערכת תבצע גיבויים אוטומטיים יומיים" : "גיבויים אוטומטיים הופסקו לצמיתות - ההגדרה נשמרה",
    });
  };

  const handleFrequencyChange = (frequency: string) => {
    setBackupFrequency(frequency);
    localStorage.setItem('backupFrequency', frequency);
    
    const frequencyLabels = {
      daily: "יומי",
      weekly: "שבועי", 
      monthly: "חודשי"
    };
    
    toast({
      title: "תדירות גיבוי עודכנה",
      description: `גיבוי אוטומטי יבוצע כעת ${frequencyLabels[frequency as keyof typeof frequencyLabels]} - ההגדרה נשמרה`,
    });
  };

  const sortedBackups = backups?.sort((a, b) => 
    (b.createdAt ? new Date(b.createdAt).getTime() : 0) - (a.createdAt ? new Date(a.createdAt).getTime() : 0)
  ) || [];

  const totalBackupSize = backups?.reduce((total, backup) => total + backup.size, 0) || 0;
  const completedBackups = backups?.filter(backup => backup.status === 'completed').length || 0;
  const failedBackups = backups?.filter(backup => backup.status === 'failed').length || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול גיבויים</h1>
          <p className="text-gray-600 mt-2">יצירה וניהול של גיבויי מערכת</p>
        </div>
        <div className="flex gap-3">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className="hidden"
          />
          <Button
            variant="outline"
            onClick={() => fileInputRef.current?.click()}
            disabled={importBackup.isPending}
          >
            {importBackup.isPending ? (
              <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Upload className="w-4 h-4 ml-2" />
            )}
            {importBackup.isPending ? "מייבא..." : "יבא גיבוי"}
          </Button>
          <Button onClick={() => createBackup.mutate()} disabled={createBackup.isPending}>
            {createBackup.isPending ? (
              <RefreshCw className="w-4 h-4 ml-2 animate-spin" />
            ) : (
              <Database className="w-4 h-4 ml-2" />
            )}
            {createBackup.isPending ? "יוצר גיבוי..." : "צור גיבוי ידני"}
          </Button>
        </div>
      </div>

      {/* Backup Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">סך הגיבויים</p>
                <p className="text-3xl font-bold text-gray-900">{backups?.length || 0}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Database className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">גיבויים מוצלחים</p>
                <p className="text-3xl font-bold text-green-600">{completedBackups}</p>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">גיבויים כושלים</p>
                <p className="text-3xl font-bold text-red-600">{failedBackups}</p>
              </div>
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">גודל כולל</p>
                <p className="text-3xl font-bold text-gray-900">{formatFileSize(totalBackupSize)}</p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <HardDrive className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Auto Backup Settings */}
      <Card>
        <CardHeader>
          <CardTitle>הגדרות גיבוי אוטומטי</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">גיבוי אוטומטי</p>
              <p className="text-sm text-gray-500">הפעל גיבויים אוטומטיים לפי תדירות נבחרת</p>
            </div>
            <Switch checked={autoBackupEnabled} onCheckedChange={handleAutoBackupToggle} />
          </div>

          <Separator />

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-gray-900">תדירות גיבוי</p>
              <p className="text-sm text-gray-500">בחר כמה פעמים לבצע גיבוי אוטומטי</p>
            </div>
            <Select value={backupFrequency} onValueChange={handleFrequencyChange} disabled={!autoBackupEnabled}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="daily">יומי</SelectItem>
                <SelectItem value="weekly">שבועי</SelectItem>
                <SelectItem value="monthly">חודשי</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className={`p-4 rounded-lg border ${autoBackupEnabled ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
            <div className="flex items-start gap-3">
              <div className={`w-2 h-2 rounded-full mt-2 ${autoBackupEnabled ? 'bg-green-500' : 'bg-gray-400'}`}></div>
              <div>
                <p className={`text-sm font-medium ${autoBackupEnabled ? 'text-green-900' : 'text-gray-700'}`}>
                  {autoBackupEnabled ? "גיבוי אוטומטי פעיל" : "גיבוי אוטומטי מבוטל"}
                </p>
                <p className={`text-xs ${autoBackupEnabled ? 'text-green-700' : 'text-gray-600'}`}>
                  {autoBackupEnabled ? `המערכת תבצע גיבוי ${backupFrequency === 'daily' ? 'יומי' : backupFrequency === 'weekly' ? 'שבועי' : 'חודשי'}` : "הגדרה זו נשמרת ותישמר גם לאחר רענון הדף"}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Backup History */}
      <Card>
        <CardHeader>
          <CardTitle>היסטוריית גיבויים</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <Skeleton className="h-10 w-10 rounded" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-[200px]" />
                      <Skeleton className="h-4 w-[150px]" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-[100px]" />
                </div>
              ))}
            </div>
          ) : sortedBackups.length === 0 ? (
            <div className="text-center py-12">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">אין גיבויים במערכת</p>
              <Button onClick={() => createBackup.mutate()}>
                <Database className="w-4 h-4 ml-2" />
                צור גיבוי ראשון
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם הקובץ</TableHead>
                  <TableHead>תאריך יצירה</TableHead>
                  <TableHead>גודל</TableHead>
                  <TableHead>סטטוס</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {sortedBackups.map((backup) => (
                  <TableRow key={backup.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-100 rounded flex items-center justify-center">
                          <Database className="w-4 h-4 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{backup.filename}</p>
                          <p className="text-sm text-gray-500">גיבוי מערכת</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className="text-sm">{formatDate(backup.createdAt!)}</span>
                      </div>
                    </TableCell>
                    <TableCell>{formatFileSize(backup.size)}</TableCell>
                    <TableCell>{getStatusBadge(backup.status)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDownloadBackup(backup)}
                          title="הורד"
                          disabled={backup.status !== 'completed'}
                        >
                          <Download className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRestoreBackup(backup.id, backup.filename)}
                          title="שחזר"
                          disabled={backup.status !== 'completed' || restoreBackup.isPending}
                        >
                          <RotateCcw className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="מחיקה">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                              <AlertDialogDescription>
                                פעולה זו תמחק את הגיבוי לצמיתות ולא ניתן יהיה לשחזר אותו.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteBackup.mutate(backup.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
