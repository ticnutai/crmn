
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertClientSchema } from "@shared/schema";
import type { InsertClient, Client } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ClientFormProps {
  client?: Client;
  onSuccess?: () => void;
}

export default function ClientForm({ client, onSuccess }: ClientFormProps) {
  console.log('🚀 ClientForm component loaded', { client, onSuccess });
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!client;

  const form = useForm<InsertClient>({
    resolver: zodResolver(insertClientSchema.omit({ userId: true })),
    defaultValues: {
      name: client?.name || "",
      email: client?.email || "",
      phone: client?.phone || "",
      company: client?.company || "",
      position: client?.position || "",
      address: (client as any)?.address || "",
      price: (client as any)?.price || "",
      payment: (client as any)?.payment || "",
      status: client?.status || "active",
      notes: client?.notes || "",
    },
    mode: "onChange"
  });

  console.log('🔧 Form initialized');

  const createClient = useMutation({
    mutationFn: async (data: InsertClient) => {
      console.log('🔄 Sending data to server:', data);

      // קבל userId מהמשתמש הנוכחי
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userId = currentUser.id;
      
      if (!userId) {
        throw new Error("אין משתמש מחובר");
      }

      const res = await fetch("/api/clients", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userId}`,
          "x-user-id": userId
        },
        body: JSON.stringify(data)
      });

      if (!res.ok) {
        const errorText = await res.text();
        console.error('❌ Server error:', errorText);
        throw new Error(`Server error: ${res.status}`);
      }

      const result = await res.json();
      console.log('✅ Client created successfully:', result);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "לקוח נוסף בהצלחה",
        description: "פרטי הלקוח נשמרו במערכת",
      });
      form.reset();
      onSuccess?.();
    },
    onError: (error) => {
      toast({
        title: "שגיאה",
        description: `לא ניתן היה להוסיף את הלקוח: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateClient = useMutation({
    mutationFn: async (data: InsertClient) => {
      // קבל userId מהמשתמש הנוכחי
      const currentUser = JSON.parse(localStorage.getItem("currentUser") || "{}");
      const userId = currentUser.id;
      
      if (!userId) {
        throw new Error("אין משתמש מחובר");
      }

      const res = await fetch(`/api/clients/${client!.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${userId}`,
          "x-user-id": userId
        },
        body: JSON.stringify(data)
      });
      
      if (!res.ok) throw new Error('Update failed');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/clients", client!.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "לקוח עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לעדכן את הלקוח",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertClient) => {
    console.log('🚀 *** FORM SUBMIT TRIGGERED ***');
    console.log('📝 Data being submitted:', data);

    if (isEditing) {
      console.log('🔄 Updating client...');
      updateClient.mutate(data);
    } else {
      console.log('🔄 Creating new client...');
      createClient.mutate(data);
    }
  };

  const isLoading = createClient.isPending || updateClient.isPending;

  const handleSubmitClick = () => {
    console.log('🔥 Submit button clicked!');
    console.log('📋 Current form values:', form.getValues());
    console.log('✅ Form is valid:', form.formState.isValid);
    console.log('❌ Form errors:', form.formState.errors);
    
    // Force form submission
    form.handleSubmit(onSubmit)();
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "עריכת לקוח" : "הוספת לקוח חדש"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם מלא</FormLabel>
                    <FormControl>
                      <Input placeholder="הכנס שם מלא" {...field} />
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
                      <Input 
                        type="email" 
                        placeholder="example@domain.com" 
                        className="ltr" 
                        {...field} 
                        value={field.value || ""}
                      />
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
                    <FormLabel>מספר טלפון</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder="050-123-4567" 
                        className="ltr" 
                        {...field} 
                        value={field.value || ""}
                      />
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
                        <SelectItem value="pending">בהמתנה</SelectItem>
                      </SelectContent>
                    </Select>
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
                      <Input placeholder="שם החברה" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="position"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תפקיד</FormLabel>
                    <FormControl>
                      <Input placeholder="תפקיד בחברה" {...field} value={field.value || ""} />
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
                      <Input placeholder="כתובת מגורים או עסק" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>מחיר</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        placeholder="0.00" 
                        {...field} 
                        value={field.value || ""} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תשלום</FormLabel>
                    <FormControl>
                      <Input placeholder="אופן תשלום או הערות" {...field} value={field.value || ""} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>הערות</FormLabel>
                  <FormControl>
                    <Textarea placeholder="הערות נוספות על הלקוח..." rows={4} {...field} value={field.value || ""} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4 justify-center">
              <button 
                type="button"
                onClick={() => {
                  console.log('🎯 Plus button clicked!');
                  const formData = form.getValues();
                  console.log('📋 Form data:', formData);
                  
                  // Call onSubmit directly
                  onSubmit(formData);
                }}
                disabled={isLoading}
                className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white w-16 h-16 rounded-full flex items-center justify-center text-3xl font-bold shadow-lg transition-all duration-200 hover:scale-105"
              >
                {isLoading ? "⏳" : "+"}
              </button>
              
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  console.log('🔄 Reset button clicked');
                  form.reset();
                }}
              >
                איפוס
              </Button>
            </div>
          </div>
        </Form>
      </CardContent>
    </Card>
  );
}
