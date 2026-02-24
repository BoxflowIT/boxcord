// Sign Up Page - Register new users with Cognito
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/auth';
import {
  signUp,
  confirmSignUp,
  resendConfirmationCode,
  signIn
} from '../services/cognito';
import { api } from '../services/api';
import { socketService } from '../services/socket';
import { Button } from '../components/ui/button';
import { FormField } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';
import { AuthLayout } from '../components/ui/AuthLayout';
import { logger } from '../utils/logger';

export default function SignUp() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { setAuth, setLoading } = useAuthStore();

  // Form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');

  // Verification state
  const [showVerification, setShowVerification] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [userSub, setUserSub] = useState('');

  // UI state
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = (): boolean => {
    if (!email || !password || !firstName || !lastName) {
      setError(t('auth.allFieldsRequired') || 'Alla fält måste fyllas i');
      return false;
    }

    if (password !== confirmPassword) {
      setError(t('auth.passwordMismatch') || 'Lösenorden matchar inte');
      return false;
    }

    if (password.length < 8) {
      setError(
        t('auth.passwordTooShort') || 'Lösenordet måste vara minst 8 tecken'
      );
      return false;
    }

    // Cognito password requirements: at least one uppercase, lowercase, number
    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasNumber) {
      setError(
        t('auth.passwordRequirements') ||
          'Lösenordet måste innehålla minst en stor bokstav, en liten bokstav och en siffra'
      );
      return false;
    }

    return true;
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      // Step 1: Sign up with Cognito
      const result = await signUp(email, password, firstName, lastName);

      if (!result.success) {
        setError(result.error || t('auth.signupFailed'));
        setIsSubmitting(false);
        return;
      }

      // Step 2: Show verification form
      setUserSub(result.userSub || '');
      setShowVerification(true);
      setSuccess(
        t('auth.verificationSent') ||
          'Verifieringskod skickad till din e-post! Kolla även skräpposten.'
      );
      setIsSubmitting(false);
    } catch (error) {
      logger.error('Sign up error:', error);
      setError(t('common.unexpectedError'));
      setIsSubmitting(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!verificationCode) {
      setError(t('auth.enterVerificationCode') || 'Ange verifieringskod');
      return;
    }

    setIsSubmitting(true);
    setLoading(true);

    try {
      // Step 1: Verify email with Cognito
      const verifyResult = await confirmSignUp(email, verificationCode);

      if (!verifyResult.success) {
        setError(verifyResult.error || t('auth.verificationFailed'));
        setIsSubmitting(false);
        setLoading(false);
        return;
      }

      // Step 2: Sign in automatically
      const loginResult = await signIn(email, password);

      if (!loginResult.success || !loginResult.idToken) {
        setError(
          t('auth.verificationSuccessLoginFailed') ||
            'Verifiering lyckades men inloggning misslyckades. Försök logga in manuellt.'
        );
        setIsSubmitting(false);
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
        return;
      }

      // Step 3: Store token temporarily
      setAuth(loginResult.idToken, {
        id: loginResult.user?.sub || userSub,
        email: loginResult.user?.email || email,
        firstName: loginResult.user?.given_name || firstName,
        lastName: loginResult.user?.family_name || lastName,
        role: 'STAFF' // Default role
      });

      // Step 4: Register user in Boxcord backend
      try {
        await api.post('/auth/register', {
          id: loginResult.user?.sub || userSub,
          email: loginResult.user?.email || email,
          firstName: loginResult.user?.given_name || firstName,
          lastName: loginResult.user?.family_name || lastName
        });

        // Step 5: Fetch full user data from backend
        const userData = await api.getCurrentUser();
        setAuth(loginResult.idToken, userData);

        // Step 6: Connect socket
        socketService.reconnect();

        setSuccess(
          t('auth.registrationComplete') || 'Registrering slutförd! Välkommen!'
        );
        setLoading(false);

        // Redirect to chat
        setTimeout(() => navigate('/chat', { replace: true }), 1000);
      } catch (apiError) {
        logger.error('Backend registration failed:', apiError);
        // User is verified in Cognito but not in backend - they can try logging in
        setError(
          t('auth.accountCreatedLoginManually') ||
            'Konto skapat men något gick fel. Försök logga in manuellt.'
        );
        setIsSubmitting(false);
        setLoading(false);
        setTimeout(() => navigate('/login'), 3000);
      }
    } catch (error) {
      logger.error('Verification error:', error);
      setError(t('common.unexpectedError'));
      setIsSubmitting(false);
      setLoading(false);
    }
  };

  const handleResendCode = async () => {
    setError('');
    setSuccess('');
    setIsSubmitting(true);

    try {
      const result = await resendConfirmationCode(email);

      if (result.success) {
        setSuccess(
          t('auth.verificationResent') || 'Ny verifieringskod skickad!'
        );
      } else {
        setError(result.error || t('auth.resendFailed'));
      }
    } catch (error) {
      logger.error('Resend code error:', error);
      setError(t('common.unexpectedError'));
    } finally {
      setIsSubmitting(false);
    }
  };

  if (showVerification) {
    return (
      <AuthLayout
        title={t('auth.verifyEmail') || 'Verifiera e-post'}
        description={
          t('auth.enterCodeSent') || 'Ange koden som skickades till din e-post'
        }
      >
        <form onSubmit={handleVerify} className="space-y-4">
          <FormField
            type="text"
            id="verificationCode"
            label={t('auth.verificationCode') || 'Verifieringskod'}
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="123456"
            disabled={isSubmitting}
            required
          />

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <Button
            type="submit"
            disabled={isSubmitting || !verificationCode}
            className="w-full"
            size="lg"
          >
            {isSubmitting
              ? t('auth.verifying') || 'Verifierar...'
              : t('auth.verify') || 'Verifiera'}
          </Button>

          <div className="text-center">
            <button
              type="button"
              onClick={handleResendCode}
              disabled={isSubmitting}
              className="text-sm text-link hover:underline disabled:opacity-50"
            >
              {t('auth.resendCode') || 'Skicka kod igen'}
            </button>
          </div>

          <div className="text-center text-sm text-text-muted">
            <button
              type="button"
              onClick={() => setShowVerification(false)}
              className="text-link hover:underline"
            >
              {t('auth.backToSignup') || 'Tillbaka till registrering'}
            </button>
          </div>
        </form>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={t('auth.createAccount') || 'Skapa konto'}
      description={
        t('auth.joinBoxcord') || 'Gå med i Boxcord för att börja chatta'
      }
      footer={
        <span>
          {t('auth.alreadyHaveAccount') || 'Har du redan ett konto?'}{' '}
          <Link to="/login" className="text-link hover:underline">
            {t('auth.login') || 'Logga in'}
          </Link>
        </span>
      }
    >
      <form onSubmit={handleSignUp} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            type="text"
            id="firstName"
            label={t('auth.firstName') || 'Förnamn'}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Anna"
            disabled={isSubmitting}
            required
          />

          <FormField
            type="text"
            id="lastName"
            label={t('auth.lastName') || 'Efternamn'}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Andersson"
            disabled={isSubmitting}
            required
          />
        </div>

        <FormField
          type="email"
          id="email"
          label={t('auth.email') || 'E-post'}
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="din@email.com"
          disabled={isSubmitting}
          required
        />

        <FormField
          type="password"
          id="password"
          label={t('auth.password') || 'Lösenord'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isSubmitting}
          required
        />

        <FormField
          type="password"
          id="confirmPassword"
          label={t('auth.confirmPassword') || 'Bekräfta lösenord'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
          disabled={isSubmitting}
          required
        />

        <div className="text-xs text-text-muted">
          {t('auth.passwordRequirementsText') ||
            'Lösenordet måste vara minst 8 tecken och innehålla minst en stor bokstav, en liten bokstav och en siffra.'}
        </div>

        {error && <Alert type="error" message={error} />}
        {success && <Alert type="success" message={success} />}

        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full"
          size="lg"
        >
          {isSubmitting
            ? t('auth.creatingAccount') || 'Skapar konto...'
            : t('auth.createAccount') || 'Skapa konto'}
        </Button>
      </form>
    </AuthLayout>
  );
}
