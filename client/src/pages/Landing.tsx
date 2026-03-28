import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { DownloadSection } from '../components/landing/DownloadSection';
import { FeaturesSection } from '../components/landing/FeaturesSection';
import { ChangelogSection } from '../components/landing/ChangelogSection';
import { MessageSquare, Mic, Monitor, Hash, Users, Shield } from 'lucide-react';

/** Fake app UI used as the hero screenshot. */
function AppScreenshot() {
  return (
    <div className="relative mx-auto max-w-5xl">
      {/* Glow behind the screenshot */}
      <div className="absolute -inset-4 bg-boxflow-primary/10 rounded-3xl blur-3xl pointer-events-none" />
      <div className="relative rounded-xl border border-boxflow-border-50 overflow-hidden shadow-2xl shadow-black/40 bg-boxflow-darkest">
        {/* Title bar */}
        <div className="flex items-center gap-2 px-4 py-2.5 bg-boxflow-darker border-b border-boxflow-border-50">
          <span className="w-3 h-3 rounded-full bg-red-500/80" />
          <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
          <span className="w-3 h-3 rounded-full bg-green-500/80" />
          <span className="ml-3 text-xs text-boxflow-subtle">
            Boxcord — Boxflow IT
          </span>
        </div>
        {/* App body */}
        <div className="flex h-[340px] sm:h-[400px] md:h-[460px]">
          {/* Sidebar */}
          <div className="w-16 shrink-0 bg-boxflow-darkest border-r border-boxflow-border-50 flex flex-col items-center pt-3 gap-2">
            <div className="w-10 h-10 rounded-2xl gradient-primary-br flex items-center justify-center text-white font-bold text-sm">
              B
            </div>
            <div className="w-8 h-[1px] bg-boxflow-border-50 my-1" />
            <div className="w-10 h-10 rounded-2xl bg-boxflow-hover flex items-center justify-center text-boxflow-muted text-xs">
              BF
            </div>
          </div>
          {/* Channel list */}
          <div className="w-48 hidden sm:flex flex-col bg-boxflow-darker border-r border-boxflow-border-50">
            <div className="px-3 py-3 text-xs font-semibold text-boxflow-subtle uppercase tracking-wider">
              Boxflow AB
            </div>
            <div className="px-2 space-y-0.5 text-sm">
              <div className="flex items-center gap-2 px-2 py-1.5 rounded bg-boxflow-hover text-white">
                <Hash className="w-4 h-4 text-boxflow-muted" />
                general
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded text-boxflow-muted hover:text-white">
                <Hash className="w-4 h-4" />
                design
              </div>
              <div className="flex items-center gap-2 px-2 py-1.5 rounded text-boxflow-muted hover:text-white">
                <Mic className="w-4 h-4" />
                Voice Lounge
              </div>
            </div>
          </div>
          {/* Chat area */}
          <div className="flex-1 flex flex-col">
            <div className="px-4 py-2.5 border-b border-boxflow-border-50 text-sm font-semibold text-white flex items-center gap-2">
              <Hash className="w-4 h-4 text-boxflow-muted" />
              general
            </div>
            <div className="flex-1 px-4 py-3 space-y-4 overflow-hidden">
              <ChatBubble
                name="Erik"
                color="text-blue-400"
                msg="Har ni sett den nya dashboarden? 🚀"
              />
              <ChatBubble
                name="Anna"
                color="text-green-400"
                msg="Ja! Ser riktigt bra ut. Skickade feedback i #design"
              />
              <ChatBubble
                name="Oscar"
                color="text-yellow-400"
                msg="Bra jobbat hela teamet 💪"
              />
            </div>
            {/* Composer */}
            <div className="px-4 py-3 border-t border-boxflow-border-50">
              <div className="rounded-lg bg-boxflow-hover px-4 py-2.5 text-sm text-boxflow-subtle">
                Message #general
              </div>
            </div>
          </div>
          {/* Member list */}
          <div className="w-48 hidden lg:flex flex-col bg-boxflow-darker border-l border-boxflow-border-50 p-3">
            <div className="text-[11px] font-semibold text-boxflow-subtle uppercase mb-2">
              Online — 3
            </div>
            <MemberRow name="Erik J." status="online" />
            <MemberRow name="Anna L." status="online" />
            <MemberRow name="Oscar S." status="online" />
            <div className="text-[11px] font-semibold text-boxflow-subtle uppercase mt-4 mb-2">
              Offline — 2
            </div>
            <MemberRow name="Sara K." status="offline" />
            <MemberRow name="Johan B." status="offline" />
          </div>
        </div>
      </div>
    </div>
  );
}

