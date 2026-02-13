import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from './store/auth';
import Spinner from './components/ui/Spinner';
import Login from './pages/Login';
import Chat from './pages/Chat';
import AuthCallback from './pages/AuthCallback';

function App() {
  const { token, isLoading } = useAuthStore();
  const auth = useAuth();

  // User is authenticated via OIDC or has a token in store
  const isAuthenticated = token || auth.isAuthenticated;

  return (
    <>
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
    </>
  );
}

export default App;
