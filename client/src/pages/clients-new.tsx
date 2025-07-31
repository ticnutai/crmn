import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Plus, Database } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Client, TimeEntry } from "@shared/schema";
import { ModernTable } from "@/components/modern-table";

// Schema for form validation
const addClientSchema = z.object({
  name: z.string().min(1, "שם הלקוח נדרש"),
  email: z.string().email("כתובת אימייל לא תקינה").optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  company: z.string().optional(),
  status: z.enum(["active", "inactive", "pending"]).default("active"),
});

type AddClientForm = z.infer<typeof addClientSchema>;

export default function ClientsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedClients, setSelectedClients] = useState<string[]>([]);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<AddClientForm>({
    resolver: zodResolver(addClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      address: "",
      company: "",
      status: "active",
    },
  });

  const { data: clients = [], isLoading } = useQuery<Client[]>({
    queryKey: ['/api/clients'],
    staleTime: 30000, // הנתונים נחשבים טריים למשך 30 שניות
    refetchInterval: 60000, // רענון רק כל דקה
    refetchOnWindowFocus: false, // ביטול רענון כשחוזרים לחלון
  });

  const filteredClients = clients.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.phone || '').includes(searchQuery)
  );

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

  const handleEditClient = (client: Client) => {
    
    toast({
      title: "עריכת לקוח",
      description: `נפתח עורך לקוח ${client.name}`,
    });
  };

  const handleDeleteClient = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    
    toast({
      title: "מחיקת לקוח",
      description: `נמחק לקוח ${client?.name}`,
      variant: "destructive",
    });
  };

  const addClientMutation = useMutation({
    mutationFn: async (data: AddClientForm) => {
      const response = await fetch('/api/clients', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy-token',
          'x-user': 'mali.f.arch2@gmail.com'
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to create client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      setShowAddDialog(false);
      form.reset();
      toast({
        title: "הצלחה!",
        description: "הלקוח נוסף בהצלחה למערכת",
      });
    },
    onError: (error) => {
      toast({
        title: "שגיאה",
        description: "לא ניתן להוסיף את הלקוח. נסה שוב.",
        variant: "destructive",
      });
    },
  });

  const handleAddClient = () => {
    setShowAddDialog(true);
  };

  const onSubmit = (data: AddClientForm) => {
    addClientMutation.mutate(data);
  };

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<Client> }) => {
      const response = await fetch(`/api/clients/${id}`, {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy-token',
          'x-user': 'mali.f.arch2@gmail.com'
        },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error('Failed to update client');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/clients'] });
      // הסרת הודעות עדכון - רק לוג שקט
      
    },
    onError: () => {
      toast({
        title: "שגיאה בעדכון",
        description: "לא ניתן לשמור את השינויים",
        variant: "destructive",
      });
    },
  });

  const handleUpdateClient = (clientId: string, field: string, value: string) => {
    
    updateClientMutation.mutate({ 
      id: clientId, 
      data: { [field]: value } 
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-700">טוען נתונים...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול לקוחות מודרני</h1>
          <p className="text-gray-600 mt-2">מערכת טבלאות חדשה עם הוספת עמודות</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Database className="w-4 h-4 ml-2" />
            ייבוא/ייצוא
          </Button>
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button onClick={handleAddClient}>
                <Plus className="w-4 h-4 ml-2" />
                הוסף לקוח
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md" dir="rtl">
              <DialogHeader>
                <DialogTitle className="text-right">הוספת לקוח חדש</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>שם הלקוח *</FormLabel>
                        <FormControl>
                          <Input placeholder="הכנס שם הלקוח" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>כתובת אימייל</FormLabel>
                        <FormControl>
                          <Input type="email" placeholder="example@email.com" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>טלפון</FormLabel>
                        <FormControl>
                          <Input placeholder="050-1234567" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="company"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>חברה</FormLabel>
                        <FormControl>
                          <Input placeholder="שם החברה" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>כתובת</FormLabel>
                        <FormControl>
                          <Input placeholder="רחוב, עיר" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="status"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סטטוס</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="בחר סטטוס" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="active">פעיל</SelectItem>
                            <SelectItem value="inactive">לא פעיל</SelectItem>
                            <SelectItem value="pending">ממתין</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setShowAddDialog(false)}
                    >
                      ביטול
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={addClientMutation.isPending}
                    >
                      {addClientMutation.isPending ? "שומר..." : "שמור לקוח"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Table Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>רשימת לקוחות ({filteredClients.length})</CardTitle>
            <div className="flex items-center gap-3">
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
          {filteredClients.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery ? "לא נמצאו לקוחות התואמים לחיפוש" : "אין לקוחות במערכת"}
              </p>
            </div>
          ) : (
            <ModernTable
              clients={filteredClients}
              selectedClients={selectedClients}
              onSelectClient={handleSelectClient}
              onSelectAll={handleSelectAll}
              onEditClient={handleEditClient}
              onDeleteClient={handleDeleteClient}
              onAddClient={handleAddClient}
              onUpdateClient={handleUpdateClient}
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}