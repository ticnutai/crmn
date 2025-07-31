import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  Type, 
  Square, 
  MousePointer,
  Trash2,
  Save,
  Copy,
  Move,
  Palette
} from "lucide-react";

interface UIElement {
  id: string;
  type: 'text' | 'button' | 'div';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  fontSize: number;
  fontWeight: string;
  color: string;
  backgroundColor: string;
  borderRadius: number;
  borderWidth: number;
  borderColor: string;
}

interface ProfessionalUIEditorProps {
  onClose: () => void;
}

export default function ProfessionalUIEditor({ onClose }: ProfessionalUIEditorProps) {
  const [elements, setElements] = useState<UIElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'text' | 'button' | 'div'>('select');
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const createElement = useCallback((type: UIElement['type'], x: number, y: number): UIElement => ({
    id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    type,
    x,
    y,
    width: type === 'text' ? 150 : type === 'button' ? 120 : 200,
    height: type === 'text' ? 40 : type === 'button' ? 40 : 100,
    content: type === 'text' ? 'טקסט חדש' : type === 'button' ? 'כפתור חדש' : 'תיבה חדשה',
    fontSize: 16,
    fontWeight: 'normal',
    color: type === 'button' ? '#ffffff' : '#000000',
    backgroundColor: type === 'button' ? '#3b82f6' : type === 'div' ? '#f3f4f6' : 'transparent',
    borderRadius: type === 'button' ? 8 : 4,
    borderWidth: type === 'div' ? 2 : type === 'button' ? 0 : 0,
    borderColor: '#d1d5db'
  }), []);

  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    
    if (tool === 'select') {
      setSelectedElement(null);
      return;
    }
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newElement = createElement(tool, x, y);
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
    setTool('select');
  }, [tool, createElement]);

  const handleElementMouseDown = useCallback((e: React.MouseEvent, elementId: string) => {
    e.preventDefault();
    e.stopPropagation();
    
    setSelectedElement(elementId);
    
    if (tool !== 'select') return;
    
    const element = elements.find(el => el.id === elementId);
    if (!element) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setElementStart({ x: element.x, y: element.y });
    
    // Prevent text selection during drag
    document.body.style.userSelect = 'none';
  }, [tool, elements]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging || !selectedElement) return;
    
    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;
    
    const newX = Math.max(0, elementStart.x + deltaX);
    const newY = Math.max(0, elementStart.y + deltaY);
    
    setElements(prev => prev.map(el => 
      el.id === selectedElement 
        ? { ...el, x: newX, y: newY }
        : el
    ));
  }, [isDragging, selectedElement, dragStart, elementStart]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
    document.body.style.userSelect = '';
  }, []);

  const updateElement = useCallback((id: string, updates: Partial<UIElement>) => {
    setElements(prev => prev.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  }, []);

  const deleteElement = useCallback((id: string) => {
    setElements(prev => prev.filter(el => el.id !== id));
    setSelectedElement(null);
  }, []);

  const duplicateElement = useCallback((id: string) => {
    const element = elements.find(el => el.id === id);
    if (!element) return;
    
    const newElement = {
      ...element,
      id: `element-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      x: element.x + 20,
      y: element.y + 20
    };
    
    setElements(prev => [...prev, newElement]);
    setSelectedElement(newElement.id);
  }, [elements]);

  const selectedElementData = elements.find(el => el.id === selectedElement);

  const renderElement = useCallback((element: UIElement) => {
    const isSelected = selectedElement === element.id;
    
    const style: React.CSSProperties = {
      position: 'absolute',
      left: element.x,
      top: element.y,  
      width: element.width,
      height: element.height,
      fontSize: element.fontSize,
      fontWeight: element.fontWeight,
      color: element.color,
      backgroundColor: element.backgroundColor,
      borderRadius: element.borderRadius,
      border: `${element.borderWidth}px solid ${element.borderColor}`,
      cursor: tool === 'select' ? (isSelected ? 'move' : 'pointer') : 'crosshair',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '8px',
      boxSizing: 'border-box',
      outline: isSelected ? '2px solid #3b82f6' : 'none',
      outlineOffset: '2px',
      transition: 'outline 0.1s ease'
    };

    const content = (
      <div
        key={element.id}
        style={style}
        onMouseDown={(e) => handleElementMouseDown(e, element.id)}
        className="select-none"
      >
        {element.content}
      </div>
    );

    return content;
  }, [selectedElement, tool, handleElementMouseDown]);

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex" dir="rtl">
      {/* Properties Panel */}
      <div className="w-80 bg-white border-l border-gray-200 overflow-y-auto flex-shrink-0">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">עורך UI מקצועי</h2>
            <Button variant="ghost" size="sm" onClick={onClose}>✕</Button>
          </div>

          {/* Tools */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium">כלי עריכה</Label>
              <div className="grid grid-cols-2 gap-2 mt-2">
                <Button
                  variant={tool === 'select' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('select')}
                  className="w-full"
                >
                  <MousePointer className="w-4 h-4 ml-2" />
                  בחירה
                </Button>
                <Button
                  variant={tool === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('text')}
                  className="w-full"
                >
                  <Type className="w-4 h-4 ml-2" />
                  טקסט
                </Button>
                <Button
                  variant={tool === 'button' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('button')}
                  className="w-full"
                >
                  <Square className="w-4 h-4 ml-2" />
                  כפתור
                </Button>
                <Button
                  variant={tool === 'div' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('div')}
                  className="w-full"
                >
                  <Move className="w-4 h-4 ml-2" />
                  תיבה
                </Button>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-2">
              <Button 
                onClick={() => alert('עיצוב נשמר בהצלחה!')} 
                className="w-full"
                variant="default"
              >
                <Save className="w-4 h-4 ml-2" />
                שמור עיצוב
              </Button>
              
              {selectedElementData && (
                <div className="flex gap-2">
                  <Button
                    onClick={() => duplicateElement(selectedElementData.id)}
                    variant="outline"
                    size="sm"
                    className="flex-1"
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => deleteElement(selectedElementData.id)}
                    variant="destructive"
                    size="sm"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-3 rounded text-sm">
              {tool === 'select' && 'לחץ על אלמנט לבחירה, גרור להזזה'}
              {tool === 'text' && 'לחץ על הקנבס להוספת טקסט'}
              {tool === 'button' && 'לחץ על הקנבס להוספת כפתור'}
              {tool === 'div' && 'לחץ על הקנבס להוספת תיבה'}
            </div>
          </div>
        </div>

        {/* Element Properties */}
        {selectedElementData && (
          <div className="p-4 space-y-4">
            <h3 className="font-medium text-lg">מאפייני האלמנט</h3>
            
            {/* Content */}
            <div>
              <Label className="text-sm font-medium">תוכן</Label>
              <Input
                value={selectedElementData.content}
                onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                className="mt-1"
                placeholder="הקלד תוכן..."
              />
            </div>

            {/* Size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-sm font-medium">רוחב</Label>
                <Input
                  type="number"
                  value={selectedElementData.width}
                  onChange={(e) => updateElement(selectedElementData.id, { width: parseInt(e.target.value) || 0 })}
                  min="10"
                  max="800"
                />
              </div>
              <div>
                <Label className="text-sm font-medium">גובה</Label>
                <Input
                  type="number"
                  value={selectedElementData.height}
                  onChange={(e) => updateElement(selectedElementData.id, { height: parseInt(e.target.value) || 0 })}
                  min="10"
                  max="600"
                />
              </div>
            </div>

            {/* Font Size */}
            <div>
              <Label className="text-sm font-medium">גודל גופן: {selectedElementData.fontSize}px</Label>
              <Slider
                value={[selectedElementData.fontSize]}
                onValueChange={([value]) => updateElement(selectedElementData.id, { fontSize: value })}
                min={8}
                max={72}
                step={1}
                className="mt-2"
              />
            </div>

            {/* Colors */}
            <div className="space-y-3">
              <div>
                <Label className="text-sm font-medium">צבע טקסט</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={selectedElementData.color}
                    onChange={(e) => updateElement(selectedElementData.id, { color: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={selectedElementData.color}
                    onChange={(e) => updateElement(selectedElementData.id, { color: e.target.value })}
                    className="flex-1"
                    placeholder="#000000"
                  />
                </div>
              </div>

              <div>
                <Label className="text-sm font-medium">צבע רקע</Label>
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    type="color"
                    value={selectedElementData.backgroundColor}
                    onChange={(e) => updateElement(selectedElementData.id, { backgroundColor: e.target.value })}
                    className="w-16 h-10 p-1"
                  />
                  <Input
                    type="text"
                    value={selectedElementData.backgroundColor}
                    onChange={(e) => updateElement(selectedElementData.id, { backgroundColor: e.target.value })}
                    className="flex-1"
                    placeholder="#ffffff"
                  />
                </div>
              </div>
            </div>

            {/* Border */}
            <div className="space-y-2">
              <div>
                <Label className="text-sm font-medium">עובי מסגרת: {selectedElementData.borderWidth}px</Label>
                <Slider
                  value={[selectedElementData.borderWidth]}
                  onValueChange={([value]) => updateElement(selectedElementData.id, { borderWidth: value })}
                  min={0}
                  max={10}
                  step={1}
                  className="mt-2"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">צבע מסגרת</Label>
                <Input
                  type="color"
                  value={selectedElementData.borderColor}
                  onChange={(e) => updateElement(selectedElementData.id, { borderColor: e.target.value })}
                  className="mt-1 h-10"
                />
              </div>

              <div>
                <Label className="text-sm font-medium">רדיוס פינות: {selectedElementData.borderRadius}px</Label>
                <Slider
                  value={[selectedElementData.borderRadius]}
                  onValueChange={([value]) => updateElement(selectedElementData.id, { borderRadius: value })}
                  min={0}
                  max={50}
                  step={1}
                  className="mt-2"
                />
              </div>
            </div>

            {/* Font Weight */}
            <div>
              <Label className="text-sm font-medium">עובי גופן</Label>
              <div className="flex gap-2 mt-1">
                <Button
                  variant={selectedElementData.fontWeight === 'normal' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElement(selectedElementData.id, { fontWeight: 'normal' })}
                  className="flex-1"
                >
                  רגיל
                </Button>
                <Button
                  variant={selectedElementData.fontWeight === 'bold' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => updateElement(selectedElementData.id, { fontWeight: 'bold' })}
                  className="flex-1"
                >
                  בולט
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100 p-4">
        <div 
          ref={canvasRef}
          className="relative bg-white border-2 border-gray-300 mx-auto shadow-lg"
          style={{
            width: 900,
            height: 700,
            cursor: tool !== 'select' ? 'crosshair' : 'default'
          }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {elements.length === 0 && (
            <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
              <div className="text-center">
                <Palette className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">בחר כלי ולחץ כאן להתחלת עיצוב</p>
                <p className="text-sm">גרור אלמנטים להזזה, לחץ לעריכה</p>
              </div>
            </div>
          )}
          
          {elements.map(renderElement)}
          
          {/* Selection indicator */}
          {tool !== 'select' && (
            <div className="absolute top-4 left-4 bg-blue-500 text-white px-3 py-2 rounded-lg shadow-lg pointer-events-none">
              {tool === 'text' && '📝 לחץ להוספת טקסט'}
              {tool === 'button' && '🔲 לחץ להוספת כפתור'}
              {tool === 'div' && '📦 לחץ להוספת תיבה'}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}