function ChatBubble({
  name,
  color,
  msg
}: {
  name: string;
  color: string;
  msg: string;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="w-8 h-8 rounded-full bg-boxflow-hover shrink-0 flex items-center justify-center text-xs font-semibold text-boxflow-muted">
        {name[0]}
      </div>
      <div>
        <span className={`text-sm font-semibold ${color}`}>{name}</span>
        <p className="text-sm text-boxflow-muted">{msg}</p>
      </div>
    </div>
  );
}

function MemberRow({
  name,
  status
}: {
  name: string;
  status: 'online' | 'offline';
}) {
  return (
    <div className="flex items-center gap-2 py-1">
      <div className="relative">
        <div className="w-7 h-7 rounded-full bg-boxflow-hover flex items-center justify-center text-[10px] font-semibold text-boxflow-muted">
          {name[0]}
        </div>
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-boxflow-darker ${status === 'online' ? 'bg-green-500' : 'bg-boxflow-subtle'}`}
        />
      </div>
      <span
        className={`text-xs ${status === 'online' ? 'text-boxflow-muted' : 'text-boxflow-subtle'}`}
      >
        {name}
      </span>
    </div>
  );
}

export default function Landing() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen gradient-dark-bg text-boxflow-light">
      {/* ── Header ─────────────────────────────────────── */}
      <header className="fixed top-0 inset-x-0 z-50 bg-boxflow-darkest/80 backdrop-blur-md border-b border-boxflow-border-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 gradient-primary-br rounded-lg flex items-center justify-center shadow-primary">
              <span className="text-xl font-bold text-white">B</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-white">
              Boxcord
            </span>
          </Link>
          <nav className="flex items-center gap-1">
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
            <Button asChild size="sm" className="ml-2">
              <Link to="/login">{t('auth.login', 'Login')}</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* ── Hero ───────────────────────────────────────── */}
      <section className="pt-32 pb-8 px-6 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-boxflow-primary/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute top-40 right-0 w-[400px] h-[400px] bg-boxflow-primary/3 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-4xl mx-auto text-center relative mb-14">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 bg-gradient-to-r from-white via-white to-boxflow-muted bg-clip-text text-transparent leading-[1.1]">
            {t('landing.heroTitle', 'Team chat for everyone')}
          </h1>
          <p className="text-lg sm:text-xl text-boxflow-muted max-w-2xl mx-auto mb-10 leading-relaxed">
            {t(
              'landing.heroDescription',
              'Messaging, voice calls, screen sharing and file management — all in one app built for your team.'
            )}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Button asChild size="lg" className="px-8 text-base">
              <a href="#download">{t('landing.download', 'Download')}</a>
            </Button>
            <Button
              asChild
              size="lg"
              variant="outline"
              className="px-8 text-base"
            >
              <Link to="/login">{t('landing.openApp', 'Open in browser')}</Link>
            </Button>
          </div>
        </div>

        {/* App screenshot */}
        <div className="px-2 sm:px-6">
          <AppScreenshot />
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <FeaturesSection />

      {/* ── Highlights ─────────────────────────────────── */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6">
          <HighlightCard
            icon={<Monitor className="w-6 h-6" />}
            badge={t('landing.highlightScreenBadge', 'Collaboration')}
            title={t('landing.highlightScreenTitle', 'Screen sharing & voice')}
            description={t(
              'landing.highlightScreenDesc',
              'Share your screen directly in voice channels. Perfect for presentations, pair programming and troubleshooting.'
            )}
          />
          <HighlightCard
            icon={<Shield className="w-6 h-6" />}
            badge={t('landing.highlightSecurityBadge', 'Security')}
            title={t('landing.highlightSecurityTitle', 'Private & secure')}
            description={t(
              'landing.highlightSecurityDesc',
              'Self-hosted on your own infrastructure. JWT authentication, input sanitization and XSS protection built in.'
            )}
          />
          <HighlightCard
            icon={<Users className="w-6 h-6" />}
            badge={t('landing.highlightIntegrationBadge', 'Integration')}
            title={t(
              'landing.highlightIntegrationTitle',
              'SharePoint & HelloFlow'
            )}
            description={t(
              'landing.highlightIntegrationDesc',
              'Access your SharePoint intranet directly inside Boxcord. Desktop app embeds HelloFlow for a seamless experience.'
            )}
          />
          <HighlightCard
            icon={<MessageSquare className="w-6 h-6" />}
            badge={t('landing.highlightThreadsBadge', 'Threads')}
            title={t(
              'landing.highlightThreadsTitle',
              'Threads, polls & bookmarks'
            )}
            description={t(
              'landing.highlightThreadsDesc',
              'Keep conversations organized with threads. Create polls, bookmark messages and search across all channels.'
            )}
          />
        </div>
      </section>

      {/* ── Download ───────────────────────────────────── */}
      <DownloadSection />

      {/* ── Changelog ──────────────────────────────────── */}
      <ChangelogSection />

      {/* ── Footer ─────────────────────────────────────── */}
      <footer className="border-t border-boxflow-border-50 py-14 px-6">
        <div className="max-w-6xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
          {/* Brand */}
          <div className="col-span-2 sm:col-span-1">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 gradient-primary-br rounded-lg flex items-center justify-center">
                <span className="text-base font-bold text-white">B</span>
              </div>
              <span className="font-bold text-white">Boxcord</span>
            </div>
            <p className="text-boxflow-subtle text-xs leading-relaxed">
              {t('landing.footerTagline', 'Team communication for Boxflow IT.')}
            </p>
          </div>
          {/* Product */}
          <div>
            <h4 className="font-semibold text-white mb-3">
              {t('landing.footerProduct', 'Product')}
            </h4>
            <ul className="space-y-2 text-boxflow-subtle">
              <li>
                <a
                  href="#features"
                  className="hover:text-white transition-colors"
                >
                  {t('landing.features', 'Features')}
                </a>
              </li>
              <li>
                <a
                  href="#download"
                  className="hover:text-white transition-colors"
                >
                  {t('landing.download', 'Download')}
                </a>
              </li>
              <li>
                <a
                  href="#changelog"
                  className="hover:text-white transition-colors"
                >
                  {t('landing.changelog', 'Changelog')}
                </a>
              </li>
            </ul>
          </div>
          {/* Resources */}
          <div>
            <h4 className="font-semibold text-white mb-3">
              {t('landing.footerResources', 'Resources')}
            </h4>
            <ul className="space-y-2 text-boxflow-subtle">
              <li>
                <a
                  href="https://github.com/BoxflowIT/boxcord"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  GitHub
                </a>
              </li>
              <li>
                <a
                  href="https://github.com/BoxflowIT/boxcord/issues"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  {t('landing.footerIssues', 'Report a bug')}
                </a>
              </li>
            </ul>
          </div>
          {/* Company */}
          <div>
            <h4 className="font-semibold text-white mb-3">
              {t('landing.footerCompany', 'Company')}
            </h4>
            <ul className="space-y-2 text-boxflow-subtle">
              <li>
                <a
                  href="https://boxflow.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  boxflow.com
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-10 pt-6 border-t border-boxflow-border-50 text-xs text-boxflow-subtle text-center">
          &copy; {new Date().getFullYear()} Boxflow IT
        </div>
      </footer>
    </div>
  );
}

function HighlightCard({
  icon,
  badge,
  title,
  description
}: {
  icon: React.ReactNode;
  badge: string;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-boxflow-border-50 bg-boxflow-darker/60 p-8 hover:border-boxflow-primary-30 transition-interactive group">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-boxflow-primary-10 flex items-center justify-center text-boxflow-primary group-hover:bg-boxflow-primary-20 transition-colors">
          {icon}
        </div>
        <span className="badge-primary text-[11px] uppercase tracking-wider">
          {badge}
        </span>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
      <p className="text-boxflow-muted text-sm leading-relaxed">
        {description}
      </p>
    </div>
  );
}
