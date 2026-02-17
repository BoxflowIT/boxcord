// Forgot Password Page - Boxcord Design
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, confirmPassword } from '../services/cognito';
import { Button } from '../components/ui/button';
import { FormField } from '../components/ui/FormField';
import { Alert } from '../components/ui/Alert';
import { AuthLayout } from '../components/ui/AuthLayout';
import { logger } from '../utils/logger';

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [step, setStep] = useState<'email' | 'confirm'>('email');
  const [email, setEmail] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmitEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);

    try {
      const result = await forgotPassword(email);

      if (!result.success) {
        setError(result.error || 'Kunde inte skicka återställningskod');
        setIsLoading(false);
        return;
      }

      setSuccess('En verifieringskod har skickats till din e-post!');
      setStep('confirm');
    } catch (error) {
      logger.error('Forgot password error:', error);
      setError('Ett oväntat fel uppstod');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    // Validate passwords match
    if (newPassword !== confirmNewPassword) {
      setError('Lösenorden matchar inte');
      return;
    }

    // Validate password strength (Cognito requires min 8 chars)
    if (newPassword.length < 8) {
      setError('Lösenordet måste vara minst 8 tecken');
      return;
    }

    setIsLoading(true);

    try {
      const result = await confirmPassword(
        email,
        verificationCode,
        newPassword
      );

      if (!result.success) {
        setError(result.error || 'Lösenordsåterställning misslyckades');
        setIsLoading(false);
        return;
      }

      setSuccess('Lösenord ändrat! Du kan nu logga in med ditt nya lösenord.');

      // Redirect to login after 2 seconds
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      logger.error('Reset password error:', error);
      setError('Ett oväntat fel uppstod');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AuthLayout
      title="Återställ lösenord"
      description={
        step === 'email'
          ? 'Ange din e-postadress för att få en återställningskod'
          : 'Ange verifieringskoden och ditt nya lösenord'
      }
    >
      {step === 'email' ? (
        <form onSubmit={handleSubmitEmail} className="space-y-4">
          <FormField
            type="email"
            id="email"
            label="E-postadress"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="din@email.com"
            disabled={isLoading}
            required
          />

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <Button
            type="submit"
            disabled={isLoading || !email}
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Skickar...' : 'Skicka återställningskod'}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-link"
            >
              Tillbaka till inloggning
            </Link>
          </div>
        </form>
      ) : (
        <form onSubmit={handleResetPassword} className="space-y-4">
          <FormField
            type="text"
            id="code"
            label="Verifieringskod"
            value={verificationCode}
            onChange={(e) => setVerificationCode(e.target.value)}
            placeholder="123456"
            disabled={isLoading}
            required
          />

          <FormField
            type="password"
            id="newPassword"
            label="Nytt lösenord"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••••"
            helperText="Minst 8 tecken"
            disabled={isLoading}
            minLength={8}
            required
          />

          <FormField
            type="password"
            id="confirmPassword"
            label="Bekräfta lösenord"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            placeholder="••••••••"
            disabled={isLoading}
            minLength={8}
            required
          />

          {error && <Alert type="error" message={error} />}
          {success && <Alert type="success" message={success} />}

          <Button
            type="submit"
            disabled={
              isLoading ||
              !verificationCode ||
              !newPassword ||
              !confirmNewPassword
            }
            className="w-full"
            size="lg"
          >
            {isLoading ? 'Återställer...' : 'Återställ lösenord'}
          </Button>

          <Button
            type="button"
            onClick={() => {
              setStep('email');
              setVerificationCode('');
              setNewPassword('');
              setConfirmNewPassword('');
              setError('');
              setSuccess('');
            }}
            variant="secondary"
            className="w-full"
          >
            Tillbaka
          </Button>
        </form>
      )}
    </AuthLayout>
  );
}
