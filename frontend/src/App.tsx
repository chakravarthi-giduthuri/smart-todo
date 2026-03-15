import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { SideNav } from './components/layout/SideNav';
import { HomeScreen } from './screens/HomeScreen';
import { CalendarScreen } from './screens/CalendarScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { ShareScreen } from './screens/ShareScreen';
import { LoginScreen } from './screens/LoginScreen';
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
      <SideNav />
      <div className="ml-64 flex-1 min-w-0">
        <Routes>
          <Route path="/" element={<ProtectedRoute><HomeScreen /></ProtectedRoute>} />
          <Route path="/calendar" element={<ProtectedRoute><CalendarScreen /></ProtectedRoute>} />
          <Route path="/dashboard" element={<ProtectedRoute><DashboardScreen /></ProtectedRoute>} />
          <Route path="/settings" element={<ProtectedRoute><SettingsScreen /></ProtectedRoute>} />
        </Routes>
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
