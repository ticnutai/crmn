import { LayoutDashboard } from "lucide-react";
import WorkHoursCard from "@/components/work-hours-card";

export default function Dashboard() {
  return (
    <div className="p-6 space-y-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg">
            <LayoutDashboard className="w-7 h-7 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">לוח הבקרה</h1>
            <p className="text-gray-600 mt-1">סקירה כללית ומידע נוכחי על המערכת</p>
          </div>
        </div>
        
      </div>

      {/* Work Hours Only */}
      <div className="max-w-4xl mx-auto">
        <WorkHoursCard />
      </div>

      </div>
  );
}
