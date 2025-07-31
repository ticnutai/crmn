import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { 
  Type, 
  Square, 
  MousePointer,
  Trash2,
  Save
} from "lucide-react";

interface UIElement {
  id: string;
  type: 'text' | 'button' | 'input';
  x: number;
  y: number;
  width: number;
  height: number;
  content: string;
  backgroundColor: string;
  color: string;
}

interface SimpleUIEditorProps {
  onClose: () => void;
}

export default function SimpleUIEditor({ onClose }: SimpleUIEditorProps) {
  const [elements, setElements] = useState<UIElement[]>([]);
  const [selectedElement, setSelectedElement] = useState<string | null>(null);
  const [tool, setTool] = useState<'select' | 'text' | 'button' | 'input'>('select');
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (tool === 'select') return;
    
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newElement: UIElement = {
      id: `element-${Date.now()}`,
      type: tool,
      x,
      y,
      width: tool === 'text' ? 120 : tool === 'input' ? 200 : 100,
      height: tool === 'text' ? 30 : 40,
      content: tool === 'text' ? 'טקסט חדש' : tool === 'button' ? 'כפתור' : '',
      backgroundColor: tool === 'button' ? '#3b82f6' : '#ffffff',
      color: tool === 'button' ? '#ffffff' : '#000000'
    };
    
    setElements([...elements, newElement]);
    setSelectedElement(newElement.id);
    setTool('select');
  };

  const handleElementClick = (e: React.MouseEvent, elementId: string) => {
    e.stopPropagation();
    setSelectedElement(elementId);
  };

  const updateElement = (id: string, updates: Partial<UIElement>) => {
    setElements(elements.map(el => 
      el.id === id ? { ...el, ...updates } : el
    ));
  };

  const deleteElement = (id: string) => {
    setElements(elements.filter(el => el.id !== id));
    setSelectedElement(null);
  };

  const selectedElementData = elements.find(el => el.id === selectedElement);

  const renderElement = (element: UIElement) => {
    const style = {
      position: 'absolute' as const,
      left: element.x,
      top: element.y,
      width: element.width,
      height: element.height,
      backgroundColor: element.backgroundColor,
      color: element.color,
      border: selectedElement === element.id ? '2px solid #3b82f6' : '1px solid #d1d5db',
      borderRadius: '4px',
      padding: '8px',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: '14px'
    };

    return (
      <div
        key={element.id}
        style={style}
        onClick={(e) => handleElementClick(e, element.id)}
      >
        {element.content}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex">
      {/* Toolbar */}
      <div className="w-80 bg-white border-r border-gray-200 overflow-y-auto">
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold">עורך UI פשוט</h2>
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
                  variant={tool === 'input' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setTool('input')}
                  className="w-full"
                >
                  <Type className="w-4 h-4 ml-2" />
                  קלט
                </Button>
              </div>
            </div>

            {/* Instructions */}
            <div className="bg-blue-50 p-3 rounded">
              <p className="text-sm text-blue-800">
                {tool === 'select' && 'לחץ על אלמנט לעריכה'}
                {tool === 'text' && 'לחץ על הקנבס להוספת טקסט'}
                {tool === 'button' && 'לחץ על הקנבס להוספת כפתור'}
                {tool === 'input' && 'לחץ על הקנבס להוספת שדה קלט'}
              </p>
            </div>
          </div>
        </div>

        {/* Element Properties */}
        {selectedElementData && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-medium">מאפייני האלמנט</h3>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => deleteElement(selectedElementData.id)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div>
              <Label className="text-sm">תוכן</Label>
              <Input
                value={selectedElementData.content}
                onChange={(e) => updateElement(selectedElementData.id, { content: e.target.value })}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
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

            <div>
              <Label className="text-sm">צבע רקע</Label>
              <Input
                type="color"
                value={selectedElementData.backgroundColor}
                onChange={(e) => updateElement(selectedElementData.id, { backgroundColor: e.target.value })}
                className="mt-1 h-10"
              />
            </div>

            <div>
              <Label className="text-sm">צבע טקסט</Label>
              <Input
                type="color"
                value={selectedElementData.color}
                onChange={(e) => updateElement(selectedElementData.id, { color: e.target.value })}
                className="mt-1 h-10"
              />
            </div>
          </div>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1 overflow-auto bg-gray-100">
        <div className="p-4">
          <div className="bg-white p-4 mb-4 rounded shadow">
            <Button onClick={() => alert('עיצוב נשמר!')} className="ml-auto">
              <Save className="w-4 h-4 ml-2" />
              שמור עיצוב
            </Button>
          </div>
          
          <div
            ref={canvasRef}
            className="relative bg-white border-2 border-dashed border-gray-300 mx-auto"
            style={{
              width: 800,
              height: 600,
              cursor: tool !== 'select' ? 'crosshair' : 'default'
            }}
            onClick={handleCanvasClick}
          >
            {elements.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                בחר כלי ולחץ כאן להוספת אלמנטים
              </div>
            )}
            
            {elements.map(renderElement)}
          </div>
        </div>
      </div>
    </div>
  );
}