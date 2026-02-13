import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from './store/auth';
import { setQueryClient } from './services/socket';
import Spinner from './components/ui/Spinner';
import Login from './pages/Login';
import Chat from './pages/Chat';
import AuthCallback from './pages/AuthCallback';

// Create QueryClient with optimized settings
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false, // Discord-style: don't refetch on focus (WebSocket keeps data fresh)
      refetchOnReconnect: true
    }
  }
});

// Set queryClient for socket service to update cache directly
setQueryClient(queryClient);

function App() {
  const { token, isLoading } = useAuthStore();
  const auth = useAuth();

  // User is authenticated via OIDC or has a token in store
  const isAuthenticated = token || auth.isAuthenticated;

  return (
    <QueryClientProvider client={queryClient}>
      {isLoading && <Spinner />}
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route
          path="/chat/*"
          element={
            isAuthenticated ? <Chat /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="*"
          element={
            <Navigate to={isAuthenticated ? '/chat' : '/login'} replace />
          }
        />
      </Routes>
    </QueryClientProvider>
  );
}

export default App;
