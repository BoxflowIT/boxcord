import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from './store/auth';
import Spinner from './components/ui/Spinner';
import Login from './pages/Login';
import Chat from './pages/Chat';
import AuthCallback from './pages/AuthCallback';

// Skapa QueryClient med optimerade inställningar
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Globala defaults för alla queries
      staleTime: 2 * 60 * 1000, // Data är "fresh" i 2 minuter
      gcTime: 5 * 60 * 1000, // Cache behålls i 5 minuter (tidigare cacheTime)
      retry: 1, // Försök max 1 gång vid fel
      refetchOnWindowFocus: true, // Refetch när användaren kommer tillbaka till fliken
      refetchOnReconnect: true // Refetch när internet kopplas på igen
    }
  }
});

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
