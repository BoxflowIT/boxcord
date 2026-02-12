// Login Page
// In production, this would redirect to Cognito hosted UI
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

export default function Login() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleDevLogin = async () => {
    setLoading(true);
    setError('');

    try {
      // DEV MODE: Create a mock JWT for local development
      // In production, this would redirect to Cognito
      // Use user-1 to match seeded data
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
    // Redirect to Cognito hosted UI
    const cognitoDomain = import.meta.env.VITE_COGNITO_DOMAIN;
    const clientId = import.meta.env.VITE_COGNITO_CLIENT_ID;
    
    if (!cognitoDomain || !clientId) {
      setError('Cognito är inte konfigurerat. Använd dev-login.');
      return;
    }
    
    const cognitoUrl = `https://${cognitoDomain}/login`;
    const params = new URLSearchParams({
      client_id: clientId,
      response_type: 'code',
      scope: 'openid email profile',
      redirect_uri: `${window.location.origin}/auth/callback`
    });
    window.location.href = `${cognitoUrl}?${params}`;
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

        {/* Dev login - shown when Cognito is not configured or in dev mode */}
        {(import.meta.env.DEV || !import.meta.env.VITE_COGNITO_DOMAIN) && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-discord-light mb-2">
              Email {import.meta.env.DEV ? '(dev mode)' : '(demo)'}
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
          className="w-full py-3 bg-discord-blurple hover:bg-discord-blurple/80 text-white font-semibold rounded transition-colors"
        >
          Logga in med Boxtime
        </button>

        <p className="text-center text-sm text-gray-500 mt-6">
          Använder samma inloggning som Boxtime
        </p>
      </div>
    </div>
  );
}
