import { useState, useRef, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { 
  Move, 
  Type, 
  Square, 
  Circle, 
  Image, 
  Trash2, 
  Copy, 
  RotateCw,
  Palette,
  MousePointer,
  Save,
  Download,
  Upload,
  Undo,
  Redo,
  Grid,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Underline
} from "lucide-react";

interface UIElement {
  id: string;
  type: 'text' | 'button' | 'input' | 'div' | 'image';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  styles: {
    fontSize: number;
    fontWeight: string;
    color: string;
    backgroundColor: string;
    borderColor: string;
    borderWidth: number;
    borderRadius: number;
    padding: number;
    textAlign: string;
    fontStyle: string;
    textDecoration: string;
  };
  zIndex: number;
}

interface AdvancedUIEditorProps {
  onClose: () => void;
}

export default function AdvancedUIEditor({ onClose }: AdvancedUIEditorProps) {
  const [elements, setElements] = useState<UIElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'text' | 'button' | 'input' | 'div'>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [showGrid, setShowGrid] = useState(true);
  const [snapToGrid, setSnapToGrid] = useState(true);
  const gridSize = 10;
  
  const canvasRef = useRef<HTMLDivElement>(null);
  const [history, setHistory] = useState<UIElement[][]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const addToHistory = useCallback((newElements: UIElement[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newElements]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  }, [history, historyIndex]);

  const undo = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setElements([...history[historyIndex - 1]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setElements([...history[historyIndex + 1]]);
    }
  };

  const snapToGridPosition = (value: number) => {
    return snapToGrid ? Math.round(value / gridSize) * gridSize : value;
  };

  const createElement = (type: UIElement['type'], x: number, y: number): UIElement => {
    const id = `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    const defaultContent = {
      text: 'טקסט חדש',
      button: 'כפתור',
      input: '',
      div: 'תיבה',
      image: ''
    };

    return {
      id,
      type,
      x: snapToGridPosition(x),
      y: snapToGridPosition(y),
      width: type === 'text' ? 120 : type === 'input' ? 200 : 100,
      height: type === 'text' ? 30 : type === 'input' ? 40 : type === 'div' ? 100 : 40,
      content: defaultContent[type],
      styles: {
        fontSize: 14,
        fontWeight: 'normal',
        color: '#000000',
        backgroundColor: type === 'div' ? '#f3f4f6' : type === 'button' ? '#3b82f6' : 'transparent',
        borderColor: '#d1d5db',
        borderWidth: type === 'input' || type === 'div' ? 1 : 0,
        borderRadius: type === 'button' ? 6 : 4,
        padding: 8,
        textAlign: 'right',
        fontStyle: 'normal',
        textDecoration: 'none'
      },
      zIndex: elements.length + 1
    };
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (tool === 'select') {
      setSelectedElement(null);
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newElement = createElement(tool, x, y);
    const newElements = [...elements, newElement];
    setElements(newElements);
    addToHistory(newElements);
    setSelectedElement(newElement.id);
    setTool('select');
  };

  const handleElementMouseDown = (e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedElement(elementId);
    
    if (tool !== 'select') return;

    setIsDragging(true);
    
    const rect = canvasRef.current?.getBoundingClientRect();
    const element = elements.find(el => el.id === elementId);
    if (element && rect) {
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y
      });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;

    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const newX = snapToGridPosition(e.clientX - rect.left - dragOffset.x);
    const newY = snapToGridPosition(e.clientY - rect.top - dragOffset.y);

    setElements(elements.map(el => 
      el.id === selectedElement 
        ? { ...el, x: Math.max(0, newX), y: Math.max(0, newY) }
        : el
    ));
  };

  const handleMouseUp = () => {
    if (isDragging) {
      addToHistory(elements);
    }
    setIsDragging(false);
  };

  const updateElement = (id: string, updates: Partial<UIElement>) => {
    const newElements = elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    );
    setElements(newElements);
    addToHistory(newElements);
  };

  const updateElementStyle = (id: string, styleKey: string, value: any) => {
    const newElements = elements.map(el => 
      el.id === id 
        ? { ...el, styles: { ...el.styles, [styleKey]: value } }
        : el
    );
    setElements(newElements);
  };

  const deleteElement = (id: string) => {
    const newElements = elements.filter(el => el.id !== id);
    setElements(newElements);
    addToHistory(newElements);
    setSelectedElement(null);
  };

  const duplicateElement = (id: string) => {
    const element = elements.find(el => el.id === id);
    if (element) {
      const newElement = {
        ...element,
        id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        x: element.x + 20,
        y: element.y + 20,
        zIndex: elements.length + 1
      };
      const newElements = [...elements, newElement];
      setElements(newElements);
      addToHistory(newElements);
      setSelectedElement(newElement.id);
    }
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  const renderElement = (element: UIElement) => {
    const style = {
      position: 'absolute' as const,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      fontSize: element.styles.fontSize,
      fontWeight: element.styles.fontWeight,
      color: element.styles.color,
      backgroundColor: element.styles.backgroundColor,
      border: `${element.styles.borderWidth}px solid ${element.styles.borderColor}`,
      borderRadius: element.styles.borderRadius,
      padding: element.styles.padding,
      textAlign: element.styles.textAlign as any,
      fontStyle: element.styles.fontStyle,
      textDecoration: element.styles.textDecoration,
      zIndex: element.zIndex,
      cursor: tool === 'select' ? 'move' : 'default',
      outline: selectedElement === element.id ? '2px solid #3b82f6' : 'none',
      outlineOffset: '2px'
    };

    const commonProps = {
      style,
      onMouseDown: (e: React.MouseEvent) => handleElementMouseDown(e, element.id),
      onClick: (e: React.MouseEvent) => e.stopPropagation()
    };

    switch (element.type) {
      case 'text':
        return (
          <div key={element.id} {...commonProps}>
            {element.content}
          </div>
        );
      case 'button':
        return (
          <button key={element.id} {...commonProps}>
            {element.content}
          </button>
        );
      case 'input':
        return (
          <input 
            key={element.id} 
            {...commonProps}
            value={element.content}
            placeholder="הקלד טקסט..."
            readOnly
          />
        );
      case 'div':
        return (
          <div key={element.id} {...commonProps}>
            {element.content}
          </div>
        );
      default:
        return null;
    }
  };

  const saveDesign = () => {
    const designData = {
      elements,
      canvasSize,
      timestamp: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(designData, null, 2)], { 
      type: 'application/json' 
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ui-design-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex">
      {/* Toolbar */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">🎨 עורך UI מתקדם</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>

          {/* Tools */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">כלי עריכה</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={tool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('select')}
                >
                  <MousePointer className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('text')}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'button' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('button')}
                >
                  <Square className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'input' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('input')}
                >
                  <Type className="w-4 h-4" />
                </Button>
                <Button
                  variant={tool === 'div' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('div')}
                >
                  <Square className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={undo} disabled={historyIndex <= 0}>
                <Undo className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={redo} disabled={historyIndex >= history.length - 1}>
                <Redo className="w-4 h-4" />
              </Button>
              <Button variant="outline" size="sm" onClick={saveDesign}>
                <Save className="w-4 h-4" />
              </Button>
            </div>

            {/* Grid Settings */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">הצג רשת</Label>
                <Switch checked={showGrid} onCheckedChange={setShowGrid} />
              </div>
              <div className="flex items-center justify-between">
                <Label className="text-sm">הצמד לרשת</Label>
                <Switch checked={snapToGrid} onCheckedChange={setSnapToGrid} />
              </div>
            </div>
          </div>
        </div>

        {/* Element Properties */}
        {selectedElementData && (
          <div className="p-4 space-y-4">
            <h3 className="font-medium">מאפייני האלמנט</h3>
            
            {/* Content */}
            <div>
              <Label className="text-sm">תוכן</Label>
              <Input
                value={selectedElementData.content}
                onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                className="mt-1"
              />
            </div>

            {/* Position and Size */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-sm">X</Label>
                <Input
                  type="number"
                  value={selectedElementData.x}
                  onChange={(e) => updateElement(selectedElementData.id, { x: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-sm">Y</Label>
                <Input
                  type="number"
                  value={selectedElementData.y}
                  onChange={(e) => updateElement(selectedElementData.id, { y: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-sm">רוחב</Label>
                <Input
                  type="number"
                  value={selectedElementData.width}
                  onChange={(e) => updateElement(selectedElementData.id, { width: parseInt(e.target.value) })}
                />
              </div>
              <div>
                <Label className="text-sm">גובה</Label>
                <Input
                  type="number"
                  value={selectedElementData.height}
                  onChange={(e) => updateElement(selectedElementData.id, { height: parseInt(e.target.value) })}
                />
              </div>
            </div>

            {/* Style Properties */}
            <div className="space-y-2">
              <div>
                <Label className="text-sm">גודל גופן</Label>
                <Input
                  type="number"
                  value={selectedElementData.styles.fontSize}
                  onChange={(e) => updateElementStyle(selectedElementData.id, 'fontSize', parseInt(e.target.value))}
                />
              </div>
              
              <div>
                <Label className="text-sm">צבע טקסט</Label>
                <Input
                  type="color"
                  value={selectedElementData.styles.color}
                  onChange={(e) => updateElementStyle(selectedElementData.id, 'color', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-sm">צבע רקע</Label>
                <Input
                  type="color"
                  value={selectedElementData.styles.backgroundColor}
                  onChange={(e) => updateElementStyle(selectedElementData.id, 'backgroundColor', e.target.value)}
                />
              </div>

              <div>
                <Label className="text-sm">עובי מסגרת</Label>
                <Input
                  type="number"
                  value={selectedElementData.styles.borderWidth}
                  onChange={(e) => updateElementStyle(selectedElementData.id, 'borderWidth', parseInt(e.target.value))}
                />
              </div>

              <div>
                <Label className="text-sm">רדיוס פינות</Label>
                <Input
                  type="number"
                  value={selectedElementData.styles.borderRadius}
                  onChange={(e) => updateElementStyle(selectedElementData.id, 'borderRadius', parseInt(e.target.value))}
                />
              </div>
            </div>

            {/* Text Formatting */}
            <div className="space-y-2">
              <Label className="text-sm">עיצוב טקסט</Label>
              <div className="flex gap-1">
                <Button
                  variant={selectedElementData.styles.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElementStyle(
                    selectedElementData.id, 
                    'fontWeight', 
                    selectedElementData.styles.fontWeight === 'bold' ? 'normal' : 'bold'
                  )}
                >
                  <Bold className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedElementData.styles.fontStyle === 'italic' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElementStyle(
                    selectedElementData.id, 
                    'fontStyle', 
                    selectedElementData.styles.fontStyle === 'italic' ? 'normal' : 'italic'
                  )}
                >
                  <Italic className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedElementData.styles.textDecoration === 'underline' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElementStyle(
                    selectedElementData.id, 
                    'textDecoration', 
                    selectedElementData.styles.textDecoration === 'underline' ? 'none' : 'underline'
                  )}
                >
                  <Underline className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex gap-1">
                <Button
                  variant={selectedElementData.styles.textAlign === 'left' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElementStyle(selectedElementData.id, 'textAlign', 'left')}
                >
                  <AlignLeft className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedElementData.styles.textAlign === 'center' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElementStyle(selectedElementData.id, 'textAlign', 'center')}
                >
                  <AlignCenter className="w-4 h-4" />
                </Button>
                <Button
                  variant={selectedElementData.styles.textAlign === 'right' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElementStyle(selectedElementData.id, 'textAlign', 'right')}
                >
                  <AlignRight className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Element Actions */}
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => duplicateElement(selectedElementData.id)}
              >
                <Copy className="w-4 h-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => deleteElement(selectedElementData.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-4">
          <div
            ref={canvasRef}
            className="relative bg-white border border-gray-300 mx-auto"
            style={{
              width: canvasSize.width,
              height: canvasSize.height,
              backgroundImage: showGrid 
                ? `radial-gradient(circle, #e5e7eb 1px, transparent 1px)`
                : 'none',
              backgroundSize: showGrid ? `${gridSize}px ${gridSize}px` : 'auto',
              cursor: tool !== 'select' ? 'crosshair' : 'default'
            }}
            onClick={handleCanvasClick}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          >
            {elements.map(renderElement)}
            
            {/* Selection indicator */}
            {tool !== 'select' && (
              <div className="absolute top-2 left-2 bg-blue-500 text-white px-2 py-1 rounded text-sm">
                {tool === 'text' && 'לחץ להוספת טקסט'}
                {tool === 'button' && 'לחץ להוספת כפתור'}
                {tool === 'input' && 'לחץ להוספת שדה קלט'}
                {tool === 'div' && 'לחץ להוספת תיבה'}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}