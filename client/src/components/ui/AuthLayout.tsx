// Auth Layout - Wrapper for login/register pages
import { ReactNode } from 'react';

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
    <div className="min-h-screen flex items-center justify-center bg-discord-darkest">
      <div className="bg-discord-dark p-8 rounded-lg shadow-xl w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">{title}</h1>
          <p className="text-discord-light">{description}</p>
        </div>

        {children}

        {footer && (
          <p className="text-center text-sm text-gray-500 mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
