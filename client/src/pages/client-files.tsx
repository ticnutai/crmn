import { FolderOpen } from "lucide-react";
import ClientFileManager from "@/components/client-file-manager";

export default function ClientFiles() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-blue-600 rounded-lg flex items-center justify-center shadow-lg">
            <FolderOpen className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">קבצי לקוחות</h1>
            <p className="text-gray-600 mt-1">ניהול קבצים ומסמכים ללקוחות</p>
          </div>
        </div>
      </div>

      <ClientFileManager />
    </div>
  );
}