import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Plus, FileText, UserPlus, Database } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { insertClientSchema, insertBackupSchema } from "@shared/schema";
import { z } from "zod";

interface SettingsPanelProps {
  currentTheme: string;
  onThemeChange: (theme: "theme-default" | "theme-luxury-gold" | "theme-elegant-dark") => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

const clientFormSchema = insertClientSchema.extend({
  createdAt: z.string().optional(),
});

const backupFormSchema = insertBackupSchema.extend({
  createdAt: z.string().optional(),
});

export default function SettingsPanel({ currentTheme, onThemeChange, isOpen, onOpenChange }: SettingsPanelProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isClientDialogOpen, setIsClientDialogOpen] = useState(false);
  const [isBackupDialogOpen, setIsBackupDialogOpen] = useState(false);

  // Client form
  const clientForm = useForm<z.infer<typeof clientFormSchema>>({
    resolver: zodResolver(clientFormSchema),
    defaultValues: {
      name: "",
      email: "",  
      phone: "",
      company: "",
      position: "",
      status: "active",
      notes: "",
    },
  });

  // Backup form  
  const backupForm = useForm<z.infer<typeof backupFormSchema>>({
    resolver: zodResolver(backupFormSchema),
    defaultValues: {
      filename: "",
      size: 0,
      status: "pending",
    },
  });

