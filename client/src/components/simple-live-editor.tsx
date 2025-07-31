import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X, Eye, Edit3, Palette, Trash2, Copy } from "lucide-react";

interface SimpleLiveEditorProps {
  onClose: () => void;
}

export default function SimpleLiveEditor({ onClose }: SimpleLiveEditorProps) {
  const [isActive, setIsActive] = useState(false);
  const [selectedElement, setSelectedElement] = useState<HTMLElement | null>(null);
  const [isListening, setIsListening] = useState(false);

  const startEditing = () => {
    setIsActive(true);
    setIsListening(true);
    
    const handleClick = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      
      const target = e.target as HTMLElement;
      
      // Skip editor panel
      if (target.closest('.simple-live-editor')) return;
      
      // Remove previous selection
      document.querySelectorAll('.editor-selected').forEach(el => {
        el.classList.remove('editor-selected');
      });
      
      // Select new element
      target.classList.add('editor-selected');
      setSelectedElement(target);
    };
    
    document.addEventListener('click', handleClick, true);
    
    // Cleanup after 30 seconds
    setTimeout(() => {
      document.removeEventListener('click', handleClick, true);
      setIsListening(false);
    }, 30000);
  };

  const stopEditing = () => {
    setIsActive(false);
    setIsListening(false);
    setSelectedElement(null);
    
    // Remove all selections
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

  const changeText = (text: string) => {
    if (!selectedElement) return;
    
    if (selectedElement.tagName === 'INPUT' || selectedElement.tagName === 'TEXTAREA') {
      (selectedElement as HTMLInputElement).value = text;
    } else {
      selectedElement.textContent = text;
    }
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

  return (
    <div className="simple-live-editor fixed top-4 right-4 z-[9999] bg-white rounded-lg shadow-xl border w-72 max-h-[90vh] flex flex-col">
      <div className="flex items-center justify-between p-4 border-b bg-gray-50 rounded-t-lg">
        <h3 className="font-bold text-lg">עורך פשוט</h3>
        <Button variant="ghost" size="sm" onClick={onClose}>
          <X className="w-4 h-4" />
        </Button>
      </div>
        
        <div className="flex-1 overflow-y-auto p-4">

        {/* Quick Actions */}
        <div className="space-y-3">
          {!isActive ? (
            <Button onClick={startEditing} className="w-full">
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
                <div className="bg-green-50 p-2 rounded text-sm text-center">
                  🎯 לחץ על אלמנט במערכת לעריכה
                </div>
              )}
            </div>
          )}

          {/* Element Controls */}
          {selectedElement && (
            <div className="border-t pt-3 space-y-3">
              <div className="bg-blue-50 p-2 rounded text-sm text-center">
                ✅ אלמנט נבחר לעריכה
              </div>

              {/* Text Editing */}
              <div>
                <Label className="text-sm">שנה טקסט</Label>
                <Input
                  placeholder="טקסט חדש..."
                  className="mt-1"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      changeText(e.currentTarget.value);
                      e.currentTarget.value = '';
                    }
                  }}
                />
              </div>

              {/* Colors */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-sm">צבע טקסט</Label>
                  <Input
                    type="color"
                    className="mt-1 h-8"
                    onChange={(e) => changeColor(e.target.value)}
                  />
                </div>
                <div>
                  <Label className="text-sm">צבע רקע</Label>
                  <Input
                    type="color"
                    className="mt-1 h-8"
                    onChange={(e) => changeBackground(e.target.value)}
                  />
                </div>
              </div>

              {/* Font Size */}
              <div>
                <Label className="text-sm">גודל גופן</Label>
                <Input
                  type="number"
                  min="8"
                  max="72"
                  placeholder="16"
                  className="mt-1"
                  onChange={(e) => changeFontSize(e.target.value)}
                />
              </div>

              {/* Quick Colors */}
              <div>
                <Label className="text-sm">צבעים מהירים</Label>
                <div className="grid grid-cols-6 gap-1 mt-1">
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

              {/* Quick Styles */}
              <div>
                <Label className="text-sm">סגנונות מהירים</Label>
                <div className="grid grid-cols-2 gap-1 mt-1">
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.fontWeight = selectedElement.style.fontWeight === 'bold' ? 'normal' : 'bold')}>
                    מודגש
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.fontStyle = selectedElement.style.fontStyle === 'italic' ? 'normal' : 'italic')}>
                    נטוי
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.textDecoration = selectedElement.style.textDecoration === 'underline' ? 'none' : 'underline')}>
                    קו תחתון
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.borderRadius = selectedElement.style.borderRadius === '10px' ? '0px' : '10px')}>
                    עגול
                  </Button>
                </div>
              </div>

              {/* Animations */}
              <div>
                <Label className="text-sm">אנימציות</Label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.transform = 'scale(1.1)', selectedElement.style.transition = 'all 0.3s')}>
                    הגדל
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.transform = 'rotate(5deg)', selectedElement.style.transition = 'all 0.3s')}>
                    סובב
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.transform = 'none', selectedElement.style.transition = 'none')}>
                    אפס
                  </Button>
                </div>
              </div>

              {/* Position */}
              <div>
                <Label className="text-sm">מיקום</Label>
                <div className="grid grid-cols-4 gap-1 mt-1">
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.position = 'relative', selectedElement.style.top = '-5px')}>
                    ↑
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.position = 'relative', selectedElement.style.top = '5px')}>
                    ↓
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.position = 'relative', selectedElement.style.left = '-5px')}>
                    ←
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.position = 'relative', selectedElement.style.left = '5px')}>
                    →
                  </Button>
                </div>
              </div>

              {/* Gradients */}
              <div>
                <Label className="text-sm">גרדיאנטים</Label>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {[
                    'linear-gradient(45deg, #ff6b6b, #ffa500)',
                    'linear-gradient(45deg, #4ecdc4, #44a08d)',
                    'linear-gradient(45deg, #667eea, #764ba2)'
                  ].map((gradient, i) => (
                    <button
                      key={i}
                      className="w-full h-6 rounded border"
                      style={{ background: gradient }}
                      onClick={() => selectedElement && (selectedElement.style.background = gradient)}
                    />
                  ))}
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2">
                <Button size="sm" variant="outline" onClick={duplicateElement}>
                  <Copy className="w-3 h-3" />
                </Button>
                <Button size="sm" variant="outline" onClick={() => selectedElement && (selectedElement.style.display = selectedElement.style.display === 'none' ? '' : 'none')}>
                  👁️
                </Button>
                <Button size="sm" variant="destructive" onClick={deleteElement}>
                  <Trash2 className="w-3 h-3" />
                </Button>
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
          content: "✏️ נבחר";
          position: absolute;
          top: -25px;
          right: 0;
          background: #3b82f6;
          color: white;
          padding: 2px 6px;
          border-radius: 4px;
          font-size: 11px;
          z-index: 10000;
          pointer-events: none;
        }
      `}</style>
    </div>
  );
}