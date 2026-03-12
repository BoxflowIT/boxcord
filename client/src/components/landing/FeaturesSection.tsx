import { useTranslation } from 'react-i18next';
import {
  MessageSquare,
  Mic,
  Monitor,
  Paperclip,
  Bell,
  Laptop
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface Feature {
  icon: LucideIcon;
  titleKey: string;
  titleFallback: string;
  descKey: string;
  descFallback: string;
}

const FEATURES: Feature[] = [
  {
    icon: MessageSquare,
    titleKey: 'landing.featureChat',
    titleFallback: 'Channels & DMs',
    descKey: 'landing.featureChatDesc',
    descFallback:
      'Organize conversations in channels and threads, or send direct messages to colleagues.'
  },
  {
    icon: Mic,
    titleKey: 'landing.featureVoice',
    titleFallback: 'Voice calls',
    descKey: 'landing.featureVoiceDesc',
    descFallback:
      'Jump into voice channels with AI noise reduction and adjustable audio quality.'
  },
  {
    icon: Monitor,
    titleKey: 'landing.featureScreen',
    titleFallback: 'Screen sharing',
    descKey: 'landing.featureScreenDesc',
    descFallback:
      'Share your screen directly in the call — perfect for presentations and troubleshooting.'
  },
  {
    icon: Paperclip,
    titleKey: 'landing.featureFiles',
    titleFallback: 'Files & images',
    descKey: 'landing.featureFilesDesc',
    descFallback:
      'Drag and drop files, images and documents. Open SharePoint files directly.'
  },
  {
    icon: Bell,
    titleKey: 'landing.featureNotifications',
    titleFallback: 'Notifications & mentions',
    descKey: 'landing.featureNotificationsDesc',
    descFallback:
      'Push notifications on desktop and in the browser. @mention colleagues to get their attention.'
  },
  {
    icon: Laptop,
    titleKey: 'landing.featureDesktop',
    titleFallback: 'Desktop app',
    descKey: 'landing.featureDesktopDesc',
    descFallback:
      'Native app for Windows, macOS and Linux with auto-update and system notifications.'
  }
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          {t('landing.featuresHeading', 'Everything your team needs')}
        </h2>
        <p className="text-boxflow-muted text-center mb-14 max-w-xl mx-auto">
          {t(
            'landing.featuresSubheading',
            'One platform for communication, collaboration and file sharing.'
          )}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <div
                key={f.titleKey}
                className="bg-boxflow-darker/60 border border-boxflow-border-50 rounded-xl p-6 hover:border-boxflow-primary-30 transition-interactive group"
              >
                <div className="w-12 h-12 rounded-xl bg-boxflow-primary-10 flex items-center justify-center mb-4 group-hover:bg-boxflow-primary-20 transition-colors">
                  <Icon className="w-6 h-6 text-boxflow-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-white">
                  {t(f.titleKey, f.titleFallback)}
                </h3>
                <p className="text-boxflow-muted text-sm leading-relaxed">
                  {t(f.descKey, f.descFallback)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
