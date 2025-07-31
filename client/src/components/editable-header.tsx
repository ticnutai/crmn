import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit3 } from "lucide-react";
import type { TableColumn } from "./table-customizer";

interface EditableHeaderProps {
  column: TableColumn;
  onUpdate: (columnId: string, newLabel: string) => void;
}

export default function EditableHeader({ column, onUpdate }: EditableHeaderProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(column.label);

  useEffect(() => {
    setEditValue(column.label);
  }, [column.label]);

  if (column.required || column.id === 'select' || column.id === 'actions') {
    // Non-editable headers for required columns
    return <span className="font-semibold">{column.label}</span>;
  }

  const handleSave = () => {
    if (editValue.trim() && editValue !== column.label) {
      onUpdate(column.id, editValue.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(column.label);
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
      <div className="flex items-center gap-1 w-full" onClick={(e) => e.stopPropagation()}>
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="h-8 text-sm font-semibold"
          autoFocus
          onBlur={handleSave}
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-6 w-6 p-0"
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
      className="flex items-center justify-between w-full group cursor-pointer hover:bg-muted/30 rounded px-1 py-1"
      onClick={() => setIsEditing(true)}
      title="לחץ לעריכת כותרת"
    >
      <span className="flex-1 font-semibold">
        {column.label}
      </span>
      <Button
        variant="ghost"
        size="sm"
        className="h-4 w-4 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
        onClick={(e) => {
          e.stopPropagation();
          setIsEditing(true);
        }}
      >
        <Edit3 className="h-3 w-3" />
      </Button>
    </div>
  );
}