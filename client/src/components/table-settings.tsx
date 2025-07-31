import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface TableSettingsProps {
  stickyHeaders: boolean;
  stickyFirstColumn: boolean;
  onStickyHeadersChange: (value: boolean) => void;
  onStickyFirstColumnChange: (value: boolean) => void;
}

export default function TableSettings({
  stickyHeaders,
  stickyFirstColumn,
  onStickyHeadersChange,
  onStickyFirstColumnChange
}: TableSettingsProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">הגדרות טבלה</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="sticky-headers" className="text-sm font-medium">
              כותרות דביקות בגלילה אנכית
            </Label>
            <Switch
              id="sticky-headers"
              checked={stickyHeaders}
              onCheckedChange={onStickyHeadersChange}
            />
          </div>
          
          <Separator />
          
          <div className="flex items-center justify-between">
            <Label htmlFor="sticky-first-column" className="text-sm font-medium">
              עמודה ראשונה דביקה בגלילה אופקית
            </Label>
            <Switch
              id="sticky-first-column"
              checked={stickyFirstColumn}
              onCheckedChange={onStickyFirstColumnChange}
            />
          </div>
        </div>
        
        <div className="text-xs text-gray-500 p-3 bg-gray-50 rounded">
          <p>הגדרות אלו משפרות את חוויית הגלילה בטבלאות גדולות</p>
        </div>
      </CardContent>
    </Card>
  );
}