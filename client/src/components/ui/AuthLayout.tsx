// Auth Layout - Wrapper for login/register pages
import { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { isDesktop } from '../../utils/platform';

interface AuthLayoutProps {
  title: string;
  description: string;
  children: ReactNode;
  footer?: ReactNode;
}

export function AuthLayout({
  title,
  description,
  children,
  footer
}: AuthLayoutProps) {
  return (
    <div className="min-h-screen flex items-center justify-center gradient-dark-bg">
      {!isDesktop() && (
        <Link
          to="/"
          className="fixed top-6 left-6 flex items-center gap-2 text-sm text-boxflow-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to home
        </Link>
      )}
      <div className="bg-boxflow-dark p-10 rounded-2xl shadow-2xl w-full max-w-md border border-boxflow-hover-50 backdrop-blur-sm animate-fade-in-up">
        <div className="text-center mb-8">
          <div className="w-20 h-20 gradient-primary-br rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-primary">
            <span className="text-5xl font-bold text-white">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">
            {title}
          </h1>
          <p className="text-boxflow-muted text-sm">{description}</p>
        </div>

        {children}

        {footer && (
          <p className="text-center text-sm text-boxflow-subtle mt-6">
            {footer}
          </p>
        )}
      </div>
    </div>
  );
}
