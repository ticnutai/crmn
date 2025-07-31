import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { 
  MousePointer,
  Palette,
  Save,
  Eye,
  Edit3,
  X,
  Plus,
  Trash2,
  Copy,
  Undo,
  Redo,
  Download,
  Upload,
  Layers,
  Move3D
} from "lucide-react";

interface LiveUIEditorProps {
  onClose: () => void;
}

export default function LiveUIEditor({ onClose }: LiveUIEditorProps) {
  const [isEditMode, setIsEditMode] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [elementStyles, setElementStyles] = useState<any>({});
  const [originalStyles, setOriginalStyles] = useState<Map<HTMLElement, any>>(new Map());
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [elementStart, setElementStart] = useState({ x: 0, y: 0 });
  const [editingText, setEditingText] = useState(false);
  const [gradientType, setGradientType] = useState<'linear' | 'radial'>('linear');
  const [creationMode, setCreationMode] = useState<'text' | 'button' | 'div' | null>(null);
  const [undoStack, setUndoStack] = useState<any[]>([]);
  const [redoStack, setRedoStack] = useState<any[]>([]);
  const [elementClipboard, setElementClipboard] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!isEditMode) return;

    const handleClick = (e: MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      
      // Skip if clicking on the editor itself
      if (target.closest('.live-ui-editor')) return;
      
      // Skip if clicking on modals or overlays
      if (target.closest('[role="dialog"]') || target.closest('.z-50')) return;
      
      // Handle creation mode efficiently
      if (creationMode) {
        const rect = document.body.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        createElement(creationMode, x, y);
        return;
      }
      
      // Remove previous selection efficiently
      const previousSelected = document.querySelector('.live-editor-selected');
      if (previousSelected) {
        previousSelected.classList.remove('live-editor-selected');
      }
      
      // Add selection to new element
      target.classList.add('live-editor-selected');
      setSelectedElement(target);
      
      // Store essential styles only
      const computedStyles = window.getComputedStyle(target);
      const styles = {
        backgroundColor: computedStyles.backgroundColor,
        color: computedStyles.color,
        fontSize: computedStyles.fontSize,
        fontWeight: computedStyles.fontWeight,
        borderRadius: computedStyles.borderRadius
      };
      
      setElementStyles(styles);
      
      if (!originalStyles.has(target)) {
        setOriginalStyles((prev: Map<HTMLElement, any>) => new Map(prev.set(target, { ...styles })));
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSelectedElement(null);
        setEditingText(false);
        document.querySelectorAll('.live-editor-selected').forEach(el => {
          el.classList.remove('live-editor-selected');
        });
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (!selectedElement || !isEditMode) return;
      
      const target = e.target as HTMLElement;
      if (target.closest('.live-ui-editor')) return;
      
      if (target === selectedElement && e.altKey) {
        setIsDragging(true);
        setDragStart({ x: e.clientX, y: e.clientY });
        
        const rect = selectedElement.getBoundingClientRect();
        setElementStart({ x: rect.left, y: rect.top });
        
        e.preventDefault();
      }
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !selectedElement) return;
      
      requestAnimationFrame(() => {
        const deltaX = e.clientX - dragStart.x;
        const deltaY = e.clientY - dragStart.y;
        
        selectedElement.style.position = 'relative';
        selectedElement.style.left = `${deltaX}px`;
        selectedElement.style.top = `${deltaY}px`;
        selectedElement.style.zIndex = '1000';
      });
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    document.addEventListener('click', handleClick, true);
    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('click', handleClick, true);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isEditMode, originalStyles]);

  const updateElementStyle = (property: string, value: string) => {
    if (!selectedElement) return;
    
    requestAnimationFrame(() => {
      selectedElement.style[property as any] = value;
    });
    
    setElementStyles((prev: any) => ({
      ...prev,
      [property]: value
    }));
  };

  const updateElementText = (newText: string) => {
    if (!selectedElement) return;
    
    // Handle different element types
    if (selectedElement.tagName === 'INPUT' || selectedElement.tagName === 'TEXTAREA') {
      (selectedElement as HTMLInputElement).value = newText;
    } else if (selectedElement.tagName === 'BUTTON') {
      selectedElement.textContent = newText;
    } else {
      selectedElement.textContent = newText;
    }
  };

  const createGradient = (color1: string, color2: string, type: 'linear' | 'radial' = 'linear', direction: string = '45deg') => {
    if (type === 'linear') {
      return `linear-gradient(${direction}, ${color1}, ${color2})`;
    } else {
      return `radial-gradient(circle, ${color1}, ${color2})`;
    }
  };

  const applyGradient = (color1: string, color2: string) => {
    if (!selectedElement) return;
    
    const gradient = createGradient(color1, color2, gradientType);
    updateElementStyle('background', gradient);
  };

  const deleteElement = () => {
    if (!selectedElement) return;
    
    // Save to undo stack
    saveToUndoStack();
    
    // Remove element
    selectedElement.remove();
    setSelectedElement(null);
    setElementStyles({});
  };

  const duplicateElement = () => {
    if (!selectedElement) return;
    
    const clone = selectedElement.cloneNode(true) as HTMLElement;
    clone.style.position = 'relative';
    clone.style.left = '10px';
    clone.style.top = '10px';
    clone.classList.remove('live-editor-selected');
    
    // Insert after the original element
    selectedElement.parentNode?.insertBefore(clone, selectedElement.nextSibling);
    
    // Select the new element
    setSelectedElement(clone);
    clone.classList.add('live-editor-selected');
  };

  const createElement = (type: 'text' | 'button' | 'div', x: number, y: number) => {
    const element = document.createElement(type === 'text' ? 'p' : type === 'button' ? 'button' : 'div');
    
    element.style.position = 'absolute';
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    element.style.zIndex = '1000';
    element.style.cursor = 'pointer';
    
    if (type === 'text') {
      element.textContent = 'טקסט חדש';
      element.style.padding = '8px';
      element.style.fontSize = '16px';
      element.style.color = '#000000';
    } else if (type === 'button') {
      element.textContent = 'כפתור חדש';
      element.style.padding = '8px 16px';
      element.style.backgroundColor = '#3b82f6';
      element.style.color = '#ffffff';
      element.style.border = 'none';
      element.style.borderRadius = '6px';
      element.style.fontSize = '14px';
    } else {
      element.textContent = 'תיבה חדשה';
      element.style.width = '200px';
      element.style.height = '100px';
      element.style.backgroundColor = '#f3f4f6';
      element.style.border = '2px solid #d1d5db';
      element.style.borderRadius = '8px';
      element.style.padding = '16px';
      element.style.display = 'flex';
      element.style.alignItems = 'center';
      element.style.justifyContent = 'center';
    }
    
    document.body.appendChild(element);
    setSelectedElement(element);
    element.classList.add('live-editor-selected');
    setCreationMode(null);
  };

  const copyElement = () => {
    if (!selectedElement) return;
    setElementClipboard(selectedElement);
  };

  const pasteElement = () => {
    if (!elementClipboard) return;
    
    const clone = elementClipboard.cloneNode(true) as HTMLElement;
    clone.style.left = `${parseInt(clone.style.left || '0') + 20}px`;
    clone.style.top = `${parseInt(clone.style.top || '0') + 20}px`;
    clone.classList.remove('live-editor-selected');
    
    document.body.appendChild(clone);
    setSelectedElement(clone);
    clone.classList.add('live-editor-selected');
  };

  const saveToUndoStack = () => {
    if (!selectedElement) return;
    
    const state = {
      element: selectedElement.outerHTML,
      styles: { ...elementStyles }
    };
    
    setUndoStack(prev => [...prev, state]);
    setRedoStack([]);
  };

  const undo = () => {
    if (undoStack.length === 0) return;
    
    const lastState = undoStack[undoStack.length - 1];
    setRedoStack(prev => [...prev, lastState]);
    setUndoStack(prev => prev.slice(0, -1));
    
    // Apply undo logic here
  };

  const redo = () => {
    if (redoStack.length === 0) return;
    
    const nextState = redoStack[redoStack.length - 1];
    setUndoStack(prev => [...prev, nextState]);
    setRedoStack(prev => prev.slice(0, -1));
    
    // Apply redo logic here
  };

  const exportStyles = () => {
    if (!selectedElement) return;
    
    const styles = window.getComputedStyle(selectedElement);
    const cssText = Array.from(styles).reduce((css, property) => {
      return css + `${property}: ${styles.getPropertyValue(property)};\n`;
    }, '');
    
    const blob = new Blob([cssText], { type: 'text/css' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'element-styles.css';
    a.click();
    URL.revokeObjectURL(url);
  };

  const hideElement = () => {
    if (!selectedElement) return;
    selectedElement.style.display = selectedElement.style.display === 'none' ? '' : 'none';
  };

  const bringToFront = () => {
    if (!selectedElement) return;
    selectedElement.style.zIndex = '9999';
  };

  const sendToBack = () => {
    if (!selectedElement) return;
    selectedElement.style.zIndex = '1';
  };

  const resetAllStyles = () => {
    // Remove selection highlight
    const selected = document.querySelector('.live-editor-selected');
    if (selected) {
      selected.classList.remove('live-editor-selected');
    }
    
    setOriginalStyles(new Map());
    setSelectedElement(null);
    setElementStyles({});
    alert('כל השינויים אופסו');
  };

  const saveChanges = () => {
    alert('השינויים נשמרו! (בגרסה מלאה ישמרו בקוד)');
  };

  const getColorValue = (colorStr: string) => {
    if (colorStr.startsWith('rgb')) {
      // Convert rgb to hex
      const rgb = colorStr.match(/\d+/g);
      if (rgb) {
        const hex = '#' + rgb.map(x => parseInt(x).toString(16).padStart(2, '0')).join('');
        return hex;
      }
    }
    return colorStr.startsWith('#') ? colorStr : '#000000';
  };

  const getFontSizeValue = (sizeStr: string) => {
    return parseInt(sizeStr) || 16;
  };

  return (
    <>
      {/* Creation Overlay */}
      {creationMode && (
        <div className="creation-overlay" />
      )}
      
      {/* Floating Control Panel */}
      <div className="live-ui-editor fixed top-4 right-4 z-[9999] bg-white rounded-lg shadow-2xl border border-gray-300 p-4 w-80">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-lg">עורך חי</h3>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        <div className="space-y-4">
          {/* Mode Toggle */}
          <div className="flex gap-2">
            <Button
              variant={isEditMode ? 'default' : 'outline'}
              size="sm"
              onClick={() => setIsEditMode(!isEditMode)}
              className="flex-1"
            >
              {isEditMode ? (
                <>
                  <Edit3 className="w-4 h-4 ml-2" />
                  מצב עריכה
                </>
              ) : (
                <>
                  <Eye className="w-4 h-4 ml-2" />
                  מצב צפייה
                </>
              )}
            </Button>
            
            {originalStyles.size > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={resetAllStyles}
                title="איפוס שינויים"
              >
                ↺
              </Button>
            )}
          </div>

          {/* Creation Tools */}
          {isEditMode && (
            <div>
              <Label className="text-sm font-medium">הוסף אלמנט חדש</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                <Button
                  variant={creationMode === 'text' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreationMode(creationMode === 'text' ? null : 'text')}
                >
                  📝
                </Button>
                <Button
                  variant={creationMode === 'button' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreationMode(creationMode === 'button' ? null : 'button')}
                >
                  🔲
                </Button>
                <Button
                  variant={creationMode === 'div' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setCreationMode(creationMode === 'div' ? null : 'div')}
                >
                  📦
                </Button>
              </div>
              {creationMode && (
                <p className="text-xs text-blue-600 mt-1">
                  לחץ במקום הרצוי להוספת {creationMode === 'text' ? 'טקסט' : creationMode === 'button' ? 'כפתור' : 'תיבה'}
                </p>
              )}
            </div>
          )}

          {/* Action Buttons */}
          {selectedElement && (
            <div>
              <Label className="text-sm font-medium">פעולות על האלמנט</Label>
              <div className="grid grid-cols-3 gap-1 mt-2">
                <Button size="sm" variant="outline" onClick={copyElement} title="העתק">
                  <Copy className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={pasteElement} title="הדבק" disabled={!elementClipboard}>
                  📋
                </Button>
                <Button size="sm" variant="outline" onClick={duplicateElement} title="שכפל">
                  📑
                </Button>
                <Button size="sm" variant="outline" onClick={hideElement} title="הסתר/הצג">
                  👁️
                </Button>
                <Button size="sm" variant="outline" onClick={bringToFront} title="הבא לחזית">
                  <Layers className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={sendToBack} title="שלח לאחור">
                  ⬇️
                </Button>
                <Button size="sm" variant="outline" onClick={exportStyles} title="יצא CSS">
                  <Download className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => saveToUndoStack()} title="שמור מצב">
                  💾
                </Button>
                <Button size="sm" variant="destructive" onClick={deleteElement} title="מחק אלמנט">
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
          )}

          {/* Undo/Redo */}
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={undo}
              disabled={undoStack.length === 0}
              className="flex-1"
            >
              <Undo className="w-4 h-4 ml-2" />
              ביטול
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={redo}
              disabled={redoStack.length === 0}
              className="flex-1"
            >
              <Redo className="w-4 h-4 ml-2" />
              שחזור
            </Button>
          </div>

          {/* Quick Status */}
          <div className="bg-blue-50 p-2 rounded text-xs">
            {isEditMode ? (
              creationMode ? (
                <p className="text-blue-700 font-medium">
                  🎯 לחץ במקום הרצוי להוספת {creationMode === 'text' ? 'טקסט' : creationMode === 'button' ? 'כפתור' : 'תיבה'}
                </p>
              ) : selectedElement ? (
                <p className="text-green-700 font-medium">✅ אלמנט נבחר - ערוך בכלים למטה</p>
              ) : (
                <p>לחץ על אלמנט במערכת לעריכה</p>
              )
            ) : (
              <p>הפעל מצב עריכה להתחלה</p>
            )}
          </div>

          {/* Element Info */}
          {selectedElement && (
            <div className="bg-green-50 p-3 rounded">
              <p className="text-sm font-medium">אלמנט נבחר:</p>
              <p className="text-xs text-gray-600">
                {selectedElement.tagName.toLowerCase()}
                {selectedElement.className && ` .${selectedElement.className.split(' ')[0]}`}
              </p>
            </div>
          )}

          {/* Style Controls */}
          {selectedElement && (
            <div className="space-y-4 max-h-96 overflow-y-auto">
              <h4 className="font-medium">עריכת סגנון</h4>
              
              {/* Text Editing */}
              <div>
                <Label className="text-sm">עריכת טקסט</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="text"
                    placeholder="טקסט חדש..."
                    className="flex-1"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        updateElementText(e.currentTarget.value);
                        e.currentTarget.value = '';
                      }
                    }}
                  />
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setEditingText(!editingText)}
                  >
                    {editingText ? '✓' : '✏️'}
                  </Button>
                </div>
                {editingText && (
                  <textarea
                    className="w-full mt-2 p-2 text-sm border rounded"
                    rows={3}
                    placeholder="הקלד טקסט חדש..."
                    onBlur={(e) => {
                      updateElementText(e.target.value);
                      setEditingText(false);
                    }}
                    defaultValue={selectedElement.textContent || ''}
                    autoFocus
                  />
                )}
              </div>
              
              {/* Background Color */}
              <div>
                <Label className="text-sm">צבע רקע</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={getColorValue(elementStyles.backgroundColor || '#ffffff')}
                    onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                    className="w-16 h-8 p-0 border-0"
                  />
                  <Input
                    type="text"
                    value={elementStyles.backgroundColor || ''}
                    onChange={(e) => updateElementStyle('backgroundColor', e.target.value)}
                    placeholder="transparent"
                    className="flex-1 text-xs"
                  />
                </div>
              </div>

              {/* Text Color */}
              <div>
                <Label className="text-sm">צבע טקסט</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="color"
                    value={getColorValue(elementStyles.color || '#000000')}
                    onChange={(e) => updateElementStyle('color', e.target.value)}
                    className="w-16 h-8 p-0 border-0"
                  />
                  <Input
                    type="text"
                    value={elementStyles.color || ''}
                    onChange={(e) => updateElementStyle('color', e.target.value)}
                    placeholder="#000000"
                    className="flex-1 text-xs"
                  />
                </div>
              </div>

              {/* Font Size */}
              <div>
                <Label className="text-sm">
                  גודל גופן: {getFontSizeValue(elementStyles.fontSize || '16px')}px
                </Label>
                <Slider
                  value={[getFontSizeValue(elementStyles.fontSize || '16px')]}
                  onValueChange={([value]) => updateElementStyle('fontSize', `${value}px`)}
                  min={8}
                  max={48}
                  step={1}
                  className="mt-2"
                />
              </div>

              {/* Border Radius */}
              <div>
                <Label className="text-sm">רדיוס פינות</Label>
                <div className="flex gap-2 mt-1">
                  <Input
                    type="range"
                    min="0"
                    max="50"
                    value={parseInt(elementStyles.borderRadius || '0')}
                    onChange={(e) => updateElementStyle('borderRadius', `${e.target.value}px`)}
                    className="flex-1"
                  />
                  <Input
                    type="text"
                    value={elementStyles.borderRadius || '0px'}
                    onChange={(e) => updateElementStyle('borderRadius', e.target.value)}
                    className="w-16 text-xs"
                  />
                </div>
              </div>

              {/* Padding */}
              <div>
                <Label className="text-sm">ריווח פנימי</Label>
                <Input
                  type="text"
                  value={elementStyles.padding || ''}
                  onChange={(e) => updateElementStyle('padding', e.target.value)}
                  placeholder="8px"
                  className="mt-1 text-xs"
                />
              </div>

              {/* Font Weight */}
              <div>
                <Label className="text-sm">עובי גופן</Label>
                <div className="flex gap-2 mt-1">
                  <Button
                    variant={elementStyles.fontWeight === 'normal' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateElementStyle('fontWeight', 'normal')}
                    className="flex-1"
                  >
                    רגיל
                  </Button>
                  <Button
                    variant={elementStyles.fontWeight === 'bold' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => updateElementStyle('fontWeight', 'bold')}
                    className="flex-1"
                  >
                    בולט
                  </Button>
                </div>
              </div>

              {/* Gradient Background */}
              <div>
                <Label className="text-sm">גרדיאנט רקע</Label>
                <div className="space-y-2 mt-1">
                  <div className="flex gap-2">
                    <Button
                      variant={gradientType === 'linear' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGradientType('linear')}
                      className="flex-1"
                    >
                      ליניארי
                    </Button>
                    <Button
                      variant={gradientType === 'radial' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setGradientType('radial')}
                      className="flex-1"
                    >
                      עגול
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-2">
                    <Input
                      type="color"
                      defaultValue="#3b82f6"
                      className="w-full h-8 p-0 border-0"
                      onChange={(e) => {
                        const color2 = document.querySelector<HTMLInputElement>('input[data-gradient="color2"]')?.value || '#8b5cf6';
                        applyGradient(e.target.value, color2);
                      }}
                      data-gradient="color1"
                    />
                    <Input
                      type="color"
                      defaultValue="#8b5cf6"
                      className="w-full h-8 p-0 border-0"
                      onChange={(e) => {
                        const color1 = document.querySelector<HTMLInputElement>('input[data-gradient="color1"]')?.value || '#3b82f6';
                        applyGradient(color1, e.target.value);
                      }}
                      data-gradient="color2"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        const color1 = document.querySelector<HTMLInputElement>('input[data-gradient="color1"]')?.value || '#3b82f6';
                        const color2 = document.querySelector<HTMLInputElement>('input[data-gradient="color2"]')?.value || '#8b5cf6';
                        applyGradient(color1, color2);
                      }}
                      className="text-xs"
                    >
                      החל
                    </Button>
                  </div>
                  
                  {/* Predefined Gradients */}
                  <div className="grid grid-cols-4 gap-1">
                    {[
                      ['#ff6b6b', '#ffa500'],
                      ['#4ecdc4', '#44a08d'],
                      ['#667eea', '#764ba2'],
                      ['#f093fb', '#f5576c'],
                      ['#43e97b', '#38f9d7'],
                      ['#ffecd2', '#fcb69f'],
                      ['#a8edea', '#fed6e3'],
                      ['#d299c2', '#fef9d7']
                    ].map(([color1, color2], index) => (
                      <button
                        key={index}
                        className="w-8 h-8 rounded border-2 border-gray-300 hover:border-blue-500"
                        style={{ background: createGradient(color1, color2, gradientType) }}
                        onClick={() => applyGradient(color1, color2)}
                        title={`גרדיאנט ${index + 1}`}
                      />
                    ))}
                  </div>
                </div>
              </div>

              {/* Element Position Controls */}
              <div>
                <Label className="text-sm">מיקום אלמנט</Label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateElementStyle('position', 'relative')}
                  >
                    יחסי
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => updateElementStyle('position', 'absolute')}
                  >
                    מוחלט
                  </Button>
                </div>
                <div className="grid grid-cols-4 gap-1 mt-2">
                  <Input
                    type="number"
                    placeholder="Top"
                    className="text-xs"
                    onChange={(e) => updateElementStyle('top', `${e.target.value}px`)}
                  />
                  <Input
                    type="number"
                    placeholder="Right"
                    className="text-xs"
                    onChange={(e) => updateElementStyle('right', `${e.target.value}px`)}
                  />
                  <Input
                    type="number"
                    placeholder="Bottom"
                    className="text-xs"
                    onChange={(e) => updateElementStyle('bottom', `${e.target.value}px`)}
                  />
                  <Input
                    type="number"
                    placeholder="Left"
                    className="text-xs"
                    onChange={(e) => updateElementStyle('left', `${e.target.value}px`)}
                  />
                </div>
              </div>

              {/* Advanced Animations */}
              <div>
                <Label className="text-sm">אנימציות ואפקטים</Label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('transform', 'scale(1.1)');
                      updateElementStyle('transition', 'all 0.3s ease');
                    }}
                  >
                    הגדל
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('transform', 'rotate(5deg)');
                      updateElementStyle('transition', 'all 0.3s ease');
                    }}
                  >
                    סובב
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('transform', 'skew(5deg)');
                      updateElementStyle('transition', 'all 0.3s ease');
                    }}
                  >
                    נטה
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('boxShadow', '0 10px 25px rgba(0,0,0,0.2)');
                      updateElementStyle('transition', 'all 0.3s ease');
                    }}
                  >
                    צל
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('filter', 'blur(2px)');
                      updateElementStyle('transition', 'all 0.3s ease');
                    }}
                  >
                    טשטוש
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('opacity', '0.7');
                      updateElementStyle('transition', 'all 0.3s ease');
                    }}
                  >
                    שקוף
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('animation', 'pulse 2s infinite');
                    }}
                  >
                    פעימה
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('animation', 'bounce 1s infinite');
                    }}
                  >
                    קפיצה
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      updateElementStyle('transform', 'none');
                      updateElementStyle('transition', 'none');
                      updateElementStyle('boxShadow', 'none');
                      updateElementStyle('filter', 'none');
                      updateElementStyle('opacity', '1');
                      updateElementStyle('animation', 'none');
                    }}
                  >
                    אפס הכל
                  </Button>
                </div>
              </div>

              {/* Advanced Styling */}
              <div>
                <Label className="text-sm">סטיילינג מתקדם</Label>
                <div className="space-y-2 mt-1">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateElementStyle('borderStyle', 'dashed')}
                    >
                      מסגרת מקווקוו
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateElementStyle('borderStyle', 'dotted')}
                    >
                      מסגרת נקודות
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateElementStyle('textDecoration', 'underline')}
                    >
                      קו תחתון
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateElementStyle('textDecoration', 'line-through')}
                    >
                      קו חוצה
                    </Button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateElementStyle('textTransform', 'uppercase')}
                    >
                      אותיות גדולות
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateElementStyle('letterSpacing', '2px')}
                    >
                      ריווח אותיות
                    </Button>
                  </div>
                </div>
              </div>

              {/* Custom CSS */}
              <div>
                <Label className="text-sm">CSS מותאם</Label>
                <textarea
                  className="w-full mt-1 p-2 text-xs border rounded"
                  rows={3}
                  placeholder="color: red; font-size: 20px;"
                  onChange={(e) => {
                    if (!selectedElement) return;
                    try {
                      const styles = e.target.value.split(';');
                      styles.forEach(style => {
                        const [prop, value] = style.split(':');
                        if (prop && value) {
                          const camelProp = prop.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
                          selectedElement.style[camelProp as any] = value.trim();
                        }
                      });
                    } catch (e) {
                      
                    }
                  }}
                />
              </div>
            </div>
          )}

          {/* Save Button */}
          <Button onClick={saveChanges} className="w-full">
            <Save className="w-4 h-4 ml-2" />
            שמור שינויים
          </Button>
        </div>
      </div>

      {/* Selection Styles */}
      <style>{`
        .live-editor-selected {
          outline: 3px solid #3b82f6 !important;
          outline-offset: 2px !important;
          position: relative !important;
        }
        
        .live-editor-selected::after {
          content: "✏️ נבחר לעריכה • Alt+גרור להזזה";
          position: absolute;
          top: -30px;
          right: 0;
          background: #3b82f6;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          white-space: nowrap;
          z-index: 10000;
          pointer-events: none;
        }
        
        .live-editor-selected:hover {
          transform: scale(1.02);
          transition: transform 0.2s ease;
        }
        
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
        
        @keyframes bounce {
          0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
          40%, 43% { transform: translate3d(0,-10px,0); }
          70% { transform: translate3d(0,-5px,0); }
          90% { transform: translate3d(0,-2px,0); }
        }
        
        .live-ui-editor .creation-overlay {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(59, 130, 246, 0.1);
          cursor: crosshair;
          z-index: 9998;
        }
        
        .live-ui-editor * {
          pointer-events: auto !important;
        }
      `}</style>
    </>
  );
}