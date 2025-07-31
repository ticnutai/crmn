import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { X, Eye, Edit3, Type, Palette, Trash2, Copy } from "lucide-react";

interface ScrollableEditorProps {
  onClose: () => void;
}

export default function ScrollableEditor({ onClose }: ScrollableEditorProps) {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [isEditingText, setIsEditingText] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const startEditing = () => {
    setIsActive(true);
    setIsListening(true);
    
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      
      if (target.closest('.scrollable-editor')) return;
      
      document.querySelectorAll('.editor-selected').forEach(el => {
        el.classList.remove('editor-selected');
      });
      
      target.classList.add('editor-selected');
      setSelectedElement(target);
    };
    
    document.addEventListener('click', handleClick, true);
    
    setTimeout(() => {
      document.removeEventListener('click', handleClick, true);
      setIsListening(false);
    }, 30000);
  };

  const stopEditing = () => {
    setIsActive(false);
    setIsListening(false);
    setIsEditingText(false);
    setSelectedElement(null);
    
    document.querySelectorAll('.editor-selected').forEach(el => {
      el.classList.remove('editor-selected');
    });
  };

  const changeColor = (color: string) => {
    if (!selectedElement) return;
    selectedElement.style.color = color;
  };

  const changeBackground = (color: string) => {
    if (!selectedElement) return;
    selectedElement.style.backgroundColor = color;
  };

  const changeFontSize = (size: string) => {
    if (!selectedElement) return;
    selectedElement.style.fontSize = size + 'px';
  };

  const startTextEdit = () => {
    if (!selectedElement) return;
    setIsEditingText(true);
    
    setTimeout(() => {
      if (textAreaRef.current) {
        textAreaRef.current.value = selectedElement.textContent || '';
        textAreaRef.current.focus();
      }
    }, 100);
  };

  const saveTextEdit = () => {
    if (!selectedElement || !textAreaRef.current) return;
    
    const newText = textAreaRef.current.value;
    if (selectedElement.tagName === 'INPUT' || selectedElement.tagName === 'TEXTAREA') {
      (selectedElement as HTMLInputElement).value = newText;
    } else {
      selectedElement.textContent = newText;
    }
    
    setIsEditingText(false);
  };

  const cancelTextEdit = () => {
    setIsEditingText(false);
  };

  const deleteElement = () => {
    if (!selectedElement) return;
    if (confirm('האם למחוק את האלמנט?')) {
      selectedElement.remove();
      setSelectedElement(null);
    }
  };

  const duplicateElement = () => {
    if (!selectedElement) return;
    const clone = selectedElement.cloneNode(true) as HTMLElement;
    clone.classList.remove('editor-selected');
    selectedElement.parentNode?.insertBefore(clone, selectedElement.nextSibling);
  };

  const applyStyle = (property: string, value: string) => {
    if (!selectedElement) return;
    selectedElement.style[property as any] = value;
  };

  return (
    <>
      <div className="scrollable-editor fixed top-20 left-20 z-[100] bg-white rounded-lg shadow-xl border-2 border-blue-300 w-80 max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-blue-50 rounded-t-lg shrink-0">
          <h3 className="font-bold text-lg text-blue-900">🔧 עורך מתקדם</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-blue-600 hover:text-blue-800">
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          
          {/* Mode Toggle */}
          {!isActive ? (
            <Button onClick={startEditing} className="w-full" size="lg">
              <Edit3 className="w-4 h-4 ml-2" />
              התחל עריכה
            </Button>
          ) : (
            <div className="space-y-2">
              <Button onClick={stopEditing} variant="outline" className="w-full">
                <Eye className="w-4 h-4 ml-2" />
                סיום עריכה
              </Button>
              
              {isListening && (
                <div className="bg-green-50 p-3 rounded text-sm text-center border border-green-200">
                  🎯 לחץ על אלמנט במערכת לעריכה
                </div>
              )}
            </div>
          )}

          {/* Element Controls */}
          {selectedElement && (
            <div className="border-t pt-4 space-y-4">
              <div className="bg-blue-50 p-3 rounded text-sm text-center border border-blue-200">
                ✅ אלמנט נבחר לעריכה
              </div>

              {/* Text Editing Section */}
              <div className="bg-gray-50 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">עריכת טקסט</Label>
                
                {!isEditingText ? (
                  <div className="space-y-2">
                    <Button onClick={startTextEdit} variant="outline" className="w-full" size="sm">
                      <Type className="w-4 h-4 ml-2" />
                      ערוך טקסט קיים
                    </Button>
                    <Input
                      placeholder="הוסף טקסט חדש..."
                      className="text-sm"
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && selectedElement) {
                          const newText = e.currentTarget.value;
                          if (selectedElement.tagName === 'INPUT' || selectedElement.tagName === 'TEXTAREA') {
                            (selectedElement as HTMLInputElement).value = newText;
                          } else {
                            selectedElement.textContent = newText;
                          }
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <Textarea
                      ref={textAreaRef}
                      className="text-sm min-h-[80px]"
                      placeholder="ערוך את הטקסט כאן..."
                    />
                    <div className="flex gap-2">
                      <Button onClick={saveTextEdit} size="sm" className="flex-1">
                        שמור
                      </Button>
                      <Button onClick={cancelTextEdit} variant="outline" size="sm" className="flex-1">
                        ביטול
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Colors */}
              <div className="bg-gray-50 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">צבעים</Label>
                <div className="grid grid-cols-2 gap-2 mb-2">
                  <div>
                    <Label className="text-xs">צבע טקסט</Label>
                    <Input
                      type="color"
                      className="h-8 w-full"
                      onChange={(e) => changeColor(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label className="text-xs">צבע רקע</Label>
                    <Input
                      type="color"
                      className="h-8 w-full"
                      onChange={(e) => changeBackground(e.target.value)}
                    />
                  </div>
                </div>
                
                {/* Quick Colors */}
                <Label className="text-xs mb-1 block">צבעים מהירים</Label>
                <div className="grid grid-cols-6 gap-1">
                  {['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'].map(color => (
                    <button
                      key={color}
                      className="w-8 h-8 rounded border-2 border-gray-300 hover:border-gray-500"
                      style={{ backgroundColor: color }}
                      onClick={() => changeColor(color)}
                    />
                  ))}
                </div>
              </div>

              {/* Font Size */}
              <div className="bg-gray-50 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">גודל גופן</Label>
                <Input
                  type="number"
                  min="8"
                  max="72"
                  placeholder="16"
                  className="text-sm"
                  onChange={(e) => changeFontSize(e.target.value)}
                />
              </div>

              {/* Quick Styles */}
              <div className="bg-gray-50 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">סגנונות מהירים</Label>
                <div className="grid grid-cols-2 gap-1">
                  <Button size="sm" variant="outline" onClick={() => applyStyle('fontWeight', selectedElement?.style.fontWeight === 'bold' ? 'normal' : 'bold')}>
                    מודגש
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyStyle('fontStyle', selectedElement?.style.fontStyle === 'italic' ? 'normal' : 'italic')}>
                    נטוי
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyStyle('textDecoration', selectedElement?.style.textDecoration === 'underline' ? 'none' : 'underline')}>
                    קו תחתון
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyStyle('borderRadius', selectedElement?.style.borderRadius === '10px' ? '0px' : '10px')}>
                    עגול
                  </Button>
                </div>
              </div>

              {/* Animations */}
              <div className="bg-gray-50 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">אנימציות</Label>
                <div className="grid grid-cols-3 gap-1">
                  <Button size="sm" variant="outline" onClick={() => {applyStyle('transform', 'scale(1.1)'); applyStyle('transition', 'all 0.3s');}}>
                    הגדל
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {applyStyle('transform', 'rotate(5deg)'); applyStyle('transition', 'all 0.3s');}}>
                    סובב
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {applyStyle('transform', 'none'); applyStyle('transition', 'none');}}>
                    אפס
                  </Button>
                </div>
              </div>

              {/* Position Controls */}
              <div className="bg-gray-50 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">מיקום</Label>
                <div className="grid grid-cols-4 gap-1">
                  <Button size="sm" variant="outline" onClick={() => {applyStyle('position', 'relative'); applyStyle('top', '-5px');}}>
                    ↑
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {applyStyle('position', 'relative'); applyStyle('top', '5px');}}>
                    ↓
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {applyStyle('position', 'relative'); applyStyle('left', '-5px');}}>
                    ←
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => {applyStyle('position', 'relative'); applyStyle('left', '5px');}}>
                    →
                  </Button>
                </div>
              </div>

              {/* Gradients */}
              <div className="bg-gray-50 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">גרדיאנטים</Label>
                <div className="grid grid-cols-1 gap-2">
                  {[
                    { name: 'כתום-אדום', gradient: 'linear-gradient(45deg, #ff6b6b, #ffa500)' },
                    { name: 'ירוק-כחול', gradient: 'linear-gradient(45deg, #4ecdc4, #44a08d)' },
                    { name: 'סגול-כחול', gradient: 'linear-gradient(45deg, #667eea, #764ba2)' }
                  ].map((item, i) => (
                    <button
                      key={i}
                      className="h-8 rounded border text-white text-xs font-bold shadow-sm"
                      style={{ background: item.gradient }}
                      onClick={() => applyStyle('background', item.gradient)}
                    >
                      {item.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="bg-gray-50 p-3 rounded border">
                <Label className="text-sm font-semibold mb-2 block">פעולות</Label>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={duplicateElement} className="flex-1">
                    <Copy className="w-3 h-3 ml-1" />
                    שכפל
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => applyStyle('display', selectedElement?.style.display === 'none' ? '' : 'none')} className="flex-1">
                    👁️
                  </Button>
                  <Button size="sm" variant="destructive" onClick={deleteElement} className="flex-1">
                    <Trash2 className="w-3 h-3 ml-1" />
                    מחק
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Selection Styles */}
      <style>{`
        .editor-selected {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
          position: relative !important;
        }
        
        .editor-selected::after {
          content: "✏️ נבחר לעריכה";
          position: absolute;
          top: -25px;
          right: 0;
          background: #3b82f6;
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 11px;
          z-index: 10000;
          pointer-events: none;
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}