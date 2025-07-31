import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Edit, Trash2, Search, Shield, User as UserIcon, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import UserForm from "@/components/user-form";
import TableStyleSelector, { useTableStyle, getTableStyleClasses } from "@/components/table-style-selector";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";
import RolePermissionsManager from "@/components/role-permissions-manager";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function Users() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const { tableStyle, changeStyle } = useTableStyle();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery<User[]>({
    queryKey: ["/api/users"],
  });

  const deleteUser = useMutation({
    mutationFn: async (id: string) => {
      const res = await apiRequest(`/api/users/${id}`, "DELETE");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      toast({
        title: "משתמש נמחק בהצלחה",
        description: "המשתמש הוסר מהמערכת",
      });
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן היה למחוק את המשתמש",
        variant: "destructive",
      });
    },
  });

  const filteredUsers = users?.filter(user =>
    user.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const getRoleBadge = (role: string) => {
    const variants = {
      admin: "bg-red-100 text-red-800",
      manager: "bg-blue-100 text-blue-800",
      user: "bg-gray-100 text-gray-800",
    };
    
    const labels = {
      admin: "מנהל",
      manager: "מנהל צוות",
      user: "משתמש",
    };

    const icons = {
      admin: Shield,
      manager: UserIcon,
      user: UserIcon,
    };

    const Icon = icons[role as keyof typeof icons] || UserIcon;

    return (
      <Badge className={variants[role as keyof typeof variants] || variants.user}>
        <Icon className="w-3 h-3 ml-1" />
        {labels[role as keyof typeof labels] || role}
      </Badge>
    );
  };

  const formatDate = (date: Date | string) => {
    return new Intl.DateTimeFormat('he-IL').format(new Date(date));
  };

  const handleFormSuccess = () => {
    setIsFormOpen(false);
    setSelectedUser(null);
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">ניהול משתמשים והרשאות</h1>
          <p className="text-gray-600 mt-2">ניהול משתמשים והגדרת הרשאות במערכת</p>
        </div>
        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setSelectedUser(null)}>
              <Plus className="w-4 h-4 ml-2" />
              הוסף משתמש חדש
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedUser ? "עריכת משתמש" : "הוספת משתמש חדש"}</DialogTitle>
            </DialogHeader>
            <UserForm user={selectedUser || undefined} onSuccess={handleFormSuccess} />
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="users" className="flex items-center gap-2">
            <UserIcon className="w-4 h-4" />
            משתמשים
          </TabsTrigger>
          <TabsTrigger value="permissions" className="flex items-center gap-2">
            <Settings className="w-4 h-4" />
            הרשאות תפקידים
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users">
          <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>רשימת משתמשים</CardTitle>
            <div className="relative w-64">
              <Input
                placeholder="חיפוש משתמשים..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                  <Skeleton className="h-4 w-[100px]" />
                  <Skeleton className="h-8 w-[80px]" />
                </div>
              ))}
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">
                {searchQuery ? "לא נמצאו משתמשים התואמים לחיפוש" : "אין משתמשים במערכת"}
              </p>
              {!searchQuery && (
                <Button onClick={() => setIsFormOpen(true)}>
                  <Plus className="w-4 h-4 ml-2" />
                  הוסף משתמש ראשון
                </Button>
              )}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>שם המשתמש</TableHead>
                  <TableHead>שם משתמש</TableHead>
                  <TableHead>אימייל</TableHead>
                  <TableHead>תפקיד</TableHead>
                  <TableHead>תאריך הצטרפות</TableHead>
                  <TableHead>פעולות</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <UserIcon className="w-5 h-5 text-gray-600" />
                        </div>
                        <div>
                          <p className="font-medium">{user.fullName}</p>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="ltr">{user.username}</TableCell>
                    <TableCell className="ltr">{user.email}</TableCell>
                    <TableCell>{getRoleBadge(user.role)}</TableCell>
                    <TableCell>{formatDate(user.createdAt!)}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsFormOpen(true);
                          }}
                          title="עריכה"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" title="מחיקה">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>האם אתה בטוח?</AlertDialogTitle>
                              <AlertDialogDescription>
                                פעולה זו תמחק את המשתמש לצמיתות ולא ניתן יהיה לשחזר את הנתונים.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>ביטול</AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteUser.mutate(user.id)}
                                className="bg-red-600 hover:bg-red-700"
                              >
                                מחק
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          </CardContent>
        </Card>
        </TabsContent>

        <TabsContent value="permissions">
          <RolePermissionsManager />
        </TabsContent>
      </Tabs>
    </div>
  );
}
