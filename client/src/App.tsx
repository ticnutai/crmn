import { useState, lazy } from "react";
import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Button } from "@/components/ui/button";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import ClientsNew from "@/pages/clients-new";
import ClientDetail from "@/pages/client-detail";
import Users from "@/pages/users";
import Reports from "@/pages/reports";
import Backup from "@/pages/backup";
import InvoicesPage from "@/pages/invoices";
import FinancialReports from "@/pages/financial-reports";
import ClientFiles from "@/pages/client-files";
import NotificationsPage from "@/pages/notifications";
import ChatPage from "@/pages/chat";
import PaymentStages from "@/pages/payment-stages";
import ImportClients from "@/pages/import-clients";
import ExportDataPage from "@/pages/export-data";
import TestFiles from "@/pages/test-files";
import SystemDiagnostics from "@/pages/system-diagnostics";
import SystemStatusPage from "@/pages/system-status";

import Sidebar from "@/components/sidebar";
import TopBar from "@/components/top-bar";
import SettingsPanel from "@/components/settings-panel";
import FloatingTimerCustom from "@/components/floating-timer-custom";
import FloatingSettingsButton from "@/components/floating-settings-button";
import PerformanceOptimizer from "@/components/performance-optimizer";
import NotificationSystem from "@/components/notification-system";
import ChatVideoSystem from "@/components/chat-video-system";
import DraggableButton from "@/components/draggable-button";
import MobileSidebar from "@/components/mobile-sidebar";
import { LoginScreen } from "@/components/login-screen";
import { useAuth } from "@/hooks/useAuth";
import { SimpleAuthProvider, useSimpleAuth } from "@/hooks/use-simple-auth";
// import { NotificationProvider } from '@/hooks/use-notification-system';
import TestNotifications from "@/components/test-notifications";
import SimpleLoginPage from "@/pages/simple-login-page";
import QuickLogin from "@/components/quick-login";
import { useTheme } from "@/hooks/use-theme";
// Temporarily disabled - causing stability issues
// import { useAutoBackup } from "@/hooks/use-auto-backup";
// import { useSilentSync } from "@/hooks/use-silent-sync";
// import { useDataSync } from "@/hooks/use-data-sync";
// import { useOfflineStorage } from "@/hooks/use-offline-storage";
import { useIsMobile } from "@/hooks/use-mobile";

// Clean console for better performance

function Router() {
  const { user, isAuthenticated } = useAuth();

  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/clients" component={ClientsNew} />

      <Route path="/client/:id" component={ClientDetail} />
      <Route path="/import-clients" component={ImportClients} />
      <Route path="/export-data" component={ExportDataPage} />
      <Route path="/test-files" component={TestFiles} />
      <Route path="/client-files" component={ClientFiles} />
      <Route path="/users" component={Users} />
      <Route path="/payment-stages" component={PaymentStages} />
      <Route path="/reports" component={Reports} />
      <Route path="/backup" component={Backup} />
      <Route path="/invoices" component={InvoicesPage} />
      <Route path="/financial-reports" component={FinancialReports} />
      <Route path="/notifications" component={NotificationsPage} />
      <Route path="/chat" component={ChatPage} />
      <Route path="/system-diagnostics" component={SystemDiagnostics} />
      <Route path="/system-status" component={SystemStatusPage} />
      <Route path="/login" component={SimpleLoginPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppContent() {
  const { user, login, logout, isLoading } = useAuth();
  const { user: simpleUser, loading: simpleLoading } = useSimpleAuth();
  const { currentTheme, changeTheme } = useTheme();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const isMobile = useIsMobile();
  // useAutoBackup(); // מבוטל - יופעל רק בעמוד הגיבויים

  // הוסר סנכרון רקע שגורם לבעיות - חזרה לפונקציונליות בסיסית

  if (isLoading || simpleLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p className="text-indigo-700">טוען...</p>
        </div>
      </div>
    );
  }

  if (!simpleUser) {
    return <QuickLogin />;
  }

  // דרישת התחברות מופעלת כעת - כל משתמש צריך אימייל ייחודי
  // זמנית מאפשר גישה ללא התחברות לצורך פיתוח
  // if (!user) {
  //   return <LoginScreen />;
  // }

  return (
    <TooltipProvider>
      <div className={`flex h-screen bg-slate-50 ${currentTheme}`} dir="rtl">
        {!isMobile && <Sidebar />}
        {isMobile && <MobileSidebar />}
        <main className={`flex-1 flex flex-col overflow-hidden ${isMobile ? 'w-full' : ''}`}>
          {!isMobile && <TopBar onSettingsClick={() => setIsSettingsOpen(true)} />}
          <div className={`flex-1 overflow-y-auto ${isMobile ? 'pt-16' : ''}`}>
            <Router />
          </div>
        </main>
        <FloatingTimerCustom />
        <FloatingSettingsButton />





        {/* Chat Toggle Button */}
        {false && user && !isChatOpen && (
          <DraggableButton
            initialPosition={{ x: 300, y: 400 }}
            storageKey="chat-button-position"
            className="z-40"
          >
            <Button
              onClick={() => setIsChatOpen(true)}
              className="w-14 h-14 rounded-full shadow-lg bg-green-500 hover:bg-green-600 text-white"
              title="פתח צ'אט"
            >
              💬
            </Button>
          </DraggableButton>
        )}

        {/* Test Notifications - מבוטל זמנית */}
        {false && <TestNotifications />}
      </div>
      <Toaster />
    </TooltipProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SimpleAuthProvider>

          <AppContent />

      </SimpleAuthProvider>
    </QueryClientProvider>
  );
}

export default App;