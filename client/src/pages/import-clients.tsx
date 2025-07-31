import { useState, useRef } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Upload, FileText, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import * as XLSX from 'xlsx';

interface ImportResult {
  success: number;
  failed: number;
  errors: string[];
}

export default function ImportClients() {
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const processExcelFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        // Get ALL data including formatted and colored cells
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '', raw: false }) as any[][];
        
        
        
        // Advanced parsing to find ALL data including headers and sub-headers
        let processedData: any[] = [];
        let currentHeaders: string[] = [];
        let isDataSection = false;
        
        for (let rowIndex = 0; rowIndex < jsonData.length; rowIndex++) {
          const row = jsonData[rowIndex];
          
          if (!row || row.length === 0) continue;
          
          // Check if this row contains Hebrew headers or important data
          const hebrewCells = row.filter(cell => 
            cell && typeof cell === 'string' && 
            /[\u0590-\u05FF]/.test(cell) && 
            cell.trim().length > 0
          );
          
          if (hebrewCells.length === 0) continue;
          
          // Detect if this is a header row
          const isHeaderRow = row.some(cell => 
            typeof cell === 'string' && (
              cell.includes('שם') || cell.includes('לקוח') || cell.includes('כתובת') || 
              cell.includes('טלפון') || cell.includes('מייל') || cell.includes('גוש') || 
              cell.includes('מגרש') || cell.includes('סטטוס') || cell.includes('תאריך') ||
              cell.includes('מחיר') || cell.includes('סכום') || cell.includes('הערות') ||
              cell.includes('פרטים') || cell.includes('אזור') || cell.includes('עיר') ||
              cell.includes('רחוב') || cell.includes('בית') || cell.includes('דירה') ||
              cell.includes('קומה') || cell.includes('חדרים') || cell.includes('שטח') ||
              cell.includes('היתר') || cell.includes('מהנדס') || cell.includes('עתיקות') ||
              cell.includes('תכנון') || cell.includes('בניה') || cell.includes('רישוי')
            )
          );
          
          if (isHeaderRow && currentHeaders.length === 0) {
            // This is the main header row
            currentHeaders = row.map((cell, index) => 
              cell && cell.toString().trim() !== '' ? cell.toString().trim() : `עמודה_${index + 1}`
            );
            isDataSection = true;
            
            continue;
          }
          
          if (isDataSection && hebrewCells.length >= 2) {
            // This is a data row - create comprehensive client record
            const clientData: any = {
              rowNumber: rowIndex + 1,
              name: '',
              address: '',
              phone: '',
              email: '',
              company: '',
              block: '',
              plot: '',
              section: '',
              city: '',
              street: '',
              building: '',
              apartment: '',
              floor: '',
              rooms: '',
              area: '',
              price: '',
              status: '',
              notes: [],
              permitRegular: '',
              permitEasy: '',
              engineer: '',
              antiquities: '',
              planning: '',
              construction: '',
              licensing: '',
              allData: {}
            };
            
            // Map ALL data from the row
            row.forEach((cellValue, colIndex) => {
              if (!cellValue || cellValue.toString().trim() === '') return;
              
              const header = currentHeaders[colIndex] || `עמודה_${colIndex + 1}`;
              const value = cellValue.toString().trim();
              
              // Store ALL data
              clientData.allData[header] = value;
              
              const headerLower = header.toLowerCase();
              
              // Map to specific fields
              if (headerLower.includes('שם') || headerLower.includes('לקוח') || 
                  headerLower.includes('בעל') || headerLower.includes('קונה')) {
                clientData.name = value;
              } else if (headerLower.includes('כתובת') || headerLower.includes('מען')) {
                clientData.address = value;
              } else if (headerLower.includes('טלפון') || headerLower.includes('נייד') || 
                         headerLower.includes('פלאפון') || headerLower.includes('סלולרי')) {
                clientData.phone = value;
              } else if (headerLower.includes('מייל') || headerLower.includes('אימייל') || 
                         headerLower.includes('email')) {
                clientData.email = value;
              } else if (headerLower.includes('חברה') || headerLower.includes('עסק') || 
                         headerLower.includes('ארגון')) {
                clientData.company = value;
              } else if (headerLower.includes('גוש')) {
                clientData.block = value;
              } else if (headerLower.includes('מגרש') || headerLower.includes('חלקה')) {
                clientData.plot = value;
              } else if (headerLower.includes('עיר') || headerLower.includes('יישוב')) {
                clientData.city = value;
              } else if (headerLower.includes('רחוב') || headerLower.includes('כביש')) {
                clientData.street = value;
              } else if (headerLower.includes('בית') || headerLower.includes('מספר בית')) {
                clientData.building = value;
              } else if (headerLower.includes('דירה') || headerLower.includes('מספר דירה')) {
                clientData.apartment = value;
              } else if (headerLower.includes('קומה')) {
                clientData.floor = value;
              } else if (headerLower.includes('חדרים') || headerLower.includes('חדר')) {
                clientData.rooms = value;
              } else if (headerLower.includes('שטח') || headerLower.includes('מ"ר')) {
                clientData.area = value;
              } else if (headerLower.includes('מחיר') || headerLower.includes('סכום') || 
                         headerLower.includes('עלות') || headerLower.includes('₪')) {
                clientData.price = value;
              } else if (headerLower.includes('סטטוס') || headerLower.includes('מצב') || 
                         headerLower.includes('שלב')) {
                clientData.status = value;
              } else if (headerLower.includes('היתר') && headerLower.includes('רגיל')) {
                clientData.permitRegular = value;
              } else if (headerLower.includes('היתר') && headerLower.includes('הקלה')) {
                clientData.permitEasy = value;
              } else if (headerLower.includes('מהנדס')) {
                clientData.engineer = value;
              } else if (headerLower.includes('עתיקות')) {
                clientData.antiquities = value;
              } else if (headerLower.includes('תכנון')) {
                clientData.planning = value;
              } else if (headerLower.includes('בניה')) {
                clientData.construction = value;
              } else if (headerLower.includes('רישוי') || headerLower.includes('רישיון')) {
                clientData.licensing = value;
              } else {
                // Add to notes
                clientData.notes.push(`${header}: ${value}`);
              }
            });
            
            // Create comprehensive notes from all unmapped data
            const noteFields = [
              clientData.permitRegular && `היתר רגיל: ${clientData.permitRegular}`,
              clientData.permitEasy && `היתר בהקלה: ${clientData.permitEasy}`,
              clientData.engineer && `מהנדס: ${clientData.engineer}`,
              clientData.antiquities && `רשות עתיקות: ${clientData.antiquities}`,
              clientData.planning && `תכנון: ${clientData.planning}`,
              clientData.construction && `בניה: ${clientData.construction}`,
              clientData.licensing && `רישוי: ${clientData.licensing}`,
              clientData.price && `מחיר: ${clientData.price}`,
              clientData.area && `שטח: ${clientData.area}`,
              clientData.rooms && `חדרים: ${clientData.rooms}`,
              clientData.floor && `קומה: ${clientData.floor}`,
              clientData.apartment && `דירה: ${clientData.apartment}`,
              clientData.building && `בית: ${clientData.building}`,
              ...clientData.notes
            ].filter(Boolean);
            
            // Ensure we have a name
            if (!clientData.name) {
              const firstNonEmptyValue = Object.values(clientData.allData)
                .find(val => val && typeof val === 'string' && 
                  !/^\d+$/.test(val) && val.length > 2);
              clientData.name = firstNonEmptyValue || `רשומה ${rowIndex + 1}`;
            }
            
            // Build comprehensive address
            const addressParts = [
              clientData.street,
              clientData.building,
              clientData.apartment && `דירה ${clientData.apartment}`,
              clientData.city,
              clientData.address
            ].filter(Boolean);
            
            const finalClient = {
              rowNumber: clientData.rowNumber,
              name: clientData.name,
              address: addressParts.join(', ') || clientData.address,
              phone: clientData.phone,
              email: clientData.email,
              company: clientData.company,
              block: clientData.block,
              plot: clientData.plot,
              section: clientData.section,
              status: clientData.status || 'פעיל',
              notes: noteFields.join('\n'),
              allOriginalData: JSON.stringify(clientData.allData, null, 2)
            };
            
            processedData.push(finalClient);
          }
        }
        
        
        
        if (processedData.length === 0) {
          toast({
            title: "אזהרה",
            description: "לא נמצאו נתונים מובנים. אנא בדוק את מבנה הקובץ",
            variant: "destructive",
          });
          return;
        }
        
        setPreview(processedData.slice(0, 15)); // Show first 15 rows for preview
        setFile(file);
        
        toast({
          title: "קובץ נותח בהצלחה",
          description: `נמצאו ${processedData.length} רשומות עם כל הפרטים`,
        });
        
      } catch (error) {
        
        toast({
          title: "שגיאה",
          description: "לא ניתן לקרוא את הקובץ. אנא ודא שהקובץ תקין",
          variant: "destructive",
        });
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const importMutation = useMutation({
    mutationFn: async (data: any[]) => {
      const results = {
        success: 0,
        failed: 0,
        errors: [] as string[]
      };

      for (const row of data) {
        try {
          const clientData = {
            name: row.name,
            email: row.email || '',
            phone: row.phone || '',
            company: row.company || '',
            position: '',
            status: row.status || 'active',
            notes: [
              row.address && `כתובת: ${row.address}`,
              row.block && `גוש: ${row.block}`,
              row.plot && `מגרש: ${row.plot}`,
              row.section && `חלקה: ${row.section}`,
              row.notes,
              row.allOriginalData && `נתונים מקוריים:\n${row.allOriginalData}`
            ].filter(Boolean).join('\n\n')
          };

          await apiRequest('/api/clients', 'POST', clientData);

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`שורה ${row.rowNumber}: ${row.name} - ${error}`);
        }
      }

      return results;
    },
    onSuccess: (results) => {
      setImportResult(results);
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      toast({
        title: "יבוא הושלם",
        description: `נוספו ${results.success} לקוחות בהצלחה`,
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "כשל ביבוא הנתונים",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      processExcelFile(selectedFile);
    }
  };

  const handleImport = () => {
    if (!file || preview.length === 0) return;
    
    // Get all data, not just preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      const allData = jsonData.slice(1).map((row: any, index) => {
        return {
          rowNumber: index + 2,
          name: row['שם לקוח '] || row['שם לקוח'] || row['name'] || '',
          address: row['כתובת'] || row['address'] || '',
          block: row['גוש'] || row['block'] || '',
          plot: row['מגרש'] || row['plot'] || '',
          section: row['חלקה'] || row['section'] || '',
          phone: row['טלפון'] || row['מספר טלפון'] || row['phone'] || '',
          email: row['אימייל'] || row['email'] || '',
          company: row['חברה'] || row['company'] || '',
          notes: [
            row['הליך היתר רגיל'] && `היתר רגיל: ${row['הליך היתר רגיל']}`,
            row['הליך היתר בהקלה '] && `היתר בהקלה: ${row['הליך היתר בהקלה ']}`,
            row['פרטי מהנדס'] && `מהנדס: ${row['פרטי מהנדס']}`,
            row['רשות העתיקות '] && `רשות עתיקות: ${row['רשות העתיקות ']}`,
          ].filter(Boolean).join('; ')
        };
      }).filter(item => item.name.trim() !== '');

      importMutation.mutate(allData);
    };
    reader.readAsArrayBuffer(file);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">יבוא לקוחות מאקסל</h1>
        <p className="text-gray-600">יבא רשימת לקוחות מקובץ אקסל</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="w-5 h-5" />
            העלאת קובץ
          </CardTitle>
          <CardDescription>
            בחר קובץ אקסל עם נתוני הלקוחות
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
            <input
              ref={fileInputRef}
              type="file"
              accept=".xlsx,.xls"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            {!file ? (
              <div className="space-y-2">
                <FileText className="w-12 h-12 text-gray-400 mx-auto" />
                <p className="text-gray-600">לחץ לבחירת קובץ אקסל</p>
                <Button onClick={() => fileInputRef.current?.click()}>
                  בחר קובץ
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                <CheckCircle className="w-12 h-12 text-green-500 mx-auto" />
                <p className="text-gray-900 font-medium">{file.name}</p>
                <p className="text-gray-600">{preview.length} לקוחות נמצאו</p>
                <Button onClick={() => fileInputRef.current?.click()} variant="outline">
                  בחר קובץ אחר
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>תצוגה מקדימה</CardTitle>
            <CardDescription>
              מציג את 10 הרשומות הראשונות
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 px-4 py-2 text-right">שם</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">כתובת</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">גוש</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">מגרש</th>
                    <th className="border border-gray-300 px-4 py-2 text-right">טלפון</th>
                  </tr>
                </thead>
                <tbody>
                  {preview.map((row, index) => (
                    <tr key={index}>
                      <td className="border border-gray-300 px-4 py-2">{row.name}</td>
                      <td className="border border-gray-300 px-4 py-2">{row.address}</td>
                      <td className="border border-gray-300 px-4 py-2">{row.block}</td>
                      <td className="border border-gray-300 px-4 py-2">{row.plot}</td>
                      <td className="border border-gray-300 px-4 py-2">{row.phone}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 flex justify-between items-center">
              <p className="text-gray-600">סך הכל: {preview.length}+ לקוחות</p>
              <Button 
                onClick={handleImport}
                disabled={importMutation.isPending}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    מיבא...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4 mr-2" />
                    יבא לקוחות
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {importResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {importResult.failed === 0 ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-yellow-500" />
              )}
              תוצאות היבוא
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-green-800 font-semibold">הושלם בהצלחה</p>
                <p className="text-green-600 text-2xl font-bold">{importResult.success}</p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-red-800 font-semibold">נכשל</p>
                <p className="text-red-600 text-2xl font-bold">{importResult.failed}</p>
              </div>
            </div>
            
            {importResult.errors.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">שגיאות:</h3>
                <div className="bg-red-50 p-4 rounded-lg max-h-40 overflow-y-auto">
                  {importResult.errors.map((error, index) => (
                    <p key={index} className="text-red-600 text-sm">{error}</p>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}