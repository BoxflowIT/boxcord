// Forgot Password Page - Boxcord Design
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { forgotPassword, confirmPassword } from '../services/cognito';
import { Button } from '../components/ui/button';
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
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
      <div className="bg-discord-dark p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Återställ lösenord
          </h1>
          <p className="text-discord-light">
            {step === 'email'
              ? 'Ange din e-postadress för att få en återställningskod'
              : 'Ange verifieringskoden och ditt nya lösenord'}
          </p>
        </div>

        {step === 'email' ? (
          <form onSubmit={handleSubmitEmail} className="space-y-4">
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
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading || !email}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Skickar...' : 'Skicka återställningskod'}
            </Button>

            {/* Back to Login Link */}
            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-discord-blurple hover:text-discord-blurple-hover transition-colors"
              >
                Tillbaka till inloggning
              </Link>
            </div>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            {/* Verification Code Field */}
            <div>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Verifieringskod <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                id="code"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                required
                className="w-full px-3 py-2 bg-discord-darkest border border-discord-darker rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent"
                placeholder="123456"
                disabled={isLoading}
              />
            </div>

            {/* New Password Field */}
            <div>
              <label
                htmlFor="newPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Nytt lösenord <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                id="newPassword"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 bg-discord-darkest border border-discord-darker rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
              <p className="text-xs text-gray-500 mt-1">Minst 8 tecken</p>
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Bekräfta lösenord <span className="text-red-400">*</span>
              </label>
              <input
                type="password"
                id="confirmPassword"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 bg-discord-darkest border border-discord-darker rounded text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-discord-blurple focus:border-transparent"
                placeholder="••••••••"
                disabled={isLoading}
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/50 rounded text-red-400 text-sm">
                {error}
              </div>
            )}

            {/* Success Message */}
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/50 rounded text-green-400 text-sm">
                {success}
              </div>
            )}

            {/* Submit Button */}
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

            {/* Back Button */}
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
      </div>
    </div>
  );
}
