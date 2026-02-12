// Login Page
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { token } = useAuthStore();

  // Redirect if already authenticated
  useEffect(() => {
    if (token || auth.isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [token, auth.isAuthenticated, navigate]);

  const handleCognitoLogin = () => {
    // Use react-oidc-context to redirect to Cognito
    auth.signinRedirect();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
      <div className="bg-discord-dark p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Boxcord</h1>
          <p className="text-discord-light">Boxflow intern chatt</p>
        </div>

        {/* Production login via Cognito */}
        <button
          onClick={handleCognitoLogin}
          disabled={auth.isLoading}
          className="w-full py-3 bg-discord-blurple hover:bg-discord-blurple/80 text-white font-semibold rounded transition-colors disabled:opacity-50"
        >
          {auth.isLoading ? 'Laddar...' : 'Logga in med Cognito'}
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Använder samma inloggning som Boxtime
        </p>
      </div>
    </div>
  );
}
