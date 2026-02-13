// Auth Callback - Handles Cognito OAuth redirect
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../store/auth';
import { api } from '../services/api';
import { Button } from '../components/ui/button';

export default function AuthCallback() {
  const auth = useAuth();
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuthStore();

  useEffect(() => {
    const handleAuth = async () => {
      if (auth.isAuthenticated && auth.user) {
        setLoading(true);
        
        // First, store token and basic user info
        const token = auth.user.id_token || auth.user.access_token || '';
        const profile = auth.user.profile;

        setAuth(token, {
          id: profile.sub || '',
          email: profile.email || '',
          firstName:
            (profile.given_name as string) ||
            profile.email?.split('@')[0] ||
            'User',
          lastName: (profile.family_name as string) || '',
          role: 'STAFF' // Temporary, will be updated below
        });

        // Then fetch the actual user data from backend (includes correct role from DB)
        try {
          const userData = await api.getCurrentUser();
          setAuth(token, userData); // Update with correct role from database
        } catch (error) {
          console.error('Failed to fetch user data:', error);
        } finally {
          setLoading(false);
        }

        navigate('/chat', { replace: true });
      }
    };

    handleAuth();
  }, [auth.isAuthenticated, auth.user, setAuth, setLoading, navigate]);

  if (auth.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-discord-blurple mx-auto mb-4"></div>
          <p className="text-white">Loggar in...</p>
        </div>
      </div>
    );
  }

  if (auth.error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
        <div className="text-center">
          <p className="text-red-400 mb-4">
            Inloggningsfel: {auth.error.message}
          </p>
          <Button onClick={() => navigate('/login', { replace: true })}>
            Tillbaka till login
          </Button>
        </div>
      </div>
    );
  }

  return null;
}
