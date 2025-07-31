import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Palette, Check } from "lucide-react";

export type TableTheme = "modern" | "classic" | "dark" | "colorful" | "minimal" | "luxury";

interface TableStyleThemesProps {
  currentTheme: TableTheme;
  onThemeChange: (theme: TableTheme) => void;
}

const themes = {
  modern: {
    name: "מודרני",
    description: "עיצוב נקי ומודרני",
    colors: {
      header: "bg-gradient-to-r from-blue-50 to-indigo-50 border-b-2 border-blue-200",
      headerText: "text-gray-900 font-semibold",
      row: "hover:bg-blue-50/50 border-b border-gray-100",
      cell: "text-gray-700",
      accent: "text-blue-600"
    }
  },
  classic: {
    name: "קלאסי",
    description: "עיצוב מסורתי ואלגנטי",
    colors: {
      header: "bg-gray-100 border-b border-gray-300",
      headerText: "text-gray-800 font-medium",
      row: "hover:bg-gray-50 border-b border-gray-200",
      cell: "text-gray-600",
      accent: "text-gray-700"
    }
  },
  dark: {
    name: "כהה",
    description: "מראה כהה ומסתורי",
    colors: {
      header: "bg-gray-800 border-b border-gray-600",
      headerText: "text-white font-semibold",
      row: "hover:bg-gray-800/50 border-b border-gray-700 bg-gray-900/30",
      cell: "text-gray-100",
      accent: "text-blue-400"
    }
  },
  colorful: {
    name: "צבעוני",
    description: "עיצוב חי וצבעוני",
    colors: {
      header: "bg-gradient-to-r from-purple-100 via-pink-100 to-orange-100 border-b-2 border-purple-300",
      headerText: "text-purple-900 font-bold",
      row: "hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 border-b border-purple-200",
      cell: "text-gray-700",
      accent: "text-purple-600"
    }
  },
  minimal: {
    name: "מינימלי",
    description: "פשוט וגרפי",
    colors: {
      header: "bg-white border-b border-gray-200",
      headerText: "text-gray-600 font-normal",
      row: "hover:bg-gray-25 border-b border-gray-100",
      cell: "text-gray-500",
      accent: "text-gray-700"
    }
  },
  luxury: {
    name: "יוקרתי",
    description: "מראה יוקרתי וזהוב",
    colors: {
      header: "bg-gradient-to-r from-amber-50 to-yellow-50 border-b-2 border-amber-200",
      headerText: "text-amber-900 font-bold",
      row: "hover:bg-amber-50/50 border-b border-amber-100",
      cell: "text-amber-800",
      accent: "text-amber-600"
    }
  }
};

export function TableStyleThemes({ currentTheme, onThemeChange }: TableStyleThemesProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Palette className="w-4 h-4" />
          {themes[currentTheme].name}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <div className="p-2">
          <h4 className="font-medium text-sm text-gray-900 mb-2">בחר עיצוב טבלה</h4>
          <div className="space-y-1">
            {Object.entries(themes).map(([key, theme]) => (
              <DropdownMenuItem
                key={key}
                onClick={() => onThemeChange(key as TableTheme)}
                className="cursor-pointer flex items-center justify-between p-3 rounded-lg hover:bg-gray-50"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{theme.name}</span>
                    {currentTheme === key && (
                      <Check className="w-4 h-4 text-green-600" />
                    )}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">{theme.description}</p>
                </div>
                <div className="flex gap-1 mr-2">
                  <div className={`w-3 h-3 rounded-full ${theme.colors.header.split(' ')[0]} border`}></div>
                  <div className={`w-3 h-3 rounded-full ${theme.colors.row.includes('bg-gray-800') ? 'bg-gray-800' : 'bg-white'} border`}></div>
                </div>
              </DropdownMenuItem>
            ))}
          </div>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function getThemeClasses(theme: TableTheme) {
  return themes[theme].colors;
}

export function useTableTheme() {
  const [currentTheme, setCurrentTheme] = useState<TableTheme>("modern");

  const changeTheme = (theme: TableTheme) => {
    setCurrentTheme(theme);
    localStorage.setItem("tableTheme", theme);
  };

  // Load theme from localStorage on component mount
  useState(() => {
    const savedTheme = localStorage.getItem("tableTheme") as TableTheme;
    if (savedTheme && themes[savedTheme]) {
      setCurrentTheme(savedTheme);
    }
  });

  return {
    currentTheme,
    changeTheme,
    themeClasses: getThemeClasses(currentTheme)
  };
}