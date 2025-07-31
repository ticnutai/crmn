import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Play, 
  RefreshCw, 
  Monitor,
  Network,
  Database,
  FileText,
  Settings,
  Bug
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface TestResult {
  id: string;
  name: string;
  status: 'passed' | 'failed' | 'warning' | 'running';
  description: string;
  details?: string;
  suggestions?: string[];
}

export default function SystemDiagnostics() {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [lastRunTime, setLastRunTime] = useState<Date | null>(null);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  const defaultTests: TestResult[] = [
    {
      id: 'database',
      name: 'בדיקת חיבור למסד נתונים',
      status: 'passed',
      description: 'בדיקת התחברות והגישה למסד הנתונים',
      details: 'כל השאילתות עובדות תקין'
    },
    {
      id: 'api',
      name: 'בדיקת API endpoints',
      status: 'passed',
      description: 'בדיקת כל נקודות הגישה של השרת',
      details: 'כל הנתיבים מגיבים בזמן תקין'
    },
    {
      id: 'authentication',
      name: 'מערכת אימות',
      status: 'warning',
      description: 'בדיקת מערכת ההתחברות והרשאות',
      details: 'מערכת עובדת אך יש המלצות לשיפור',
      suggestions: ['הוסף אימות דו-שלבי', 'שפר הצפנת סיסמאות']
    },
    {
      id: 'performance',
      name: 'ביצועי המערכת',
      status: 'passed',
      description: 'בדיקת זמני טעינה ותגובה',
      details: 'זמני תגובה: ממוצע 120ms'
    },
    {
      id: 'storage',
      name: 'נפח אחסון',
      status: 'warning',
      description: 'בדיקת שטח פנוי ושימוש במשאבים',
      details: 'שימוש: 65% מהשטח הזמין',
      suggestions: ['נקה קבצי log ישנים', 'שקול הרחבת שטח אחסון']
    },
    {
      id: 'security',
      name: 'אבטחת מידע',
      status: 'passed',
      description: 'סריקת פרצות אבטחה ונקודות תורפה',
      details: 'לא נמצאו פרצות אבטחה ידועות'
    },
    {
      id: 'backup',
      name: 'מערכת גיבוי',
      status: 'failed',
      description: 'בדיקת פעולת הגיבויים האוטומטיים',
      details: 'הגיבוי האחרון נכשל',
      suggestions: ['בדוק הגדרות הגיבוי', 'ודא שיש מקום פנוי', 'הפעל גיבוי ידני']
    },
    {
      id: 'integrations',
      name: 'אינטגרציות חיצוניות',
      status: 'passed',
      description: 'בדיקת חיבורים לשירותים חיצוניים',
      details: 'Google Drive API פעיל ותקין'
    }
  ];

  useEffect(() => {
    setTestResults(defaultTests);
    setLastRunTime(new Date());
  }, []);

  const runDiagnostics = async () => {
    setIsRunning(true);
    setProgress(0);
    
    // סימולציה של בדיקות
    for (let i = 0; i <= 100; i += 10) {
      await new Promise(resolve => setTimeout(resolve, 200));
      setProgress(i);
    }
    
    // עדכון תוצאות רנדומליות לדוגמה
    const updatedResults = defaultTests.map(test => ({
      ...test,
      status: Math.random() > 0.8 ? 'failed' : Math.random() > 0.6 ? 'warning' : 'passed'
    })) as TestResult[];
    
    setTestResults(updatedResults);
    setLastRunTime(new Date());
    setIsRunning(false);
    
    toast({
      title: "בדיקת מערכת הושלמה",
      description: "כל הבדיקות הסתיימו בהצלחה",
    });
  };

  const getStatusIcon = (status: TestResult['status']) => {
    switch (status) {
      case 'passed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-500" />;
      case 'warning':
        return <AlertTriangle className="w-5 h-5 text-yellow-500" />;
      case 'running':
        return <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />;
    }
  };

  const getStatusBadge = (status: TestResult['status']) => {
    const variants = {
      passed: "bg-green-100 text-green-800 border-green-200",
      failed: "bg-red-100 text-red-800 border-red-200",
      warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
      running: "bg-blue-100 text-blue-800 border-blue-200"
    };
    
    const labels = {
      passed: "תקין",
      failed: "נכשל",
      warning: "זקוק תשומת לב",
      running: "רץ"
    };
    
    return (
      <Badge className={`${variants[status]} border`}>
        {labels[status]}
      </Badge>
    );
  };

  const failedTests = testResults.filter(t => t.status === 'failed').length;
  const warningTests = testResults.filter(t => t.status === 'warning').length;
  const passedTests = testResults.filter(t => t.status === 'passed').length;

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">אבחון מערכת</h1>
          <p className="text-gray-600 mt-2">בדיקות תקינות ואיכות המערכת</p>
        </div>
        <Button 
          onClick={runDiagnostics}
          disabled={isRunning}
          className="bg-blue-600 hover:bg-blue-700"
        >
          {isRunning ? (
            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Play className="w-4 h-4 mr-2" />
          )}
          {isRunning ? 'רץ...' : 'הפעל בדיקות'}
        </Button>
      </div>

      {/* סיכום כללי */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-green-600">בדיקות תקינות</p>
                <p className="text-2xl font-bold text-green-700">{passedTests}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-yellow-600">זקוקות תשומת לב</p>
                <p className="text-2xl font-bold text-yellow-700">{warningTests}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-red-600">בדיקות נכשלות</p>
                <p className="text-2xl font-bold text-red-700">{failedTests}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-blue-600">סך הכל בדיקות</p>
                <p className="text-2xl font-bold text-blue-700">{testResults.length}</p>
              </div>
              <Monitor className="w-8 h-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* התקדמות */}
      {isRunning && (
        <Card>
          <CardContent className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">רץ בדיקות מערכת...</span>
                <span className="text-sm text-gray-500">{progress}%</span>
              </div>
              <Progress value={progress} className="w-full" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* מידע על הרצה אחרונה */}
      {lastRunTime && (
        <Alert>
          <Monitor className="w-4 h-4" />
          <AlertDescription>
            בדיקה אחרונה: {lastRunTime.toLocaleString('he-IL')}
          </AlertDescription>
        </Alert>
      )}

      {/* תוצאות בדיקות */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bug className="w-5 h-5" />
            תוצאות בדיקות מפורטות
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testResults.map((test) => (
              <div 
                key={test.id} 
                className="flex items-start justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <div className="flex items-start gap-3 flex-1">
                  {getStatusIcon(test.status)}
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium text-gray-900">{test.name}</h3>
                      {getStatusBadge(test.status)}
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{test.description}</p>
                    {test.details && (
                      <p className="text-xs text-gray-500">{test.details}</p>
                    )}
                    {test.suggestions && test.suggestions.length > 0 && (
                      <div className="mt-2">
                        <p className="text-xs font-medium text-gray-700">המלצות לתיקון:</p>
                        <ul className="text-xs text-gray-600 list-disc list-inside mt-1">
                          {test.suggestions.map((suggestion, index) => (
                            <li key={index}>{suggestion}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}