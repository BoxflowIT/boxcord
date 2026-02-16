// Custom Login Page - Boxcord Design
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { signIn } from '../services/cognito';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { Button } from '../components/ui/button';
import { logger } from '../utils/logger';

export default function CustomLogin() {
  const navigate = useNavigate();
  const { token, setAuth, setLoading } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (token) {
      navigate('/chat', { replace: true });
    }
  }, [token, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoggingIn(true);
    setLoading(true);

    try {
      // Authenticate with Cognito
      const result = await signIn(email, password);

      if (!result.success) {
        setError(result.error || 'Inloggningen misslyckades');
        setIsLoggingIn(false);
        setLoading(false);
        return;
      }

      if (result.requiresNewPassword) {
        setError('Nytt lösenord krävs. Kontakta administratör.');
        setIsLoggingIn(false);
        setLoading(false);
        return;
      }

      // Store token and basic user info
      const idToken = result.idToken!;
      setAuth(idToken, {
        id: result.user?.sub || '',
        email: result.user?.email || email,
        firstName: result.user?.given_name || email.split('@')[0],
        lastName: result.user?.family_name || '',
        role: 'STAFF' // Temporary, will be updated below
      });

      // Fetch actual user data from backend (includes correct role from DB)
      try {
        const userData = await api.getCurrentUser();
        setAuth(idToken, userData); // Update with correct role from database

        // Connect socket with new token
        socketService.reconnect();
      } catch (error) {
        logger.error('Failed to fetch user data:', error);
      } finally {
        setLoading(false);
      }

      navigate('/chat', { replace: true });
    } catch (error) {
      logger.error('Login error:', error);
      setError('Ett oväntat fel uppstod vid inloggning');
      setIsLoggingIn(false);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
      <div className="bg-discord-dark p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Boxcord</h1>
          <p className="text-discord-light">Välkommen tillbaka!</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email Field */}
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              E-postadress <span className="text-red-400">*</span>
            </label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 bg-discord-darkest border border-discord-darker rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent"
              placeholder="din@email.com"
              disabled={isLoggingIn}
            />
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
              Lösenord <span className="text-red-400">*</span>
            </label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-3 py-2 bg-discord-darkest border border-discord-darker rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent"
              placeholder="••••••••"
              disabled={isLoggingIn}
            />
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Forgot Password Link */}
          <div className="text-right">
            <Link
              to="/forgot-password"
              className="text-sm text-discord-blurple hover:text-discord-blurple-hover transition-colors"
            >
              Glömt lösenord?
            </Link>
          </div>

          {/* Submit Button */}
          <Button
            type="submit"
            disabled={isLoggingIn || !email || !password}
            className="w-full"
            size="lg"
          >
            {isLoggingIn ? 'Loggar in...' : 'Logga in'}
          </Button>
        </form>

        <p className="text-center text-sm text-gray-500 mt-6">
          Använder samma inloggning som Boxtime
        </p>
      </div>
    </div>
  );
}
