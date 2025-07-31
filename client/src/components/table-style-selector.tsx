import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table as TableIcon, Grid3X3, Rows3, LayoutGrid } from "lucide-react";

export type TableStyle = "default" | "bordered" | "minimal" | "cards";

interface TableStyleSelectorProps {
  currentStyle: TableStyle;
  onStyleChange: (style: TableStyle) => void;
}

export default function TableStyleSelector({ currentStyle, onStyleChange }: TableStyleSelectorProps) {
  const styles = [
    {
      value: "default" as TableStyle,
      label: "עיצוב רגיל",
      icon: TableIcon,
      description: "טבלה עם רקע משתנה"
    },
    {
      value: "bordered" as TableStyle,
      label: "עם גבולות",
      icon: Grid3X3,
      description: "טבלה עם קווים אופקים ואנכים"
    },
    {
      value: "minimal" as TableStyle,
      label: "מינימלי",
      icon: Rows3,
      description: "טבלה נקייה ללא גבולות"
    },
    {
      value: "cards" as TableStyle,
      label: "כרטיסים",
      icon: LayoutGrid,
      description: "עיצוב כרטיסים מודרני עם צללים"
    }
  ];

  const currentStyleData = styles.find(s => s.value === currentStyle);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" title="סגנון טבלה">
          {currentStyleData && <currentStyleData.icon className="w-4 h-4" />}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {styles.map((style) => (
          <DropdownMenuItem
            key={style.value}
            onClick={() => onStyleChange(style.value)}
            className={`flex items-center gap-2 cursor-pointer ${
              currentStyle === style.value ? 'bg-blue-50 text-blue-700' : ''
            }`}
          >
            <style.icon className="w-4 h-4" />
            <div className="text-right flex-1">
              <div className="font-medium">{style.label}</div>
              <div className="text-xs text-gray-500">{style.description}</div>
            </div>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// Hook לשמירת העדפת הסגנון
export function useTableStyle() {
  const [tableStyle, setTableStyle] = useState<TableStyle>(() => {
    const saved = localStorage.getItem('table-style');
    return (saved as TableStyle) || 'default';
  });

  const changeStyle = (style: TableStyle) => {
    setTableStyle(style);
    localStorage.setItem('table-style', style);
  };

  return { tableStyle, changeStyle };
}

// פונקציה לקבלת CSS classes בהתאם לסגנון
export function getTableStyleClasses(style: TableStyle) {
  switch (style) {
    case "bordered":
      return {
        container: "overflow-hidden rounded-lg border-2 border-gray-300 shadow-sm",
        table: "border-separate border-spacing-0",
        header: "bg-gray-100/90 border-b-2 border-gray-300",
        headerRow: "border-b-2 border-gray-300",
        headerCell: "border-l border-gray-300 first:border-l-0 font-semibold text-gray-700 py-4 px-6",
        bodyRow: "border-b border-gray-300 hover:bg-blue-50/50 transition-colors duration-200",
        bodyCell: "border-l border-gray-300 first:border-l-0 py-6 px-6"
      };
    case "minimal":
      return {
        container: "overflow-hidden",
        table: "",
        header: "bg-transparent",
        headerRow: "border-b border-gray-200",
        headerCell: "font-semibold text-gray-700 py-4 px-6 border-b-2 border-gray-200",
        bodyRow: "hover:bg-gray-50/50 transition-colors duration-200",
        bodyCell: "py-6 px-6"
      };
    default: // "default"
      return {
        container: "overflow-hidden rounded-lg border border-gray-200 shadow-sm",
        table: "",
        header: "bg-gray-50/80",
        headerRow: "border-b-2 border-gray-100 hover:bg-gray-50/80",
        headerCell: "font-semibold text-gray-700 py-4 px-6",
        bodyRow: (index: number) => `hover:bg-blue-50/50 transition-colors duration-200 border-b border-gray-100 ${
          index % 2 === 0 ? 'bg-white' : 'bg-gray-50/30'
        }`,
        bodyCell: "py-6 px-6"
      };
  }
}