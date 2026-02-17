// Custom Login Page - Boxcord Design
import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import { signIn } from '../services/cognito';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { Button } from '../components/ui/button';
import { FormField } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';
import { AuthLayout } from '../components/ui/AuthLayout';
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
    <AuthLayout
      title="Boxcord"
      description="Välkommen tillbaka!"
      footer="Använder samma inloggning som Boxtime"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          type="email"
          id="email"
          label="E-postadress"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@email.com"
          disabled={isLoggingIn}
          required
        />

        <FormField
          type="password"
          id="password"
          label="Lösenord"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoggingIn}
          required
        />

        {error && <Alert type="error" message={error} />}

        <div className="text-right">
          <Link
            to="/forgot-password"
            className="text-sm text-link"
          >
            Glömt lösenord?
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoggingIn || !email || !password}
          className="w-full"
          size="lg"
        >
          {isLoggingIn ? 'Loggar in...' : 'Logga in'}
        </Button>
      </form>
    </AuthLayout>
  );
}
