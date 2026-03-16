import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SideNav } from './components/layout/SideNav';
import { BottomNav } from './components/layout/BottomNav';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ShareScreen } from './screens/ShareScreen';
import { LoginScreen } from './screens/LoginScreen';
import { DailyPlanScreen } from './screens/DailyPlanScreen';
import { TimeBlockScreen } from './screens/TimeBlockScreen';
import { TemplatesScreen } from './screens/TemplatesScreen';
import { useRealtimeSync } from './hooks/useRealtimeSync';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, gcTime: 5 * 60_000, retry: 1, refetchOnWindowFocus: true },
  },
});

function AppRoutes() {
  const location = useLocation();
  const isSharePage = location.pathname.startsWith('/share/');
  const isLoginPage = location.pathname === '/login';
  useRealtimeSync();

  if (isSharePage || isLoginPage) {
    return (
      <Routes>
        <Route path="/login" element={<LoginScreen />} />
        <Route path="/share/:token" element={<ShareScreen />} />
        <Route path="*" element={<LoginScreen />} />
      </Routes>
    );
  }

  return (
    <div className="flex min-h-screen" style={{ background: 'var(--app-bg)' }}>
      {/* Sidebar — desktop only */}
      <div className="hidden md:block">
        <SideNav />
      </div>

      {/* Main content */}
      <div className="flex-1 min-w-0 md:ml-64">
        <Routes>
          <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarScreen /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
          <Route path="/plan" element={<ProtectedRoute><DailyPlanScreen /></ProtectedRoute>} />
          <Route path="/timeline" element={<ProtectedRoute><TimeBlockScreen /></ProtectedRoute>} />
          <Route path="/templates" element={<ProtectedRoute><TemplatesScreen /></ProtectedRoute>} />
        </Routes>
      </div>

      {/* Bottom nav — mobile only */}
      <div className="md:hidden">
        <BottomNav />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <QueryClientProvider client={queryClient}>
          <BrowserRouter>
            <AppRoutes />
          </BrowserRouter>
        </QueryClientProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
