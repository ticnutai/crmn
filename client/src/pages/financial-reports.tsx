import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertExpenseSchema, type Invoice, type Expense, type InsertExpense } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Receipt, 
  Calculator,
  Upload,
  Plus,
  FileText,
  Calendar,
  Wallet
} from "lucide-react";
import { z } from "zod";

const expenseFormSchema = insertExpenseSchema.extend({
  receiptImage: z.string().optional(),
});

interface FinancialStats {
  totalIncome: number;
  totalVat: number;
  netIncome: number;
  totalExpenses: number;
  netProfit: number;
}

export default function FinancialReports() {
  const [isCreateExpenseOpen, setIsCreateExpenseOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // קבלת נתונים
  const { data: invoices = [] } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: expenses = [] } = useQuery<Expense[]>({
    queryKey: ["/api/expenses"],
  });

  // חישוב סטטיסטיקות כספיות
  const financialStats: FinancialStats = {
    totalIncome: invoices.reduce((sum, invoice) => {
      if (invoice.status === 'paid') {
        return sum + parseFloat(invoice.amount);
      }
      return sum;
    }, 0),
    totalVat: invoices.reduce((sum, invoice) => {
      if (invoice.status === 'paid') {
        const amount = parseFloat(invoice.amount);
        const vat = amount * 0.17; // 17% מע"מ
        return sum + vat;
      }
      return sum;
    }, 0),
    netIncome: 0, // יחושב אחר כך
    totalExpenses: expenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0),
    netProfit: 0, // יחושב אחר כך
  };

  financialStats.netIncome = financialStats.totalIncome - financialStats.totalVat;
  financialStats.netProfit = financialStats.netIncome - financialStats.totalExpenses;

  // טופס הוצאה חדשה
  const form = useForm<InsertExpense & { receiptImage?: string }>({
    resolver: zodResolver(expenseFormSchema),
    defaultValues: {
      expenseNumber: `EXP-${Date.now()}`,
      currency: "ILS",
      category: "",
      amount: "0",
      vatAmount: "0",
      isVatDeductible: true,
      status: "pending",
      expenseDate: new Date(),
    },
  });

  const createExpenseMutation = useMutation({
    mutationFn: async (data: InsertExpense) => {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create expense");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/expenses"] });
      toast({ title: "הוצאה נוספה בהצלחה" });
      setIsCreateExpenseOpen(false);
      form.reset();
    },
    onError: () => {
      toast({ title: "שגיאה ביצירת הוצאה", variant: "destructive" });
    },
  });

  const onSubmit = (data: InsertExpense & { receiptImage?: string }) => {
    const { receiptImage, ...expenseData } = data;
    createExpenseMutation.mutate({
      ...expenseData,
      receiptImage: receiptImage || undefined,
    });
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        form.setValue('receiptImage', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('he-IL', {
      style: 'currency',
      currency: 'ILS'
    }).format(amount);
  };

  return (
    <div className="container mx-auto p-6 space-y-6" dir="rtl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">דוחות כספיים</h1>
          <p className="text-gray-600">מעקב הכנסות, הוצאות ורווחיות</p>
        </div>
        
        <Dialog open={isCreateExpenseOpen} onOpenChange={setIsCreateExpenseOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700">
              <Plus className="w-4 h-4 ml-2" />
              הוצאה חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>הוספת הוצאה</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <Label>מספר הוצאה</Label>
                <Input {...form.register("expenseNumber")} />
              </div>
              
              <div>
                <Label>קטגוריה</Label>
                <Select value={form.watch("category")} onValueChange={(value) => form.setValue("category", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="בחר קטגוריה" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="office">משרד</SelectItem>
                    <SelectItem value="travel">נסיעות</SelectItem>
                    <SelectItem value="equipment">ציוד</SelectItem>
                    <SelectItem value="marketing">שיווק</SelectItem>
                    <SelectItem value="software">תוכנה</SelectItem>
                    <SelectItem value="other">אחר</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>ספק</Label>
                <Input {...form.register("supplier")} placeholder="שם הספק" />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>סכום</Label>
                  <Input {...form.register("amount")} type="number" step="0.01" />
                </div>
                <div>
                  <Label>מע"מ</Label>
                  <Input {...form.register("vatAmount")} type="number" step="0.01" />
                </div>
              </div>

              <div>
                <Label>תיאור</Label>
                <Textarea {...form.register("description")} />
              </div>

              <div>
                <Label>תאריך הוצאה</Label>
                <Input 
                  type="date" 
                  value={form.watch("expenseDate") ? new Date(form.watch("expenseDate") || new Date()).toISOString().split('T')[0] : ''}
                  onChange={(e) => form.setValue("expenseDate", new Date(e.target.value))}
                />
              </div>

              <div>
                <Label>העלאת קבלה</Label>
                <Input type="file" accept="image/*" onChange={handleImageUpload} />
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={createExpenseMutation.isPending}>
                  {createExpenseMutation.isPending ? "שומר..." : "שמור הוצאה"}
                </Button>
                <Button type="button" variant="outline" onClick={() => setIsCreateExpenseOpen(false)}>
                  ביטול
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* סטטיסטיקות עיקריות */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הכנסות</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {formatCurrency(financialStats.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">מע"מ</CardTitle>
            <Calculator className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">
              {formatCurrency(financialStats.totalVat)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">הכנסה נטו</CardTitle>
            <DollarSign className="h-4 w-4 text-indigo-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-indigo-600">
              {formatCurrency(financialStats.netIncome)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">סה"כ הוצאות</CardTitle>
            <TrendingDown className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {formatCurrency(financialStats.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">רווח נטו</CardTitle>
            <Wallet className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${financialStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {formatCurrency(financialStats.netProfit)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* טאבים לצפייה מפורטת */}
      <Tabs defaultValue="invoices" className="space-y-4">
        <TabsList>
          <TabsTrigger value="invoices">חשבוניות</TabsTrigger>
          <TabsTrigger value="expenses">הוצאות</TabsTrigger>
          <TabsTrigger value="summary">סיכום חודשי</TabsTrigger>
        </TabsList>

        <TabsContent value="invoices" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>חשבוניות שולמו</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {invoices.filter(inv => inv.status === 'paid').map((invoice) => (
                  <div key={invoice.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">חשבונית #{invoice.invoiceNumber}</div>
                      <div className="text-sm text-gray-500">
                        {invoice.createdAt ? new Date(invoice.createdAt).toLocaleDateString('he-IL') : "לא זמין"}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-green-600">
                        {formatCurrency(parseFloat(invoice.amount))}
                      </div>
                      <div className="text-sm text-gray-500">
                        מע"מ: {formatCurrency(parseFloat(invoice.amount) * 0.17)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="expenses" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>הוצאות</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {expenses.map((expense) => (
                  <div key={expense.id} className="flex items-center justify-between p-3 border rounded">
                    <div>
                      <div className="font-medium">{expense.supplier}</div>
                      <div className="text-sm text-gray-500">{expense.category}</div>
                      <div className="text-sm text-gray-500">
                        {new Date(expense.expenseDate).toLocaleDateString('he-IL')}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="font-bold text-red-600">
                        {formatCurrency(parseFloat(expense.amount))}
                      </div>
                      {expense.receiptImage && (
                        <Badge variant="outline" className="text-xs">
                          <Receipt className="w-3 h-3 ml-1" />
                          קבלה
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="summary" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>סיכום כספי</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                  <span>סה"כ הכנסות (כולל מע"מ)</span>
                  <span className="font-bold text-green-600">
                    {formatCurrency(financialStats.totalIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                  <span>מע"מ לתשלום</span>
                  <span className="font-bold text-blue-600">
                    {formatCurrency(financialStats.totalVat)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-indigo-50 rounded">
                  <span>הכנסה נטו (ללא מע"מ)</span>
                  <span className="font-bold text-indigo-600">
                    {formatCurrency(financialStats.netIncome)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-red-50 rounded">
                  <span>סה"כ הוצאות</span>
                  <span className="font-bold text-red-600">
                    {formatCurrency(financialStats.totalExpenses)}
                  </span>
                </div>
                <div className="flex justify-between items-center p-3 bg-purple-50 rounded border-2 border-purple-200">
                  <span className="font-semibold">רווח/הפסד נטו</span>
                  <span className={`font-bold text-xl ${financialStats.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {formatCurrency(financialStats.netProfit)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}