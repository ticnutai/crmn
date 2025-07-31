import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { insertUserSchema } from "@shared/schema";
import type { InsertUser, User } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface UserFormProps {
  user?: User;
  onSuccess?: () => void;
}

export default function UserForm({ user, onSuccess }: UserFormProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!user;

  const form = useForm<InsertUser>({
    resolver: zodResolver(insertUserSchema),
    defaultValues: {
      username: user?.username || "",
      password: "",
      email: user?.email || "",
      fullName: user?.fullName || "",
      role: user?.role || "user",
      notes: user?.notes || "",
    },
  });

  const createUser = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest("/api/users", "POST", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "משתמש נוסף בהצלחה",
        description: "פרטי המשתמש נשמרו במערכת",
      });
      form.reset();
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה להוסיף את המשתמש",
        variant: "destructive",
      });
    },
  });

  const updateUser = useMutation({
    mutationFn: async (data: InsertUser) => {
      const res = await apiRequest(`/api/users/${user!.id}`, "PUT", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user!.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "משתמש עודכן בהצלחה",
        description: "השינויים נשמרו במערכת",
      });
      onSuccess?.();
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה לעדכן את המשתמש",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: InsertUser) => {
    if (isEditing) {
      updateUser.mutate(data);
    } else {
      createUser.mutate(data);
    }
  };

  const isLoading = createUser.isPending || updateUser.isPending;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEditing ? "עריכת משתמש" : "הוספת משתמש חדש"}</CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="fullName"
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
                name="username"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>שם משתמש</FormLabel>
                    <FormControl>
                      <Input placeholder="שם משתמש ייחודי" className="ltr" {...field} />
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
                      <Input type="email" placeholder="example@domain.com" className="ltr" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>תפקיד</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="בחר תפקיד" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="user">משתמש</SelectItem>
                        <SelectItem value="admin">מנהל</SelectItem>
                        <SelectItem value="manager">מנהל צוות</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{isEditing ? "סיסמה חדשה (אופציונלי)" : "סיסמה"}</FormLabel>
                    <FormControl>
                      <Input 
                        type="password" 
                        placeholder={isEditing ? "השאר ריק לשמירת הסיסמה הנוכחית" : "הכנס סיסמה"}
                        className="ltr"
                        {...field} 
                      />
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
                    <Textarea 
                      placeholder="הערות נוספות על המשתמש..."
                      className="min-h-[100px]"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "שומר..." : isEditing ? "עדכן משתמש" : "הוסף משתמש"}
              </Button>
              <Button type="button" variant="outline" onClick={() => form.reset()}>
                איפוס
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
