import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Terminal } from 'lucide-react';

const REPO = 'BoxflowIT/boxcord';

// Fallback values used until the GitHub API responds (or if it fails)
const FALLBACK_TAG = 'desktop-v1.15.0';
const FALLBACK_VERSION = '1.15.0';

function useLatestDesktopRelease() {
  const [tag, setTag] = useState(FALLBACK_TAG);
  const [version, setVersion] = useState(FALLBACK_VERSION);

  useEffect(() => {
    const controller = new AbortController();

    fetch(`https://api.github.com/repos/${REPO}/releases?per_page=20`, {
      signal: controller.signal
    })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then(
        (
          releases: { tag_name: string; draft: boolean; prerelease: boolean }[]
        ) => {
          const latest = releases.find(
            (r) =>
              r.tag_name.startsWith('desktop-v') && !r.draft && !r.prerelease
          );
          if (latest) {
            setTag(latest.tag_name);
            setVersion(latest.tag_name.replace('desktop-v', ''));
          }
        }
      )
      .catch(() => {
        // Keep fallback values on error
      });

    return () => controller.abort();
  }, []);

  return { tag, version };
}

function downloadUrl(tag: string, filename: string) {
  return `https://github.com/${REPO}/releases/download/${tag}/${filename}`;
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
  return <Terminal className={className} />;
}

const PLATFORM_ICONS = {
  windows: WindowsIcon,
  mac: AppleIcon,
  linux: LinuxIcon,
  'linux-deb': LinuxIcon
} as const;

function getPlatforms(version: string) {
  return [
    {
      id: 'windows' as const,
      label: 'Windows',
      file: `Boxcord.Setup.${version}.exe`,
      description: 'Windows 10+'
    },
    {
      id: 'mac' as const,
      label: 'macOS',
      file: `Boxcord-${version}-arm64.dmg`,
      description: 'macOS 12+ (Apple Silicon)'
    },
    {
      id: 'linux' as const,
      label: 'Linux',
      file: `Boxcord-${version}.AppImage`,
      description: 'AppImage (all distros)'
    },
    {
      id: 'linux-deb' as const,
      label: 'Linux (.deb)',
      file: `boxcord-desktop_${version}_amd64.deb`,
      description: 'Ubuntu / Debian'
    }
  ];
}

export function DownloadSection() {
  const { t } = useTranslation();
  const { tag, version } = useLatestDesktopRelease();
  const platforms = getPlatforms(version);

  return (
    <section id="download" className="py-20 px-6 bg-boxflow-darkest/40">
      <div className="max-w-4xl mx-auto text-center">
        <h2 className="text-3xl font-bold mb-4">
          {t('landing.downloadHeading', 'Download Boxcord')}
        </h2>
        <p className="text-boxflow-muted mb-12 max-w-xl mx-auto">
          {t(
            'landing.downloadSubheading',
            'Available for Windows, macOS and Linux. Auto-update included.'
          )}
        </p>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {platforms.map((p) => {
            const PlatformIcon = PLATFORM_ICONS[p.id];
            return (
              <a
                key={p.id}
                href={downloadUrl(tag, p.file)}
                className="flex items-center gap-4 p-5 rounded-xl border border-boxflow-border-50 bg-boxflow-darker/60 hover:border-boxflow-primary-30 transition-interactive group"
              >
                <div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 bg-boxflow-hover">
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
                <Download className="w-4 h-4 text-boxflow-subtle group-hover:text-boxflow-primary transition-colors shrink-0" />
              </a>
            );
          })}
        </div>

        <p className="text-xs text-boxflow-subtle mt-6">v{version}</p>
      </div>
    </section>
  );
}
