import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { DownloadSection } from '../components/landing/DownloadSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ChangelogSection } from '../components/landing/ChangelogSection';

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen gradient-dark-bg text-boxflow-light">
      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 bg-boxflow-darkest/80 backdrop-blur-md border-b border-boxflow-border-50">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 gradient-primary-br rounded-lg flex items-center justify-center shadow-primary">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Boxcord
            </span>
          </Link>
          <nav className="flex items-center gap-2">
            <a
              href="#features"
              className="hidden sm:inline-flex px-3 py-2 text-sm text-boxflow-muted hover:text-white transition-colors"
            >
              {t('landing.features', 'Features')}
            </a>
            <a
              href="#download"
              className="hidden sm:inline-flex px-3 py-2 text-sm text-boxflow-muted hover:text-white transition-colors"
            >
              {t('landing.download', 'Download')}
            </a>
            <a
              href="#changelog"
              className="hidden sm:inline-flex px-3 py-2 text-sm text-boxflow-muted hover:text-white transition-colors"
            >
              {t('landing.changelog', 'Changelog')}
            </a>
            <Link to="/login">
              <Button size="sm">{t('auth.login', 'Login')}</Button>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="pt-32 pb-20 px-6 relative overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-boxflow-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative">
          <div className="w-24 h-24 gradient-primary-br rounded-3xl mx-auto mb-8 flex items-center justify-center shadow-primary ring-1 ring-white/10">
            <span className="text-6xl font-bold text-white">B</span>
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-boxflow-muted bg-clip-text text-transparent">
            {t('landing.heroTitle', 'Team chat for everyone')}
          </h1>
          <p className="text-lg sm:text-xl text-boxflow-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            {t(
              'landing.heroDescription',
              'Messaging, voice calls, screen sharing and file management — all in one app built for your team.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" className="px-8 text-base">
                {t('landing.openApp', 'Open in browser')}
              </Button>
            </Link>
            <a href="#download">
              <Button size="lg" variant="outline" className="px-8 text-base">
                {t('landing.downloadDesktop', 'Download Desktop')}
              </Button>
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <FeaturesSection />

      {/* Download */}
      <DownloadSection />

      {/* Changelog */}
      <ChangelogSection />

      {/* Footer */}
      <footer className="border-t border-boxflow-border-50 py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-boxflow-subtle">
          <span>&copy; {new Date().getFullYear()} Boxflow IT</span>
          <div className="flex gap-6">
            <a
              href="https://boxflow.com"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              boxflow.com
            </a>
            <a
              href="https://github.com/BoxflowIT/boxcord"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
