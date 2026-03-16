import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SideNav } from './components/layout/SideNav';
import { BottomNav } from './components/layout/BottomNav';
import { useRealtimeSync } from './hooks/useRealtimeSync';

const HomeScreen      = lazy(() => import('./screens/HomeScreen').then(m => ({ default: m.HomeScreen })));
const CalendarScreen  = lazy(() => import('./screens/CalendarScreen').then(m => ({ default: m.CalendarScreen })));
const DashboardScreen = lazy(() => import('./screens/DashboardScreen').then(m => ({ default: m.DashboardScreen })));
const SettingsScreen  = lazy(() => import('./screens/SettingsScreen').then(m => ({ default: m.SettingsScreen })));
const ShareScreen     = lazy(() => import('./screens/ShareScreen').then(m => ({ default: m.ShareScreen })));
const LoginScreen     = lazy(() => import('./screens/LoginScreen').then(m => ({ default: m.LoginScreen })));
const DailyPlanScreen = lazy(() => import('./screens/DailyPlanScreen').then(m => ({ default: m.DailyPlanScreen })));
const TemplatesScreen = lazy(() => import('./screens/TemplatesScreen').then(m => ({ default: m.TemplatesScreen })));
const TimeBlockScreen = lazy(() => import('./screens/TimeBlockScreen').then(m => ({ default: m.TimeBlockScreen })));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 10 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AppRoutes() {
  const location = useLocation();
  const isSharePage = location.pathname.startsWith('/share/');
  const isLoginPage = location.pathname === '/login';
  useRealtimeSync();

  if (isSharePage || isLoginPage) {
    return (
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--app-bg)' }} />}>
        <Routes>
          <Route path="/login" element={<LoginScreen />} />
          <Route path="/share/:token" element={<ShareScreen />} />
          <Route path="*" element={<LoginScreen />} />
        </Routes>
      </Suspense>
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
        <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--app-bg)' }} />}>
          <Routes>
            <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
            <Route path="/calendar" element={<ProtectedRoute><CalendarScreen /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
            <Route path="/plan" element={<ProtectedRoute><DailyPlanScreen /></ProtectedRoute>} />
            <Route path="/timeline" element={<ProtectedRoute><TimeBlockScreen /></ProtectedRoute>} />
            <Route path="/templates" element={<ProtectedRoute><TemplatesScreen /></ProtectedRoute>} />
          </Routes>
        </Suspense>
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