  // Create client mutation
  const createClientMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/clients", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsClientDialogOpen(false);
      clientForm.reset();
      toast({
        title: "לקוח נוצר בהצלחה",
        description: "הלקוח נוסף למערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור את הלקוח",
        variant: "destructive",
      });
    },
  });

  // Create backup mutation
  const createBackupMutation = useMutation({
    mutationFn: (data: any) => apiRequest("/api/backups", "POST", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/backups"] });
      setIsBackupDialogOpen(false);
      backupForm.reset();
      toast({
        title: "גיבוי נוצר בהצלחה", 
        description: "הגיבוי נוסף למערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן ליצור את הגיבוי",
        variant: "destructive",
      });
    },
  });

  const onClientSubmit = (values: z.infer<typeof clientFormSchema>) => {
    createClientMutation.mutate(values);
  };

  const onBackupSubmit = (values: z.infer<typeof backupFormSchema>) => {
    createBackupMutation.mutate(values);
  };

  const themes = [
    {
      id: "theme-default",
      name: "ברירת מחדל",
      description: "כחול ופרפל קלאסי",
      gradient: "bg-gradient-to-r from-blue-500 to-purple-600",
    },
    {
      id: "theme-luxury-gold",
      name: "זהב יוקרתי",
      description: "גוונים של זהב וכתום",
      gradient: "bg-gradient-to-r from-yellow-500 to-orange-600",
    },
    {
      id: "theme-elegant-dark",
      name: "אפור אלגנטי",
      description: "גוונים של אפור ועיצוב מינימליסטי",
      gradient: "bg-gradient-to-r from-gray-500 to-gray-700",
    },
  ];

  const handleThemeChange = (themeId: string) => {
    onThemeChange(themeId as "theme-default" | "theme-luxury-gold" | "theme-elegant-dark");
    toast({
      title: "נושא העיצוב שונה בהצלחה",
      description: "השינויים יוחלו על כל המערכת",
    });
  };

  const handleSaveSettings = () => {
    toast({
      title: "הגדרות נשמרו",
      description: "כל השינויים נשמרו בהצלחה",
    });
    onOpenChange(false);
  };

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      <SheetContent side="left" className="w-80 overflow-y-auto">
        <SheetHeader>
          <SheetTitle>הגדרות מערכת</SheetTitle>
        </SheetHeader>
        
        <div className="space-y-6 mt-6">
          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>פעילויות מהירות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Dialog open={isClientDialogOpen} onOpenChange={setIsClientDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <UserPlus className="w-4 h-4" />
                    הוסף לקוח חדש
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>הוסף לקוח חדש</DialogTitle>
                  </DialogHeader>
                  <Form {...clientForm}>
                    <form onSubmit={clientForm.handleSubmit(onClientSubmit)} className="space-y-4">
                      <FormField
                        control={clientForm.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם מלא</FormLabel>
                            <FormControl>
                              <Input placeholder="שם הלקוח" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clientForm.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>אימייל</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clientForm.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>טלפון</FormLabel>
                            <FormControl>
                              <Input placeholder="050-123-4567" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={clientForm.control}
                        name="company"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>חברה</FormLabel>
                            <FormControl>
                              <Input placeholder="שם החברה" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={createClientMutation.isPending} className="flex-1">
                          {createClientMutation.isPending ? "יוצר..." : "צור לקוח"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsClientDialogOpen(false)}>
                          ביטול
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Button className="w-full justify-start gap-2" variant="outline">
                <FileText className="w-4 h-4" />
                צור דוח חדש
              </Button>

              <Dialog open={isBackupDialogOpen} onOpenChange={setIsBackupDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="w-full justify-start gap-2" variant="outline">
                    <Database className="w-4 h-4" />
                    יצירת גיבוי
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>יצירת גיבוי חדש</DialogTitle>
                  </DialogHeader>
                  <Form {...backupForm}>
                    <form onSubmit={backupForm.handleSubmit(onBackupSubmit)} className="space-y-4">
                      <FormField
                        control={backupForm.control}
                        name="filename"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>שם הגיבוי</FormLabel>
                            <FormControl>
                              <Input placeholder="גיבוי יומי" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={backupForm.control}
                        name="size"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>גודל (בייטים)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="1000000" {...field} value={field.value || 0} onChange={(e) => field.onChange(parseInt(e.target.value) || 0)} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <div className="flex gap-3 pt-4">
                        <Button type="submit" disabled={createBackupMutation.isPending} className="flex-1">
                          {createBackupMutation.isPending ? "יוצר..." : "צור גיבוי"}
                        </Button>
                        <Button type="button" variant="outline" onClick={() => setIsBackupDialogOpen(false)}>
                          ביטול
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </CardContent>
          </Card>

          {/* Theme Selection */}
          <Card>
            <CardHeader>
              <CardTitle>נושא עיצוב</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {themes.map((theme) => (
                <div
                  key={theme.id}
                  className={`flex items-center gap-3 p-3 border rounded-lg hover:bg-gray-50 cursor-pointer ${
                    currentTheme === theme.id ? "border-blue-500 bg-blue-50" : "border-gray-200"
                  }`}
                  onClick={() => handleThemeChange(theme.id)}
                >
                  <div className={`w-6 h-6 rounded-full ${theme.gradient}`}></div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{theme.name}</p>
                    <p className="text-sm text-gray-500">{theme.description}</p>
                  </div>
                  <input
                    type="radio"
                    name="theme"
                    checked={currentTheme === theme.id}
                    onChange={() => handleThemeChange(theme.id)}
                    className="text-blue-600"
                  />
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Auto Backup Settings */}
          <Card>
            <CardHeader>
              <CardTitle>גיבוי אוטומטי</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">הפעל גיבוי אוטומטי</label>
                <Checkbox defaultChecked />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">תדירות גיבוי</label>
                <Select defaultValue="weekly">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">יומית</SelectItem>
                    <SelectItem value="weekly">שבועית</SelectItem>
                    <SelectItem value="monthly">חודשית</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-700">שמור גיבויים מקומיים</label>
                <Checkbox />
              </div>
            </CardContent>
          </Card>

          {/* System Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>העדפות מערכת</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">התראות דוא״ל</label>
                <Checkbox defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-700">התראות דחיפה</label>
                <Checkbox defaultChecked />
              </div>
              <div>
                <label className="block text-gray-700 mb-2">שפה</label>
                <Select defaultValue="he">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="he">עברית</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">العربية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Data & Privacy */}
          <Card>
            <CardHeader>
              <CardTitle>נתונים ופרטיות</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-gray-700">שתף נתוני שימוש אנונימיים</label>
                <Checkbox />
              </div>
              <div className="flex items-center justify-between">
                <label className="text-gray-700">שמור היסטוריית פעילות</label>
                <Checkbox defaultChecked />
              </div>
              <Button variant="outline" className="w-full">
                ייצא נתונים אישיים
              </Button>
              <Button variant="destructive" className="w-full">
                מחק את כל הנתונים
              </Button>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="pt-4">
            <Button onClick={handleSaveSettings} className="w-full">
              שמור הגדרות
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}