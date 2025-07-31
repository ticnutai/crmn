import { useState } from "react";
import { Edit3, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { TableColumn, TableCustomization } from "@/components/table-customizer";

interface InlineHeaderEditorProps {
  column: TableColumn;
  customization: TableCustomization;
  onCustomizationChange: (customization: TableCustomization) => void;
}

export default function InlineHeaderEditor({ 
  column, 
  customization, 
  onCustomizationChange 
}: InlineHeaderEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingLabel, setEditingLabel] = useState(column.customLabel || column.label);

  const handleSave = () => {
    if (!editingLabel.trim()) return;
    
    const updatedCustomization = {
      ...customization,
      columns: customization.columns.map(col =>
        col.id === column.id 
          ? { ...col, customLabel: editingLabel.trim() }
          : col
      )
    };
    
    onCustomizationChange(updatedCustomization);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditingLabel(column.customLabel || column.label);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSave();
    } else if (e.key === 'Escape') {
      handleCancel();
    }
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-1 w-full">
        <Input
          value={editingLabel}
          onChange={(e) => setEditingLabel(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-7 text-sm text-right"
          placeholder="שם העמודה"
          autoFocus
          onBlur={handleSave}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-6 w-6 p-0"
          title="שמור"
        >
          <Check className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-6 w-6 p-0"
          title="ביטול"
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between w-full group">
      <span className="text-right flex-1">{column.customLabel || column.label}</span>
      {!column.required && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0 ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={() => setIsEditing(true)}
          title="ערוך כותרת"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}