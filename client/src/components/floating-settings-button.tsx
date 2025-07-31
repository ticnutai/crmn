import { useState } from "react";
import { Settings } from "lucide-react";
import ScrollableEditor from "./scrollable-editor";

export default function FloatingSettingsButton() {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  return (
    <>
      <div className="fixed top-6 left-6 z-50">
        <div 
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="w-10 h-10 bg-gray-600 text-white rounded-full shadow-md flex items-center justify-center cursor-pointer"
          title="הגדרות מערכת"
        >
          <Settings className="w-5 h-5" />
        </div>
      </div>

      {isSettingsOpen && (
        <ScrollableEditor 
          onClose={() => setIsSettingsOpen(false)}
        />
      )}
    </>
  );
}