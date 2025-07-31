import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Palette,
  Move,
  Table,
  FolderPlus,
  FileText,
  Lock,
  Unlock,
  Grid,
  RotateCcw,
  Save,
  Download,
  Upload,
  Sliders,
  Eye,
  EyeOff,
  Maximize2,
  Minimize2
} from "lucide-react";

interface AdvancedSystemSettingsProps {
  customization: any;
  updateCustomization: (updates: any) => void;
}

export default function AdvancedSystemSettings({ customization, updateCustomization }: AdvancedSystemSettingsProps) {
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [dragMode, setDragMode] = useState(false);
  const [lockElements, setLockElements] = useState(false);

  const [themeSettings, setThemeSettings] = useState({
    primaryColor: "#3b82f6",
    secondaryColor: "#6366f1",
    backgroundColor: "#ffffff",
    textColor: "#1f2937",
    accentColor: "#f59e0b",
    borderRadius: "8",
    spacing: "medium",
    shadows: true,
    animations: true
  });

  const [elementPositions, setElementPositions] = useState({
    timer: { x: 24, y: 80, locked: false },
    settings: { x: 200, y: 24, locked: false },
    notifications: { x: 64, y: 16, locked: false },
    sidebar: { width: 256, collapsed: false, locked: false }
  });

  const handleColorChange = (property: string, value: string) => {
    setThemeSettings(prev => ({ ...prev, [property]: value }));
    // Apply theme changes to CSS variables
    document.documentElement.style.setProperty(`--${property}`, value);
  };

  const resetElementPositions = () => {
    setElementPositions({
      timer: { x: 24, y: 80, locked: false },
      settings: { x: 200, y: 24, locked: false },
      notifications: { x: 64, y: 16, locked: false },
      sidebar: { width: 256, collapsed: false, locked: false }
    });
  };

  const saveConfiguration = () => {
    localStorage.setItem('system-theme', JSON.stringify(themeSettings));
    localStorage.setItem('element-positions', JSON.stringify(elementPositions));
  };

  const loadConfiguration = () => {
    const savedTheme = localStorage.getItem('system-theme');
    const savedPositions = localStorage.getItem('element-positions');
    
    if (savedTheme) {
      setThemeSettings(JSON.parse(savedTheme));
    }
    if (savedPositions) {
      setElementPositions(JSON.parse(savedPositions));
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-2 mb-6">
        <Button variant="default" className="flex items-center gap-2">
          <Move className="w-4 h-4" />
          פריסה
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Palette className="w-4 h-4" />
          צבעים
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <Table className="w-4 h-4" />
          טבלאות
        </Button>
        <Button variant="outline" className="flex items-center gap-2">
          <FolderPlus className="w-4 h-4" />
          קבצים
        </Button>
      </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Grid className="w-5 h-5" />
                ניהול אלמנטים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 mb-4">
                <Button 
                  variant={dragMode ? "destructive" : "default"}
                  onClick={() => setDragMode(!dragMode)}
                  className="flex items-center gap-2"
                >
                  {dragMode ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                  {dragMode ? "נעל אלמנטים" : "אפשר גרירה"}
                </Button>
                <Button 
                  variant="outline"
                  onClick={resetElementPositions}
                  className="flex items-center gap-2"
                >
                  <RotateCcw className="w-4 h-4" />
                  איפוס מיקומים
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">⏱️ טיימר</Label>
                    <Button size="sm" variant="outline">
                      <Unlock className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><Label>X: 24</Label></div>
                    <div><Label>Y: 80</Label></div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">⚙️ הגדרות</Label>
                    <Button size="sm" variant="outline">
                      <Unlock className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><Label>X: 200</Label></div>
                    <div><Label>Y: 24</Label></div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">🔔 התראות</Label>
                    <Button size="sm" variant="outline">
                      <Unlock className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><Label>X: 64</Label></div>
                    <div><Label>Y: 16</Label></div>
                  </div>
                </Card>
                
                <Card className="p-3">
                  <div className="flex items-center justify-between mb-2">
                    <Label className="font-medium">📋 סרגל צד</Label>
                    <Button size="sm" variant="outline">
                      <Unlock className="w-3 h-3" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div><Label>רוחב: 256</Label></div>
                    <div><Label>מצב: רגיל</Label></div>
                  </div>
                </Card>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 hidden">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                עיצוב וצבעים
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>צבע ראשי</Label>
                  <Input 
                    type="color" 
                    value={themeSettings.primaryColor}
                    onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label>צבע משני</Label>
                  <Input 
                    type="color" 
                    value={themeSettings.secondaryColor}
                    onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label>רקע</Label>
                  <Input 
                    type="color" 
                    value={themeSettings.backgroundColor}
                    onChange={(e) => handleColorChange('backgroundColor', e.target.value)}
                    className="h-10"
                  />
                </div>
                <div>
                  <Label>טקסט</Label>
                  <Input 
                    type="color" 
                    value={themeSettings.textColor}
                    onChange={(e) => handleColorChange('textColor', e.target.value)}
                    className="h-10"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <div>
                  <Label>עגילות פינות</Label>
                  <Select value={themeSettings.borderRadius} onValueChange={(value) => setThemeSettings(prev => ({ ...prev, borderRadius: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="4">קטן (4px)</SelectItem>
                      <SelectItem value="8">בינוני (8px)</SelectItem>
                      <SelectItem value="12">גדול (12px)</SelectItem>
                      <SelectItem value="16">גדול מאוד (16px)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>ריווח</Label>
                  <Select value={themeSettings.spacing} onValueChange={(value) => setThemeSettings(prev => ({ ...prev, spacing: value }))}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="compact">דחוס</SelectItem>
                      <SelectItem value="medium">בינוני</SelectItem>
                      <SelectItem value="large">רחב</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <Label>צללים</Label>
                  <input
                    type="checkbox"
                    checked={themeSettings.shadows}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, shadows: e.target.checked }))}
                    className="rounded"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>אנימציות</Label>
                  <input
                    type="checkbox"
                    checked={themeSettings.animations}
                    onChange={(e) => setThemeSettings(prev => ({ ...prev, animations: e.target.checked }))}
                    className="rounded"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 hidden">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Table className="w-5 h-5" />
                הגדרות טבלאות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between">
                  <span>גבולות טבלה</span>
                  <input
                    type="checkbox"
                    checked={customization.showBorders}
                    onChange={(e) => updateCustomization({ showBorders: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>מצב קומפקטי</span>
                  <input
                    type="checkbox"
                    checked={customization.compact}
                    onChange={(e) => updateCustomization({ compact: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>כותרות דביקות</span>
                  <input
                    type="checkbox"
                    checked={customization.stickyHeaders}
                    onChange={(e) => updateCustomization({ stickyHeaders: e.target.checked })}
                    className="rounded"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <span>עמודה ראשונה דביקה</span>
                  <input
                    type="checkbox"
                    checked={customization.stickyFirstColumn}
                    onChange={(e) => updateCustomization({ stickyFirstColumn: e.target.checked })}
                    className="rounded"
                  />
                </div>
              </div>
              
              <div>
                <Label>שורות בעמוד</Label>
                <Select 
                  value={customization.rowsPerPage?.toString()} 
                  onValueChange={(value) => updateCustomization({ rowsPerPage: Number(value) })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="25">25</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5" />
                ניהול קבצים ותיקיות ללקוחות
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Button className="flex items-center gap-2 h-20 flex-col bg-blue-50 hover:bg-blue-100 border-blue-200">
                  <FolderPlus className="w-8 h-8 text-blue-600" />
                  <span className="text-blue-700 font-medium">יצירת תיקייה חדשה</span>
                </Button>
                <Button className="flex items-center gap-2 h-20 flex-col bg-green-50 hover:bg-green-100 border-green-200" variant="outline">
                  <FileText className="w-8 h-8 text-green-600" />
                  <span className="text-green-700 font-medium">העלאת קבצים</span>
                </Button>
              </div>

              <Separator />

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="font-semibold">סוגי תיקיות מומלצות</Label>
                  <Badge variant="outline">5 תיקיות</Badge>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {[
                    { name: 'מסמכים כלליים', icon: '📄', count: 12, color: 'bg-blue-50 text-blue-700' },
                    { name: 'חוזים ומסמכים משפטיים', icon: '⚖️', count: 8, color: 'bg-red-50 text-red-700' },
                    { name: 'תמונות ומדיה', icon: '🖼️', count: 25, color: 'bg-purple-50 text-purple-700' },
                    { name: 'דוחות ואנליטיקס', icon: '📊', count: 15, color: 'bg-green-50 text-green-700' },
                    { name: 'גיבויים', icon: '💾', count: 6, color: 'bg-gray-50 text-gray-700' }
                  ].map((folder, index) => (
                    <div key={index} className={`flex items-center justify-between p-3 rounded-lg ${folder.color} border`}>
                      <div className="flex items-center gap-3">
                        <span className="text-xl">{folder.icon}</span>
                        <span className="font-medium">{folder.name}</span>
                      </div>
                      <Badge variant="secondary" className="bg-white/50">
                        {folder.count} קבצים
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💡</span>
                  <span className="font-semibold text-amber-800">טיפ לניהול קבצים</span>
                </div>
                <p className="text-amber-700 text-sm">
                  כל לקוח יקבל תיקייה נפרדת עם מבנה מסודר של תת-תיקיות לניהול יעיל של המסמכים והקבצים שלו.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

      <Separator />

      <div className="flex items-center gap-4 justify-between">
        <div className="flex items-center gap-2">
          <Button onClick={saveConfiguration} className="flex items-center gap-2">
            <Save className="w-4 h-4" />
            שמור הגדרות
          </Button>
          <Button onClick={loadConfiguration} variant="outline" className="flex items-center gap-2">
            <Upload className="w-4 h-4" />
            טען הגדרות
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
          <Badge variant="secondary">תצוגה: {dragMode ? 'עריכה' : 'רגילה'}</Badge>
          <Badge variant={lockElements ? "destructive" : "default"}>
            {lockElements ? 'נעול' : 'פתוח'}
          </Badge>
        </div>
      </div>
    </div>
  );
}