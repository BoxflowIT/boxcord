import { useTranslation } from 'react-i18next';
import { useDetectedPlatform } from '../../hooks/useDetectedPlatform';
import { Download } from 'lucide-react';

const REPO = 'BoxflowIT/boxcord';
const LATEST_TAG = 'desktop-v1.14.0';
const VERSION = '1.14.0';

function downloadUrl(filename: string) {
  return `https://github.com/${REPO}/releases/download/${LATEST_TAG}/${filename}`;
}

function WindowsIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801" />
    </svg>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11" />
    </svg>
  );
}

function LinuxIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
      <path d="M12.504 0c-.155 0-.315.008-.48.021-4.226.333-3.105 4.807-3.17 6.298-.076 1.092-.3 1.953-1.05 3.02-.885 1.051-2.127 2.75-2.716 4.521-.278.832-.41 1.684-.287 2.489a.424.424 0 00-.11.135c-.26.268-.45.6-.663.839-.199.199-.485.267-.797.4-.313.136-.658.269-.864.68-.09.189-.136.394-.132.602 0 .199.027.4.055.536.058.399.116.728.04.97-.249.68-.28 1.145-.106 1.484.174.334.535.47.94.601.81.2 1.91.135 2.774.6.926.466 1.866.67 2.616.47.526-.116.97-.464 1.208-.946.587-.003 1.23-.269 2.26-.334.699-.058 1.574.267 2.577.2.025.134.063.198.114.333l.003.003c.391.778 1.113 1.368 1.884 1.43.39.033.77-.396 1.164-.664.29-.2.803-.263 1.119-.534.316-.272.465-.566.588-.88.123-.318.178-.601.267-.91.045-.16.094-.32.142-.481.394.26.85.435 1.348.396.932-.06 1.97-.934 1.588-2.35-.052-.2-.13-.297-.2-.4a1.6 1.6 0 00-.14-.234 3.12 3.12 0 01-.084-.135c-.082-.145-.05-.262.01-.404.062-.141.174-.243.252-.403.078-.16.103-.417 0-.66a.958.958 0 00-.273-.326 2.002 2.002 0 00-.36-.233 5.594 5.594 0 00-.397-.2 18.89 18.89 0 01-.484-.235c-.122-.068-.297-.058-.384-.197-.087-.14-.037-.332-.064-.532s-.06-.395-.13-.571c-.067-.176-.168-.327-.238-.468a3.267 3.267 0 01-.207-.578c-.014-.066-.026-.126-.038-.2-.04-.252-.06-.463.024-.672.084-.206.262-.334.412-.531.156-.195.296-.4.333-.691.06-.466.095-.78.121-1.14.043-.555-.048-.89-.193-1.2-.144-.307-.37-.526-.6-.786-.148-.169-.315-.29-.393-.466-.082-.178-.073-.38-.21-.6-.135-.216-.346-.31-.551-.392-.204-.081-.4-.134-.62-.24-.218-.107-.44-.277-.616-.47-.178-.2-.335-.375-.533-.545-.2-.167-.38-.262-.581-.351-.212-.089-.456-.145-.676-.264-.218-.12-.384-.267-.525-.46-.284-.38-.454-.87-.66-1.46-.208-.59-.382-1.18-.686-1.626a4.007 4.007 0 00-1.04-1.023c-.457-.314-.866-.49-1.234-.597-.353-.1-.653-.139-.921-.152z" />
    </svg>
  );
}

const PLATFORM_ICONS = {
  windows: WindowsIcon,
  mac: AppleIcon,
  linux: LinuxIcon,
  'linux-deb': LinuxIcon
} as const;

const PLATFORMS = [
  {
    id: 'windows' as const,
    label: 'Windows',
    file: `Boxcord.Setup.${VERSION}.exe`,
    description: 'Windows 10+'
  },
  {
    id: 'mac' as const,
    label: 'macOS',
    file: `Boxcord-${VERSION}-arm64.dmg`,
    description: 'macOS 12+ (Apple Silicon)'
  },
  {
    id: 'linux' as const,
    label: 'Linux',
    file: `Boxcord-${VERSION}.AppImage`,
    description: 'AppImage (alla distros)'
  },
  {
    id: 'linux-deb' as const,
    label: 'Linux (.deb)',
    file: `boxcord-desktop_${VERSION}_amd64.deb`,
    description: 'Ubuntu / Debian'
  }
] as const;

export function DownloadSection() {
  const { t } = useTranslation();
  const detected = useDetectedPlatform();

  return (
    <section id="download" className="py-20 px-6 bg-boxflow-darkest/40">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">
          {t('landing.downloadHeading', 'Ladda ner Boxcord')}
        </h2>
        <p className="text-boxflow-muted mb-12 max-w-xl mx-auto">
          {t(
            'landing.downloadSubheading',
            'Tillgänglig för Windows, macOS och Linux. Auto-uppdatering ingår.'
          )}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {PLATFORMS.map((p) => {
            const isPrimary = detected === p.id;
            const PlatformIcon = PLATFORM_ICONS[p.id];
            return (
              <a
                key={p.id}
                href={downloadUrl(p.file)}
                className={`flex items-center gap-4 p-5 rounded-xl border transition-interactive group ${
                  isPrimary
                    ? 'border-boxflow-primary bg-boxflow-primary-10'
                    : 'border-boxflow-border-50 bg-boxflow-darker/60 hover:border-boxflow-primary-30'
                }`}
              >
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${isPrimary ? 'bg-boxflow-primary-20' : 'bg-boxflow-hover'}`}
                >
                  <PlatformIcon className="w-5 h-5 text-boxflow-muted group-hover:text-white transition-colors" />
                </div>
                <div className="text-left flex-1 min-w-0">
                  <span className="font-semibold text-white block">
                    {p.label}
                  </span>
                  <span className="text-xs text-boxflow-subtle">
                    {p.description}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  {isPrimary && (
                    <span className="badge-primary text-xs">
                      {t('landing.recommended', 'Rekommenderad')}
                    </span>
                  )}
                  <Download className="w-4 h-4 text-boxflow-subtle group-hover:text-boxflow-primary transition-colors" />
                </div>
              </a>
            );
          })}
        </div>

        <p className="text-xs text-boxflow-subtle mt-6">
          v{VERSION} &middot;{' '}
          <a
            href={`https://github.com/${REPO}/releases/tag/${LATEST_TAG}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-link hover:underline"
          >
            {t('landing.releaseNotes', 'Release notes')}
          </a>
        </p>
      </div>
    </section>
  );
}
