import { Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './store/auth';
import { useVoiceStore } from './store/voiceStore';
import { setQueryClient } from './services/socket';
import { useEffect } from 'react';
import Spinner from './components/ui/Spinner';
import { ErrorBoundary } from './components/utility';
import CustomLogin from './pages/CustomLogin';
import ForgotPassword from './pages/ForgotPassword';
import JoinPage from './pages/JoinPage';
import Chat from './pages/Chat';

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
  const resetVoiceStore = useVoiceStore((state) => state.reset);

  // Reset voice store on mount to clear any stale state
  useEffect(() => {
    resetVoiceStore();

    // Clean up old localStorage keys from previous versions
    const oldKeys = ['voiceStore', 'voice-storage', 'voice-state'];
    oldKeys.forEach((key) => {
      if (localStorage.getItem(key)) {
        localStorage.removeItem(key);
      }
    });

    // NOTE: Voice session cleanup is now handled in beforeunload (Chat.tsx)
    // using navigator.sendBeacon to ensure it completes before page unloads
  }, [resetVoiceStore, token]);

  // Apply saved appearance settings on mount
  useEffect(() => {
    // Apply theme
    const theme = localStorage.getItem('theme');
    if (theme === 'light') {
      document.documentElement.classList.add('light-theme');
    }

    // Apply font size
    const fontSize = localStorage.getItem('fontSize') || 'medium';
    const root = document.documentElement;
    root.style.setProperty(
      '--base-font-size',
      fontSize === 'small' ? '14px' : fontSize === 'large' ? '18px' : '16px'
    );
  }, []);

  // Initialize AudioContext on first user interaction (fix browser autoplay policy)
  useEffect(() => {
    const initAudioContext = async () => {
      // Create a temporary AudioContext to initialize it with user gesture
      const AudioContextClass =
        window.AudioContext || (window as any).webkitAudioContext;
      if (AudioContextClass) {
        try {
          const ctx = new AudioContextClass();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          // Remove listener after first successful init
          document.removeEventListener('click', initAudioContext);
          document.removeEventListener('keydown', initAudioContext);
        } catch (err) {
          console.error('Failed to initialize AudioContext:', err);
        }
      }
    };

    // Listen for first user interaction
    document.addEventListener('click', initAudioContext, { once: true });
    document.addEventListener('keydown', initAudioContext, { once: true });

    return () => {
      document.removeEventListener('click', initAudioContext);
      document.removeEventListener('keydown', initAudioContext);
    };
  }, []);

  // User is authenticated if token exists in store
  const isAuthenticated = !!token;

  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary>
        {isLoading && <Spinner />}
        <Routes>
          <Route path="/login" element={<CustomLogin />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route
            path="/join/:code"
            element={
              isAuthenticated ? <JoinPage /> : <Navigate to="/login" replace />
            }
          />
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
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App;
