import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit3 } from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";
// תוו לטבלה מותאמת אישית 
interface TableColumn {
  id: string;
  label: string;
  field: string;
  visible: boolean;
  type?: string;
}

interface EditableCellProps {
  client: Client;
  column: TableColumn;
  value: any;
  onUpdate?: () => void;
}

export default function EditableCell({ client, column, value, onUpdate }: EditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || "");
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    setEditValue(value || "");
  }, [value]);

  const updateClient = useMutation({
    mutationFn: async (data: Partial<Client>) => {
      const res = await apiRequest(`/api/clients/${client.id}`, "PUT", data);
      return res.json();
    },
    onSuccess: (updatedClient) => {
      // Update the local state immediately
      setEditValue(updatedClient[column.field] || "");
      
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      queryClient.setQueryData(["/api/clients"], (oldData: Client[] | undefined) => {
        if (!oldData) return oldData;
        return oldData.map(c => c.id === client.id ? updatedClient : c);
      });
      // הסרת הודעות עדכון - רק לוג שקט
      
      setIsEditing(false);
      onUpdate?.();
    },
    onError: () => {
      toast({
        title: "שגיאה",
        description: "לא ניתן לעדכן את הנתונים",
        variant: "destructive",
      });
      setEditValue(value || "");
      setIsEditing(false);
    },
  });

  const handleSave = () => {
    if (editValue === value) {
      setIsEditing(false);
      return;
    }

    const updateData: any = {
      name: client.name,
      email: client.email || "",
      phone: client.phone || "", 
      company: client.company || "",
      position: client.position || "",
      address: client.address,
      price: client.price,
      payment: client.payment,
      status: client.status || "active",
      notes: client.notes || ""
    };
    
    updateData[column.field] = editValue;
    
    
    updateClient.mutate(updateData);
  };

  const handleCancel = () => {
    setEditValue(value || "");
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  const formatValue = (val: any) => {
    if (column.type === 'number' && val) {
      return parseFloat(val).toFixed(2);
    }
    return val || "";
  };

  if (column.type === 'custom' || column.id === 'select' || column.id === 'actions') {
    // Non-editable cells
    return <span className="text-foreground">{formatValue(value)}</span>;
  }

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm"
          type={column.type === 'number' ? 'number' : 'text'}
          step={column.type === 'number' ? '0.01' : undefined}
          autoFocus
          onBlur={() => {
            // Only save on blur if the value actually changed
            setTimeout(() => {
              if (document.activeElement?.tagName !== 'BUTTON') {
                handleSave();
              }
            }, 100);
          }}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-6 w-6 p-0"
          disabled={updateClient.isPending}
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-6 w-6 p-0"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div 
      className="flex items-center justify-between w-full group cursor-pointer hover:bg-muted/50 rounded px-2 py-1"
      onClick={() => setIsEditing(true)}
      title="לחץ לעריכה"
    >
      <span className="text-foreground font-medium flex-1 text-right">
        {column.type === 'number' && value ? `₪${formatValue(value)}` : formatValue(value)}
      </span>
      <Edit3 className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground" />
    </div>
  );
}