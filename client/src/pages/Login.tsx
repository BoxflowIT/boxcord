// Login Page
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from 'react-oidc-context';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const auth = useAuth();
  const { setAuth, token } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already authenticated
  useEffect(() => {
    if (token || auth.isAuthenticated) {
      navigate('/chat', { replace: true });
    }
  }, [token, auth.isAuthenticated, navigate]);

  const handleDevLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // DEV MODE: Create a mock JWT for local development
      const userId = 'user-1';
      const mockToken = btoa(
        JSON.stringify({
          sub: userId,
          userId: userId,
          email: email || 'test@boxflow.se',
          'custom:role': 'ADMIN',
          role: 'ADMIN',
          exp: Math.floor(Date.now() / 1000) + 86400
        })
      );

      setAuth(`mock.${mockToken}.signature`, {
        id: userId,
        email: email || 'test@boxflow.se',
        firstName: 'Test',
        lastName: 'Användare',
        role: 'ADMIN'
      });

      navigate('/chat');
    } catch {
      setError('Login failed');
    } finally {
      setLoading(false);
    }
  };

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

        {error && (
          <div className="bg-red-500/20 border border-red-500 text-red-300 p-3 rounded mb-4">
            {error}
          </div>
        )}

        {/* Dev login - shown in dev mode */}
        {import.meta.env.DEV && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-discord-light mb-2">
              Email (dev mode)
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="dev@boxflow.se"
              className="w-full px-4 py-2 bg-discord-darkest border border-discord-darker rounded text-white placeholder-gray-500 focus:outline-none focus:border-discord-blurple"
            />
            <button
              onClick={handleDevLogin}
              disabled={loading}
              className="w-full mt-4 py-3 bg-discord-green hover:bg-discord-green/80 text-white font-semibold rounded transition-colors disabled:opacity-50"
            >
              {loading ? 'Loggar in...' : 'Dev Login'}
            </button>
          </div>
        )}

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
