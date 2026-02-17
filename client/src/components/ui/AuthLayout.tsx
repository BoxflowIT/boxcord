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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#1e1f22] via-[#2b2d31] to-[#1e1f22]">
      <div className="bg-boxflow-dark p-10 rounded-2xl shadow-2xl w-full max-w-md border border-boxflow-hover/50 backdrop-blur-sm">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-[#5865f2] to-[#4752c4] rounded-2xl mx-auto mb-4 flex items-center justify-center shadow-lg shadow-[#5865f2]/20">
            <span className="text-5xl font-bold text-white">B</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{title}</h1>
          <p className="text-[#b5bac1] text-sm">{description}</p>
        </div>

        {children}

        {footer && (
          <p className="text-center text-sm text-[#80848e] mt-6">{footer}</p>
        )}
      </div>
    </div>
  );
}
