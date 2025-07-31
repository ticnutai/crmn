import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import TableStyleSelector from "@/components/table-style-selector";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertPaymentStageSchema } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import type { PaymentStage, Client } from "@shared/schema";
import { z } from "zod";

const formSchema = insertPaymentStageSchema.extend({
  plannedAmount: z.string().transform((val) => val),
  paidAmount: z.string().transform((val) => val),
  dueDate: z.string().optional(),
  paidDate: z.string().optional(),
});

type FormData = z.infer<typeof formSchema>;

export default function PaymentStagesPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedClient, setSelectedClient] = useState<string>("all");
  const [tableStyle, setTableStyle] = useState(() => 
    localStorage.getItem("tableStyle") || "default"
  );
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [editingStage, setEditingStage] = useState<PaymentStage | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch payment stages
  const { data: paymentStages = [], isLoading: stagesLoading } = useQuery({
    queryKey: ["/api/payment-stages", selectedClient !== "all" ? selectedClient : undefined],
  });

  // Fetch clients for dropdown
  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      stageName: "",
      plannedAmount: "",
      paidAmount: "0",
      status: "pending",
      notes: "",
    },
  });

  // Create payment stage mutation
  const createMutation = useMutation({
    mutationFn: (data: FormData) => {
      const payload = {
        ...data,
        plannedAmount: data.plannedAmount,
        paidAmount: data.paidAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
      };
      return apiRequest("/api/payment-stages", "POST", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-stages"] });
      toast({ title: "שלב תשלום נוסף בהצלחה" });
      setIsAddDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "שגיאה", description: "לא ניתן להוסיף שלב תשלום", variant: "destructive" });
    },
  });

  // Update payment stage mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<FormData> }) => {
      const payload = {
        ...data,
        plannedAmount: data.plannedAmount,
        paidAmount: data.paidAmount,
        dueDate: data.dueDate ? new Date(data.dueDate) : null,
        paidDate: data.paidDate ? new Date(data.paidDate) : null,
      };
      return apiRequest(`/api/payment-stages/${id}`, "PUT", payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-stages"] });
      toast({ title: "שלב התשלום עודכן בהצלחה" });
      setEditingStage(null);
      form.reset();
    },
    onError: () => {
      toast({ title: "שגיאה", description: "לא ניתן לעדכן שלב תשלום", variant: "destructive" });
    },
  });

  // Delete payment stage mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => apiRequest(`/api/payment-stages/${id}`, "DELETE"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/payment-stages"] });
      toast({ title: "שלב התשלום נמחק בהצלחה" });
    },
    onError: () => {
      toast({ title: "שגיאה", description: "לא ניתן למחוק שלב תשלום", variant: "destructive" });
    },
  });

  const filteredStages = (paymentStages as (PaymentStage & { client?: Client })[]).filter((stage) => {
    const matchesSearch = 
      stage.stageName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (stage.client?.name || "").toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const onSubmit = (data: FormData) => {
    if (editingStage) {
      updateMutation.mutate({ id: editingStage.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (stage: PaymentStage) => {
    setEditingStage(stage);
    form.reset({
      clientId: stage.clientId,
      stageName: stage.stageName,
      plannedAmount: stage.plannedAmount.toString(),
      paidAmount: stage.paidAmount.toString(),
      status: stage.status as any,
      notes: stage.notes || "",
      dueDate: stage.dueDate ? format(new Date(stage.dueDate), "yyyy-MM-dd") : "",
      paidDate: stage.paidDate ? format(new Date(stage.paidDate), "yyyy-MM-dd") : "",
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: "ממתין", variant: "secondary" as const },
      partial: { label: "חלקי", variant: "outline" as const },
      paid: { label: "שולם", variant: "default" as const },
      overdue: { label: "פיגור", variant: "destructive" as const },
    };
    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  const calculateProgress = (paid: string, planned: string) => {
    const paidNum = parseFloat(paid) || 0;
    const plannedNum = parseFloat(planned) || 0;
    if (plannedNum === 0) return 0;
    return Math.min((paidNum / plannedNum) * 100, 100);
  };

  const getTableClasses = () => {
    switch (tableStyle) {
      case "bordered":
        return "border-collapse border border-border";
      case "minimal":
        return "border-collapse";
      case "cards":
        return "border-collapse w-full";
      default:
        return "border-collapse";
    }
  };

  const getRowClasses = (index: number) => {
    switch (tableStyle) {
      case "bordered":
        return "border border-border hover:bg-muted/50";
      case "minimal":
        return "hover:bg-muted/50";
      case "cards":
        return "mb-4 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow duration-200";
      default:
        return index % 2 === 0 ? "bg-muted/30 hover:bg-muted/50" : "hover:bg-muted/50";
    }
  };

  const getCellClasses = () => {
    switch (tableStyle) {
      case "bordered":
        return "border border-border px-4 py-3 text-right";
      case "minimal":
        return "px-4 py-3 text-right";
      case "cards":
        return "px-6 py-4 text-right border-b border-gray-100 dark:border-gray-700 last:border-b-0";
      default:
        return "px-4 py-3 text-right";
    }
  };

  if (stagesLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-muted rounded w-1/3 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 bg-background text-foreground rtl" dir="rtl">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-primary">שלבי תשלום</h1>
        <Dialog open={isAddDialogOpen || !!editingStage} onOpenChange={(open) => {
          if (!open) {
            setIsAddDialogOpen(false);
            setEditingStage(null);
            form.reset();
          }
        }}>
          <DialogTrigger asChild>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 ml-2" />
              הוסף שלב תשלום
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md" dir="rtl">
            <DialogHeader>
              <DialogTitle>{editingStage ? "ערוך שלב תשלום" : "הוסף שלב תשלום חדש"}</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="clientId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>לקוח</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="בחר לקוח" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {clients.map((client) => (
                            <SelectItem key={client.id} value={client.id}>
                              {client.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stageName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>שם השלב</FormLabel>
                      <FormControl>
                        <Input placeholder="למשל: מקדמה, תשלום ביניים, תשלום סופי" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="plannedAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סכום מתוכנן</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paidAmount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>סכום ששולם</FormLabel>
                        <FormControl>
                          <Input type="number" step="0.01" placeholder="0.00" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="dueDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תאריך יעד</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="paidDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>תאריך תשלום</FormLabel>
                        <FormControl>
                          <Input type="date" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>סטטוס</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="pending">ממתין</SelectItem>
                          <SelectItem value="partial">חלקי</SelectItem>
                          <SelectItem value="paid">שולם</SelectItem>
                          <SelectItem value="overdue">פיגור</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>הערות</FormLabel>
                      <FormControl>
                        <Textarea placeholder="הערות נוספות..." {...field} value={field.value || ""} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex gap-2 pt-4">
                  <Button 
                    type="submit" 
                    disabled={createMutation.isPending || updateMutation.isPending}
                    className="flex-1"
                  >
                    {editingStage ? "עדכן" : "הוסף"}
                  </Button>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setIsAddDialogOpen(false);
                      setEditingStage(null);
                      form.reset();
                    }}
                    className="flex-1"
                  >
                    ביטול
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">ניהול שלבי תשלום</CardTitle>
          <div className="flex gap-4 items-center flex-wrap">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="חיפוש שלבי תשלום..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pr-10"
              />
            </div>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">כל הלקוחות</SelectItem>
                {clients.map((client) => (
                  <SelectItem key={client.id} value={client.id}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <TableStyleSelector 
              currentStyle={tableStyle as any} 
              onStyleChange={(style) => {
                setTableStyle(style);
                localStorage.setItem("tableStyle", style);
              }} 
            />
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            {tableStyle === "cards" ? (
              <div className="space-y-4">
                {filteredStages.map((stage: PaymentStage & { client?: Client }, index: number) => {
                  const plannedAmount = parseFloat(stage.plannedAmount) || 0;
                  const paidAmount = parseFloat(stage.paidAmount) || 0;
                  const remaining = plannedAmount - paidAmount;
                  const progress = calculateProgress(stage.paidAmount, stage.plannedAmount);
                  
                  return (
                    <div key={stage.id} className={getRowClasses(index)}>
                      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 p-6">
                        {/* Header Row */}
                        <div className="md:col-span-3 lg:col-span-4 flex justify-between items-center border-b border-gray-200 dark:border-gray-700 pb-4">
                          <div className="flex items-center gap-4">
                            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                              {stage.stageName}
                            </h3>
                            {getStatusBadge(stage.status)}
                          </div>
                          <div className="flex gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleEdit(stage)}
                              className="h-8 w-8 p-0"
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => deleteMutation.mutate(stage.id)}
                              className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>

                        {/* Client Info */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">לקוח</h4>
                          <p className="text-base font-medium text-gray-900 dark:text-white">
                            {stage.client?.name || "לא זמין"}
                          </p>
                        </div>

                        {/* Financial Info */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">פרטים כספיים</h4>
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>מתוכנן:</span>
                              <span className="font-medium">₪{plannedAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>שולם:</span>
                              <span className="font-medium text-green-600">₪{paidAmount.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span>נותר:</span>
                              <span className={`font-medium ${remaining > 0 ? "text-orange-600" : "text-green-600"}`}>
                                ₪{remaining.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Progress */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">התקדמות</h4>
                          <div className="flex items-center gap-2">
                            <div className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-full h-3">
                              <div 
                                className="bg-blue-500 h-3 rounded-full transition-all duration-300" 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300 min-w-12">
                              {progress.toFixed(0)}%
                            </span>
                          </div>
                        </div>

                        {/* Dates */}
                        <div className="space-y-2">
                          <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400">תאריכים</h4>
                          <div className="space-y-1 text-sm">
                            <div className="flex justify-between">
                              <span>יעד:</span>
                              <span className="font-medium">
                                {stage.dueDate ? format(new Date(stage.dueDate), "dd/MM/yyyy", { locale: he }) : "-"}
                              </span>
                            </div>
                            {stage.paidDate && (
                              <div className="flex justify-between">
                                <span>שולם:</span>
                                <span className="font-medium text-green-600">
                                  {format(new Date(stage.paidDate), "dd/MM/yyyy", { locale: he })}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Notes */}
                        {stage.notes && (
                          <div className="md:col-span-3 lg:col-span-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                            <h4 className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-2">הערות</h4>
                            <p className="text-sm text-gray-700 dark:text-gray-300">{stage.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
                {filteredStages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-8">
                      {searchTerm ? "לא נמצאו שלבי תשלום התואמים לחיפוש" : "אין שלבי תשלום רשומים"}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                <table className={`w-full ${getTableClasses()}`}>
                  <thead>
                    <tr className={tableStyle === "bordered" ? "border border-border" : ""}>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>לקוח</th>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>שם השלב</th>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>תאריך יעד</th>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>סטטוס</th>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>סכום מתוכנן</th>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>סכום ששולם</th>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>נותר לשלם</th>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>התקדמות</th>
                      <th className={`${getCellClasses()} font-semibold bg-muted/50`}>פעולות</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredStages.map((stage: PaymentStage & { client?: Client }, index: number) => {
                      const plannedAmount = parseFloat(stage.plannedAmount) || 0;
                      const paidAmount = parseFloat(stage.paidAmount) || 0;
                      const remaining = plannedAmount - paidAmount;
                      const progress = calculateProgress(stage.paidAmount, stage.plannedAmount);
                      
                      return (
                        <tr key={stage.id} className={getRowClasses(index)}>
                          <td className={getCellClasses()}>
                            <span className="font-medium">{stage.client?.name || "לא זמין"}</span>
                          </td>
                          <td className={getCellClasses()}>
                            <span className="font-medium">{stage.stageName}</span>
                          </td>
                          <td className={getCellClasses()}>
                            {stage.dueDate ? format(new Date(stage.dueDate), "dd/MM/yyyy", { locale: he }) : "-"}
                          </td>
                          <td className={getCellClasses()}>{getStatusBadge(stage.status)}</td>
                          <td className={getCellClasses()}>
                            <span className="font-medium">₪{plannedAmount.toFixed(2)}</span>
                          </td>
                          <td className={getCellClasses()}>
                            <span className="font-medium text-green-600">₪{paidAmount.toFixed(2)}</span>
                          </td>
                          <td className={getCellClasses()}>
                            <span className={remaining > 0 ? "text-orange-600 font-medium" : "text-green-600 font-medium"}>
                              ₪{remaining.toFixed(2)}
                            </span>
                          </td>
                          <td className={getCellClasses()}>
                            <div className="flex items-center gap-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className="bg-primary h-2 rounded-full transition-all duration-300" 
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground min-w-12">
                                {progress.toFixed(0)}%
                              </span>
                            </div>
                          </td>
                          <td className={getCellClasses()}>
                            <div className="flex gap-1 justify-end">
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleEdit(stage)}
                                className="h-8 w-8 p-0"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => deleteMutation.mutate(stage.id)}
                                className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {filteredStages.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    {searchTerm ? "לא נמצאו שלבי תשלום התואמים לחיפוש" : "אין שלבי תשלום רשומים"}
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}