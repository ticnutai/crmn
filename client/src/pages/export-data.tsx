import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Download, Database, Users, Clock, FileText, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import type { Client, User, TimeEntry } from "@shared/schema";

export default function ExportDataPage() {
  const [selectedTables, setSelectedTables] = useState<string[]>(['clients', 'users', 'timeEntries']);
  const { toast } = useToast();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const { data: users = [] } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const { data: timeEntries = [] } = useQuery<TimeEntry[]>({
    queryKey: ["/api/time-entries"],
  });

  const exportOptions = [
    {
      id: 'clients',
      name: 'לקוחות',
      icon: Users,
      count: clients.length,
      description: 'כל נתוני הלקוחות כולל פרטי קשר, כתובות וסטטוסים',
      data: clients
    },
    {
      id: 'users',
      name: 'משתמשים',
      icon: Database,
      count: users.length,
      description: 'חשבונות המשתמשים במערכת',
      data: users
    },
    {
      id: 'timeEntries',
      name: 'רישומי זמן',
      icon: Clock,
      count: timeEntries.length,
      description: 'כל רישומי הזמן והעבודה על הלקוחות',
      data: timeEntries
    }
  ];

  const handleTableToggle = (tableId: string) => {
    setSelectedTables(prev => 
      prev.includes(tableId)
        ? prev.filter(id => id !== tableId)
        : [...prev, tableId]
    );
  };

  const exportToJson = () => {
    const exportData: any = {};
    
    exportOptions.forEach(option => {
      if (selectedTables.includes(option.id)) {
        exportData[option.id] = option.data;
      }
    });

    exportData.exportInfo = {
      exportDate: new Date().toISOString(),
      systemVersion: "1.0.0",
      totalRecords: Object.values(exportData).flat().length,
      tables: selectedTables
    };

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `client-management-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "יצוא הושלם בהצלחה",
      description: `נתונים יוצאו מ-${selectedTables.length} טבלאות`,
    });
  };

  const exportToExcel = () => {
    // Create CSV data for Excel compatibility
    const csvData: string[] = [];
    
    exportOptions.forEach(option => {
      if (selectedTables.includes(option.id) && option.data.length > 0) {
        csvData.push(`\n=== ${option.name.toUpperCase()} ===`);
        
        // Get headers from first record
        const headers = Object.keys(option.data[0]);
        csvData.push(headers.join(','));
        
        // Add data rows
        option.data.forEach((record: any) => {
          const values = headers.map(header => {
            const value = record[header];
            // Handle special characters and commas in CSV
            if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
              return `"${value.replace(/"/g, '""')}"`;
            }
            return value || '';
          });
          csvData.push(values.join(','));
        });
        csvData.push(''); // Empty line between tables
      }
    });

    const csvContent = csvData.join('\n');
    const csvBlob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(csvBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `client-management-export-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "יצוא Excel הושלם",
      description: `נתונים יוצאו לקובץ CSV עם ${selectedTables.length} טבלאות`,
    });
  };

  return (
    <div className="p-6 space-y-6 bg-background text-foreground rtl" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">יצוא נתונים</h1>
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {new Date().toLocaleDateString('he-IL')}
          </span>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            בחירת נתונים ליצוא
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4">
            {exportOptions.map((option) => {
              const Icon = option.icon;
              const isSelected = selectedTables.includes(option.id);
              
              return (
                <div
                  key={option.id}
                  className={`border rounded-lg p-4 cursor-pointer transition-colors ${
                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50'
                  }`}
                  onClick={() => handleTableToggle(option.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Checkbox 
                        checked={isSelected}
                        onChange={() => handleTableToggle(option.id)}
                      />
                      <Icon className="w-5 h-5 text-primary" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{option.name}</span>
                          <Badge variant="secondary">{option.count} רשומות</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                          {option.description}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between items-center mb-4">
              <div>
                <h3 className="font-semibold">סיכום יצוא</h3>
                <p className="text-sm text-muted-foreground">
                  {selectedTables.length} טבלאות נבחרו ליצוא
                </p>
              </div>
              <div className="text-left">
                <div className="text-2xl font-bold text-primary">
                  {exportOptions
                    .filter(opt => selectedTables.includes(opt.id))
                    .reduce((sum, opt) => sum + opt.count, 0)
                  }
                </div>
                <div className="text-sm text-muted-foreground">סה"כ רשומות</div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                onClick={exportToJson}
                disabled={selectedTables.length === 0}
                className="flex-1"
              >
                <Download className="w-4 h-4 ml-2" />
                יצוא JSON
              </Button>
              <Button 
                onClick={exportToExcel}
                disabled={selectedTables.length === 0}
                variant="outline"
                className="flex-1"
              >
                <Download className="w-4 h-4 ml-2" />
                יצוא Excel/CSV
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>הערות חשובות</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="font-semibold text-blue-900 mb-2">יצוא JSON</h4>
            <p className="text-sm text-blue-800">
              פורמט מושלם לייבוא למערכת חדשה. שומר על כל המבנה והקשרים בין הנתונים.
            </p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-3">
            <h4 className="font-semibold text-green-900 mb-2">יצוא Excel/CSV</h4>
            <p className="text-sm text-green-800">
              פורמט נוח לעריכה ב-Excel. מתאים לניתוח נתונים וכהעברה ראשונית.
            </p>
          </div>
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
            <h4 className="font-semibold text-amber-900 mb-2">אבטחת מידע</h4>
            <p className="text-sm text-amber-800">
              קבצי היצוא כוללים מידע רגיש. יש לשמור אותם במקום בטוח ולא לשתף אותם ברשת.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}