import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Check, X, Edit } from "lucide-react";

interface SimpleEditableCellProps {
  value: string;
  onSave: (newValue: string) => void;
  placeholder?: string;
  type?: string;
}

export function SimpleEditableCell({ value, onSave, placeholder = "לחץ לעריכה", type = "text" }: SimpleEditableCellProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value);

  const handleSave = () => {
    onSave(editValue);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditValue(value);
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="flex items-center gap-2 w-full">
        <Input
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          className="h-8 text-sm border-2 border-blue-500 focus:border-blue-600"
          type={type}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault();
              handleSave();
            } else if (e.key === 'Escape') {
              handleCancel();
            }
          }}
          autoFocus
          placeholder="הזן ערך..."
        />
        <Button
          size="sm"
          variant="ghost"
          onClick={handleSave}
          className="h-8 w-8 p-0 text-green-600 hover:text-green-700"
        >
          <Check className="w-4 h-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={handleCancel}
          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    );
  }

  return (
    <div
      className="cursor-pointer hover:bg-blue-50 rounded px-2 py-1 group transition-all duration-200 min-h-[32px] flex items-center justify-between w-full"
      onClick={() => setIsEditing(true)}
      title="לחץ לעריכה"
    >
      <span className="text-sm font-medium text-gray-800 flex-1 truncate">
        {value || placeholder}
      </span>
      <Edit className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 flex-shrink-0" />
    </div>
  );
}