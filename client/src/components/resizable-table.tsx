import { useState, useRef, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { GripVertical, GripHorizontal } from "lucide-react";

interface ResizableTableProps {
  children: React.ReactNode;
  columns?: string[];
  onColumnResize?: (columnIndex: number, newWidth: number) => void;
  onRowResize?: (rowIndex: number, newHeight: number) => void;
}

export default function ResizableTable({ 
  children, 
  columns = [], 
  onColumnResize,
  onRowResize 
}: ResizableTableProps) {
  const [columnWidths, setColumnWidths] = useState<number[]>([]);
  const [rowHeights, setRowHeights] = useState<number[]>([]);
  const [isResizing, setIsResizing] = useState(false);
  const [resizeInfo, setResizeInfo] = useState<{
    type: 'column' | 'row';
    index: number;
    startPos: number;
    startSize: number;
  } | null>(null);

  const tableRef = useRef<HTMLTableElement>(null);

  // Initialize default column widths
  useEffect(() => {
    if (columns.length > 0 && columnWidths.length === 0) {
      setColumnWidths(new Array(columns.length).fill(150));
    }
  }, [columns]);

  const handleMouseDown = (
    e: React.MouseEvent,
    type: 'column' | 'row',
    index: number
  ) => {
    e.preventDefault();
    setIsResizing(true);
    
    const startPos = type === 'column' ? e.clientX : e.clientY;
    const startSize = type === 'column' 
      ? columnWidths[index] || 150
      : rowHeights[index] || 40;

    setResizeInfo({
      type,
      index,
      startPos,
      startSize
    });

    // Add global mouse event listeners
    const handleMouseMove = (e: MouseEvent) => {
      if (!resizeInfo) return;

      const currentPos = type === 'column' ? e.clientX : e.clientY;
      const diff = currentPos - startPos;
      const newSize = Math.max(50, startSize + diff); // Minimum size of 50px

      if (type === 'column') {
        const newWidths = [...columnWidths];
        newWidths[index] = newSize;
        setColumnWidths(newWidths);
        onColumnResize?.(index, newSize);
      } else {
        const newHeights = [...rowHeights];
        newHeights[index] = newSize;
        setRowHeights(newHeights);
        onRowResize?.(index, newSize);
      }
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      setResizeInfo(null);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <div className="relative overflow-auto">
      <div className="mb-3 text-sm bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg border border-blue-200">
        <div className="flex items-center gap-2 text-blue-700 font-semibold mb-1">
          <GripVertical className="w-4 h-4" />
          <span>ידיות הגרירה המתקדמות</span>
        </div>
        <div className="text-blue-600 text-xs space-y-1">
          <div>• <strong>גרור קווים כחולים</strong> בין עמודות לשינוי רוחב</div>
          <div>• <strong>גרור תחתית שורות</strong> לשינוי גובה</div>
          <div>• <strong>לחיצה כפולה</strong> על גבול לאיפוס גודל אוטומטי</div>
        </div>
      </div>
      <style>
        {`
          .resizable-table th,
          .resizable-table td {
            position: relative;
            border-right: 2px solid #3b82f6;
            border-bottom: 2px solid #3b82f6;
          }
          
          .resize-handle-vertical {
            position: absolute;
            top: 0;
            right: -3px;
            width: 6px;
            height: 100%;
            cursor: col-resize;
            background: linear-gradient(90deg, transparent, #3b82f6, transparent);
            z-index: 10;
            opacity: 0.3;
            transition: all 0.2s ease;
          }
          
          .resize-handle-vertical:hover {
            background: #3b82f6;
            opacity: 0.8;
            width: 8px;
            right: -4px;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
          }
          
          .resize-handle-horizontal {
            position: absolute;
            bottom: -3px;
            left: 0;
            width: 100%;
            height: 6px;
            cursor: row-resize;
            background: linear-gradient(180deg, transparent, #3b82f6, transparent);
            z-index: 10;
            opacity: 0.3;
            transition: all 0.2s ease;
          }
          
          .resize-handle-horizontal:hover {
            background: #3b82f6;
            opacity: 0.8;
            height: 8px;
            bottom: -4px;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.4);
          }
          
          .resizing {
            user-select: none;
          }
        `}
      </style>
      
      <div className={`relative ${isResizing ? 'resizing' : ''}`}>
        <Table ref={tableRef} className="resizable-table">
          <TableHeader>
            <TableRow>
              {columns.map((column, index) => (
                <TableHead 
                  key={index}
                  style={{ 
                    width: columnWidths[index] || 150,
                    minWidth: 50,
                    position: 'relative'
                  }}
                >
                  <div className="flex items-center justify-between">
                    <span>{column}</span>
                    <GripVertical className="w-3 h-3 text-gray-400 opacity-50" />
                  </div>
                  
                  {/* Column resize handle */}
                  <div
                    className="resize-handle-vertical"
                    onMouseDown={(e) => handleMouseDown(e, 'column', index)}
                    onDoubleClick={() => {
                      // Reset to auto width
                      const newWidths = [...columnWidths];
                      newWidths[index] = 150; // default width
                      setColumnWidths(newWidths);
                      onColumnResize?.(index, 150);
                    }}
                    title="גרור לשינוי רוחב | לחיצה כפולה לאיפוס"
                  />
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          
          <TableBody>
            {children}
          </TableBody>
        </Table>
        
        {/* Enhanced Global resize indicator */}
        {isResizing && (
          <div className="fixed inset-0 z-50 bg-blue-500/10 pointer-events-none">
            <div className="fixed top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm flex items-center gap-2">
              {resizeInfo?.type === 'column' ? (
                <><GripVertical className="w-4 h-4" /> משנה רוחב עמודה {(resizeInfo?.index ?? 0) + 1}</>
              ) : (
                <><GripHorizontal className="w-4 h-4" /> משנה גובה שורה {(resizeInfo?.index ?? 0) + 1}</>
              )}
            </div>
          </div>
        )}
      </div>
      
      {/* Enhanced Resize Instructions */}
      <div className="mt-3 p-2 bg-gray-50 rounded border-l-4 border-blue-400">
        <div className="flex items-center gap-2 text-xs text-gray-600">
          <div className="flex items-center gap-1">
            <GripVertical className="w-3 h-3 text-blue-500" />
            <span>עמודות</span>
          </div>
          <div className="flex items-center gap-1">
            <GripHorizontal className="w-3 h-3 text-blue-500" />
            <span>שורות</span>
          </div>
          <span className="mr-2">לחיצה כפולה = איפוס גודל</span>
        </div>
      </div>
    </div>
  );
}

// Row component with resize handle
export function ResizableRow({ 
  children, 
  index, 
  height,
  onResize 
}: { 
  children: React.ReactNode;
  index: number;
  height?: number;
  onResize?: (newHeight: number) => void;
}) {
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startHeight = height || 40;

    const handleMouseMove = (e: MouseEvent) => {
      const diff = e.clientY - startY;
      const newHeight = Math.max(30, startHeight + diff);
      onResize?.(newHeight);
    };

    const handleMouseUp = () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };

  return (
    <TableRow style={{ height: height || 40 }}>
      {children}
      
      {/* Row resize handle */}
      <div
        className="resize-handle-horizontal"
        onMouseDown={handleMouseDown}
        title="גרור לשינוי גובה שורה"
      />
    </TableRow>
  );
}