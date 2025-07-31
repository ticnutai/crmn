import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Download, FileText, FileSpreadsheet, Code, FileType } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/useAuth";
import * as XLSX from "xlsx";
import * as Papa from "papaparse";
import { XMLParser, XMLBuilder } from "fast-xml-parser";
import type { Client, TimeEntry, User } from "@shared/schema";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFormat, setSelectedFormat] = useState<string>("excel");
  const [selectedDataType, setSelectedDataType] = useState<string>("clients");
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch data for export
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
    enabled: user?.role === "admin",
  });

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const results = [];
      const errors = [];

      for (const item of data) {
        try {
          let endpoint = "";
          let payload = {};

          if (selectedDataType === "clients") {
            endpoint = "/api/clients";
            payload = {
              ...item,
              userId: user?.id || "165378c1-a470-4cdb-87f7-5f8761709763"
            };
          } else if (selectedDataType === "users" && user?.role === "admin") {
            endpoint = "/api/users";
            payload = item;
          }

          if (endpoint) {
            const result = await apiRequest(endpoint, "POST", payload);
            const response = await result.json();
            results.push(response);
          }
        } catch (error) {
          
          errors.push(error);
        }
      }

      return { results, errors, total: data.length };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/${selectedDataType}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });

      const successCount = data.results.length;
      const errorCount = data.errors.length;

      if (errorCount === 0) {
        toast({
          title: "ייבוא הושלם בהצלחה",
          description: `${successCount} רשומות יובאו בהצלחה`,
        });
      } else {
        toast({
          title: "ייבוא הושלם עם שגיאות",
          description: `${successCount} הצליחו, ${errorCount} נכשלו`,
          variant: "destructive",
        });
      }

      setIsProcessing(false);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "שגיאה בייבוא",
        description: "לא ניתן היה לייבא את הנתונים",
        variant: "destructive",
      });
      setIsProcessing(false);
    },
  });

  const getDataForExport = (): any[] => {
    switch (selectedDataType) {
      case "clients":
        return clients.map(client => ({
          שם: client.name,
          אימייל: client.email,
          טלפון: client.phone,
          חברה: client.company,
          תפקיד: client.position,
          סטטוס: client.status,
          הערות: client.notes,
          תאריך_יצירה: new Date(client.createdAt!).toLocaleDateString('he-IL')
        }));
      case "time-entries":
        return timeEntries.map(entry => {
          const client = clients.find(c => c.id === entry.clientId);
          return {
            לקוח: client?.name || "לא ידוע",
            תחילת_עבודה: new Date(entry.startTime).toLocaleString('he-IL'),
            סיום_עבודה: entry.endTime ? new Date(entry.endTime).toLocaleString('he-IL') : "עדיין פעיל",
            משך_זמן_שניות: entry.duration || 0,
            משך_זמן_שעות: entry.duration ? (entry.duration / 3600).toFixed(2) : "0",
            תיאור: entry.description,
            פעיל: entry.isActive ? "כן" : "לא",
            תאריך_יצירה: new Date(entry.createdAt!).toLocaleDateString('he-IL')
          };
        });
      case "users":
        return user?.role === "admin" ? users.map(u => ({
          שם_משתמש: u.username,
          שם_מלא: u.fullName,
          אימייל: u.email,
          תפקיד: u.role,
          תאריך_הצטרפות: new Date(u.createdAt!).toLocaleDateString('he-IL')
        })) : [];
      default:
        return [];
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsProcessing(true);
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result;
        let parsedData: any[] = [];

        switch (selectedFormat) {
          case "excel":
            const workbook = XLSX.read(content, { type: "binary" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            parsedData = XLSX.utils.sheet_to_json(worksheet);
            break;

          case "csv":
            Papa.parse(content as string, {
              header: true,
              skipEmptyLines: true,
              complete: (results) => {
                parsedData = results.data as any[];
                processImportData(parsedData);
              },
              error: () => {
                toast({
                  title: "שגיאה בפרסור CSV",
                  description: "לא ניתן לקרוא את קובץ ה-CSV",
                  variant: "destructive",
                });
                setIsProcessing(false);
              }
            });
            return; // Papa.parse is async

          case "xml":
            const parser = new XMLParser({ ignoreAttributes: false });
            const xmlData = parser.parse(content as string);
            // Extract array from XML structure
            const rootKey = Object.keys(xmlData)[0];
            const dataKey = Object.keys(xmlData[rootKey])[0];
            parsedData = Array.isArray(xmlData[rootKey][dataKey]) 
              ? xmlData[rootKey][dataKey] 
              : [xmlData[rootKey][dataKey]];
            break;

          case "txt":
            const lines = (content as string).split('\n');
            const headers = lines[0].split('\t');
            parsedData = lines.slice(1).map(line => {
              const values = line.split('\t');
              const obj: any = {};
              headers.forEach((header, index) => {
                obj[header.trim()] = values[index]?.trim() || '';
              });
              return obj;
            }).filter(obj => Object.values(obj).some(val => val !== ''));
            break;
        }

        if (selectedFormat !== "csv") {
          processImportData(parsedData);
        }
      } catch (error) {
        
        toast({
          title: "שגיאה בקריאת הקובץ",
          description: "לא ניתן לקרוא את הקובץ הנבחר",
          variant: "destructive",
        });
        setIsProcessing(false);
      }
    };

    if (selectedFormat === "excel") {
      reader.readAsBinaryString(file);
    } else {
      reader.readAsText(file);
    }
  };

  const processImportData = (data: any[]) => {
    try {
      // Map Hebrew headers to English field names
      const mappedData = data.map(item => {
        const mapped: any = {};

        if (selectedDataType === "clients") {
          mapped.name = item.שם || item.name || item.Name || '';
          mapped.email = item.אימייל || item.email || item.Email || '';
          mapped.phone = item.טלפון || item.phone || item.Phone || '';
          mapped.company = item.חברה || item.company || item.Company || '';
          mapped.position = item.תפקיד || item.position || item.Position || '';
          mapped.status = item.סטטוס || item.status || item.Status || 'active';
          mapped.notes = item.הערות || item.notes || item.Notes || '';
        } else if (selectedDataType === "users" && user?.role === "admin") {
          mapped.username = item.שם_משתמש || item.username || item.Username || '';
          mapped.fullName = item.שם_מלא || item.fullName || item.FullName || '';
          mapped.email = item.אימייל || item.email || item.Email || '';
          mapped.role = item.תפקיד || item.role || item.Role || 'user';
          mapped.password = item.סיסמה || item.password || item.Password || 'temp123';
        }

        return mapped;
      }).filter(item => Object.values(item).some(val => val !== ''));

      if (mappedData.length === 0) {
        toast({
          title: "אין נתונים לייבוא",
          description: "הקובץ לא מכיל נתונים תקינים",
          variant: "destructive",
        });
        setIsProcessing(false);
        return;
      }

      importMutation.mutate(mappedData);
    } catch (error) {
      
      toast({
        title: "שגיאה בעיבוד הנתונים",
        description: "לא ניתן לעבד את הנתונים מהקובץ",
        variant: "destructive",
      });
      setIsProcessing(false);
    }
  };

  const handleExport = () => {
    const data = getDataForExport();
    if (data.length === 0) {
      toast({
        title: "אין נתונים לייצוא",
        description: "אין נתונים זמינים לייצוא",
        variant: "destructive",
      });
      return;
    }

    const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    const filename = `${selectedDataType}_${timestamp}`;

    try {
      switch (selectedFormat) {
        case "excel":
          const worksheet = XLSX.utils.json_to_sheet(data);
          const workbook = XLSX.utils.book_new();
          XLSX.utils.book_append_sheet(workbook, worksheet, selectedDataType);
          XLSX.writeFile(workbook, `${filename}.xlsx`);
          break;

        case "csv":
          const csv = Papa.unparse(data, { header: true });
          downloadFile(csv, `${filename}.csv`, "text/csv");
          break;

        case "xml":
          const builder = new XMLBuilder({ ignoreAttributes: false });
          const xmlData = { [selectedDataType]: { item: data } };
          const xml = builder.build(xmlData);
          downloadFile(xml, `${filename}.xml`, "application/xml");
          break;

        case "txt":
          const headers = Object.keys(data[0]).join('\t');
          const rows = data.map(item => Object.values(item).join('\t')).join('\n');
          const txt = headers + '\n' + rows;
          downloadFile(txt, `${filename}.txt`, "text/plain");
          break;
      }

      toast({
        title: "ייצוא הושלם בהצלחה",
        description: `הקובץ ${filename} הורד למחשב שלך`,
      });
    } catch (error) {
      
      toast({
        title: "שגיאה בייצוא",
        description: "לא ניתן לייצא את הנתונים",
        variant: "destructive",
      });
    }
  };

  const downloadFile = (content: string, filename: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getFormatIcon = (format: string) => {
    switch (format) {
      case "excel": return <FileSpreadsheet className="w-4 h-4" />;
      case "csv": return <FileText className="w-4 h-4" />;
      case "xml": return <Code className="w-4 h-4" />;
      case "txt": return <FileType className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  const getFormatDescription = (format: string) => {
    switch (format) {
      case "excel": return "קבצי Excel (.xlsx) - תומך בטבלאות מורכבות";
      case "csv": return "קבצי CSV - פורמט פשוט לטבלאות";
      case "xml": return "קבצי XML - פורמט מובנה לנתונים";
      case "txt": return "קבצי טקסט (.txt) - מופרדים בטאבים";
      default: return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>ייבוא וייצוא נתונים</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="import">ייבוא נתונים</TabsTrigger>
            <TabsTrigger value="export">ייצוא נתונים</TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">סוג נתונים</label>
                <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients">לקחות</SelectItem>
                    {user?.role === "admin" && <SelectItem value="users">משתמשים</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">פורמט קובץ</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="txt">Text (.txt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {getFormatIcon(selectedFormat)}
                  פורמט נבחר: {selectedFormat.toUpperCase()}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-gray-600 mb-4">
                  {getFormatDescription(selectedFormat)}
                </p>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileSelect}
                    accept={
                      selectedFormat === "excel" ? ".xlsx,.xls" :
                      selectedFormat === "csv" ? ".csv" :
                      selectedFormat === "xml" ? ".xml" :
                      ".txt"
                    }
                    className="hidden"
                  />

                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />

                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isProcessing}
                    className="mb-2"
                  >
                    {isProcessing ? "מעבד..." : "בחר קובץ לייבוא"}
                  </Button>

                  <p className="text-sm text-gray-500">
                    גרור ושחרר קובץ או לחץ לבחירה
                  </p>
                </div>
              </CardContent>
            </Card>

            {selectedDataType === "clients" && (
              <Card>
                <CardHeader>
                  <CardTitle>עמודות נדרשות לייבוא לקחות</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                    {["שם", "אימייל", "טלפון", "חברה", "תפקיד", "סטטוס", "הערות"].map(field => (
                      <Badge key={field} variant="outline">{field}</Badge>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">
                    ניתן להשתמש גם בשמות באנגלית: name, email, phone, company, position, status, notes
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="export" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">סוג נתונים</label>
                <Select value={selectedDataType} onValueChange={setSelectedDataType}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clients">לקחות ({clients.length})</SelectItem>
                    <SelectItem value="time-entries">רישומי זמן ({timeEntries.length})</SelectItem>
                    {user?.role === "admin" && <SelectItem value="users">משתמשים ({users.length})</SelectItem>}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="text-sm font-medium mb-2 block">פורמט ייצוא</label>
                <Select value={selectedFormat} onValueChange={setSelectedFormat}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                    <SelectItem value="csv">CSV</SelectItem>
                    <SelectItem value="xml">XML</SelectItem>
                    <SelectItem value="txt">Text (.txt)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>תצוגה מקדימה</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Download className="w-12 h-12 text-blue-500 mx-auto mb-4" />

                  <Button
                    onClick={handleExport}
                    disabled={getDataForExport().length === 0}
                    size="lg"
                  >
                    ייצא {getDataForExport().length} רשומות
                  </Button>

                  <p className="text-sm text-gray-600 mt-2">
                    הקובץ יירד אוטומטית למחשב שלך
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}