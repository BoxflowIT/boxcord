// Custom Login Page - Boxcord Design
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
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
  const { t } = useTranslation();
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
        setError(result.error || t('auth.loginFailed'));
        setIsLoggingIn(false);
        setLoading(false);
        return;
      }

      if (result.requiresNewPassword) {
        setError(t('auth.newPasswordRequired'));
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
      setError(t('common.unexpectedError'));
      setIsLoggingIn(false);
      setLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Boxcord"
      description={t('auth.welcomeBack')}
      footer={
        <span>
          {t('auth.noAccount') || 'Inget konto?'}{' '}
          <Link to="/signup" className="text-link hover:underline">
            {t('auth.createAccount') || 'Skapa konto'}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <FormField
          type="email"
          id="email"
          label={t('auth.email')}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@email.com"
          disabled={isLoggingIn}
          required
        />

        <FormField
          type="password"
          id="password"
          label={t('auth.password')}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isLoggingIn}
          required
        />

        {error && <Alert type="error" message={error} />}

        <div className="text-right">
          <Link to="/forgot-password" className="text-sm text-link">
            {t('auth.forgotPassword')}
          </Link>
        </div>

        <Button
          type="submit"
          disabled={isLoggingIn || !email || !password}
          className="w-full"
          size="lg"
        >
          {isLoggingIn ? t('auth.loggingIn') : t('auth.login')}
        </Button>
      </form>
    </AuthLayout>
  );
}
