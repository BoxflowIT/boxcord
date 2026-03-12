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
    titleFallback: 'Kanaler & DM',
    descKey: 'landing.featureChatDesc',
    descFallback:
      'Organisera konversationer i kanaler och trådar, eller skicka direktmeddelanden till kollegor.'
  },
  {
    icon: Mic,
    titleKey: 'landing.featureVoice',
    titleFallback: 'Röstsamtal',
    descKey: 'landing.featureVoiceDesc',
    descFallback:
      'Hoppa in i röstkanaler med AI-brusreducering och justerbar ljudkvalitet.'
  },
  {
    icon: Monitor,
    titleKey: 'landing.featureScreen',
    titleFallback: 'Skärmdelning',
    descKey: 'landing.featureScreenDesc',
    descFallback:
      'Dela din skärm direkt i samtalet — perfekt för presentationer och felsökning.'
  },
  {
    icon: Paperclip,
    titleKey: 'landing.featureFiles',
    titleFallback: 'Filer & bilder',
    descKey: 'landing.featureFilesDesc',
    descFallback:
      'Dra-och-släpp filer, bilder och dokument. Öppna SharePoint-filer direkt.'
  },
  {
    icon: Bell,
    titleKey: 'landing.featureNotifications',
    titleFallback: 'Notiser & mentions',
    descKey: 'landing.featureNotificationsDesc',
    descFallback:
      'Push-notiser på desktop och i webbläsaren. @-nämn kollegor för att fånga deras uppmärksamhet.'
  },
  {
    icon: Laptop,
    titleKey: 'landing.featureDesktop',
    titleFallback: 'Desktop-app',
    descKey: 'landing.featureDesktopDesc',
    descFallback:
      'Nativ app för Windows, macOS och Linux med auto-uppdatering och systemnotiser.'
  }
];

export function FeaturesSection() {
  const { t } = useTranslation();

  return (
    <section id="features" className="py-20 px-6">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          {t('landing.featuresHeading', 'Allt ditt team behöver')}
        </h2>
        <p className="text-boxflow-muted text-center mb-14 max-w-xl mx-auto">
          {t(
            'landing.featuresSubheading',
            'En plattform för kommunikation, samarbete och fildelning.'
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
