import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileText, Plus, Send, Eye, Banknote, Calendar, User } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue';
  issueDate: string;
  dueDate: string;
  description?: string;
  createdAt: string;
}

interface Client {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  company?: string;
}

function InvoiceCreator({ onSuccess }: { onSuccess: () => void }) {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [amount, setAmount] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const createInvoiceMutation = useMutation({
    mutationFn: (invoiceData: any) => apiRequest("/api/invoices", "POST", invoiceData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "חשבונית נוצרה בהצלחה",
        description: "החשבונית נשמרה במערכת",
      });
      onSuccess();
    },
    onError: () => {
      toast({
        title: "שגיאה ביצירת חשבונית",
        description: "אנא נסה שוב",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = () => {
    if (!selectedClientId || !amount || !dueDate) {
      toast({
        title: "שגיאה",
        description: "אנא מלא את כל השדות הנדרשים",
        variant: "destructive",
      });
      return;
    }

    const invoiceNumber = `INV-${Date.now()}`;
    
    createInvoiceMutation.mutate({
      clientId: selectedClientId,
      invoiceNumber,
      amount: parseFloat(amount),
      currency: "ILS",
      status: "draft",
      issueDate: new Date().toISOString(),
      dueDate: new Date(dueDate).toISOString(),
      description: description || `חשבונית מספר ${invoiceNumber}`,
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="client">בחר לקוח</Label>
        <Select value={selectedClientId} onValueChange={setSelectedClientId}>
          <SelectTrigger>
            <SelectValue placeholder="בחר לקוח" />
          </SelectTrigger>
          <SelectContent>
            {clients.map((client) => (
              <SelectItem key={client.id} value={client.id}>
                {client.name} {client.company && `- ${client.company}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label htmlFor="amount">סכום (₪)</Label>
        <Input
          id="amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
        />
      </div>

      <div>
        <Label htmlFor="dueDate">תאריך תשלום</Label>
        <Input
          id="dueDate"
          type="date"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
        />
      </div>

      <div>
        <Label htmlFor="description">תיאור (אופציונלי)</Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="תיאור החשבונית..."
          rows={3}
        />
      </div>

      <Button 
        onClick={handleSubmit} 
        disabled={createInvoiceMutation.isPending}
        className="w-full bg-green-600 hover:bg-green-700"
      >
        {createInvoiceMutation.isPending ? "יוצר חשבונית..." : "צור חשבונית"}
      </Button>
    </div>
  );
}

export default function InvoicesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices = [], isLoading } = useQuery<Invoice[]>({
    queryKey: ["/api/invoices"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const updateInvoiceStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => 
      apiRequest(`/api/invoices/${id}`, "PATCH", { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/invoices"] });
      toast({
        title: "סטטוס עודכן",
        description: "סטטוס החשבונית עודכן בהצלחה",
      });
    },
  });

  const getClientName = (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    return client ? client.name : "לקוח לא ידוע";
  };

  const handleStatusChange = (invoiceId: string, newStatus: string) => {
    updateInvoiceStatusMutation.mutate({ id: invoiceId, status: newStatus });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft':
        return <Badge variant="secondary">טיוטה</Badge>;
      case 'sent':
        return <Badge variant="outline">נשלח</Badge>;
      case 'paid':
        return <Badge variant="default" className="bg-green-500">שולם</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Banknote className="w-8 h-8 text-green-600" />
          <div>
            <h1 className="text-3xl font-bold">חשבוניות</h1>
            <p className="text-gray-600">ניהול חשבוניות עם חשבונית ירוקה</p>
          </div>
        </div>

        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-green-600 hover:bg-green-700">
              <Plus className="w-4 h-4 ml-2" />
              חשבונית חדשה
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>יצירת חשבונית חדשה</DialogTitle>
            </DialogHeader>
            <InvoiceCreator onSuccess={() => setIsCreateDialogOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">סך חשבוניות</p>
                <p className="text-2xl font-bold">{invoices.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Send className="w-5 h-5 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">נשלחו</p>
                <p className="text-2xl font-bold">
                  {invoices.filter(inv => inv.status === 'sent').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">שולמו</p>
                <p className="text-2xl font-bold">
                  {invoices.filter(inv => inv.status === 'paid').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Eye className="w-5 h-5 text-gray-600" />
              <div>
                <p className="text-sm text-gray-600">טיוטות</p>
                <p className="text-2xl font-bold">
                  {invoices.filter(inv => inv.status === 'draft').length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Invoices List */}
      <Card>
        <CardHeader>
          <CardTitle>רשימת חשבוניות</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">טוען חשבוניות...</p>
            </div>
          ) : invoices.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">אין חשבוניות עדיין</h3>
              <p className="text-gray-500 mb-4">התחל ביצירת החשבונית הראשונה שלך</p>
              <Button 
                onClick={() => setIsCreateDialogOpen(true)}
                className="bg-green-600 hover:bg-green-700"
              >
                <Plus className="w-4 h-4 ml-2" />
                צור חשבונית ראשונה
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {invoices.map((invoice) => (
                <div key={invoice.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold">חשבונית #{invoice.invoiceNumber}</h3>
                        {getStatusBadge(invoice.status)}
                      </div>
                      <p className="text-gray-600">לקוח: {getClientName(invoice.clientId)}</p>
                      <p className="text-sm text-gray-500">
                        נוצר: {new Date(invoice.createdAt).toLocaleDateString('he-IL')} | 
                        תאריך תשלום: {new Date(invoice.dueDate).toLocaleDateString('he-IL')}
                      </p>
                      {invoice.description && (
                        <p className="text-sm text-gray-600 mt-1">{invoice.description}</p>
                      )}
                    </div>
                    
                    <div className="text-left">
                      <p className="text-2xl font-bold text-green-600">
                        ₪{invoice.amount.toFixed(2)}
                      </p>
                      <div className="flex gap-2 mt-2">
                        {invoice.status === 'draft' && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleStatusChange(invoice.id, 'sent')}
                            disabled={isLoading}
                          >
                            <Send className="w-3 h-3 ml-1" />
                            שלח
                          </Button>
                        )}
                        <Button size="sm" variant="outline">
                          <Eye className="w-3 h-3 ml-1" />
                          צפה
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}