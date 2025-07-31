import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, File, FolderIcon } from "lucide-react";

export default function GoogleDriveDashboard() {
  const [files, setFiles] = useState<any[]>([
    { id: '1', name: 'חוזה לקוח 1.pdf' },
    { id: '2', name: 'מסמכי פרויקט.docx' },
    { id: '3', name: 'דוח סיכום.xlsx' }
  ]);

  return (
    <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
      <CardContent>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              <File className="w-3 h-3 ml-1" />
              {files.length} קבצים
            </Badge>
          </div>
          
          {files.length === 0 ? (
            <div className="text-center py-6">
              <FolderIcon className="w-12 h-12 text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500">אין קבצים בענן</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {files.slice(0, 5).map((file: any) => (
                <div key={file.id} className="flex items-center justify-between p-2 border rounded hover:bg-gray-50">
                  <div className="flex items-center gap-2 flex-1">
                    <File className="w-4 h-4 text-blue-500" />
                    <span className="text-sm font-medium truncate">{file.name}</span>
                  </div>
                  
                </div>
              ))}
              {files.length > 5 && (
                <p className="text-xs text-gray-500 text-center">ועוד {files.length - 5} קבצים...</p>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}