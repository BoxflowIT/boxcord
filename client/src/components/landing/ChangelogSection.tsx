import { useTranslation } from 'react-i18next';

const RELEASES = [
  {
    version: '1.14.0',
    date: '2026-03-11',
    itemKeys: [
      'landing.cl_1_14_0_prod',
      'landing.cl_1_14_0_cicd',
      'landing.cl_1_14_0_autoupdate'
    ]
  },
  {
    version: '1.13.0',
    date: '2026-03-11',
    itemKeys: [
      'landing.cl_1_13_0_sounds',
      'landing.cl_1_13_0_appearance',
      'landing.cl_1_13_0_threads',
      'landing.cl_1_13_0_polls',
      'landing.cl_1_13_0_desktop',
      'landing.cl_1_13_0_perf'
    ]
  }
] as const;

export function ChangelogSection() {
  const { t } = useTranslation();

  return (
    <section id="changelog" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          {t('landing.changelogHeading', 'Nyheter')}
        </h2>
        <p className="text-boxflow-muted text-center mb-14 max-w-xl mx-auto">
          {t(
            'landing.changelogSubheading',
            'Senaste uppdateringarna för Boxcord.'
          )}
        </p>

        <div className="space-y-8">
          {RELEASES.map((release) => (
            <article
              key={release.version}
              className="bg-boxflow-darker/60 border border-boxflow-border-50 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="badge-primary">v{release.version}</span>
                <span className="text-xs text-boxflow-subtle">
                  {release.date}
                </span>
              </div>
              <ul className="space-y-2">
                {release.itemKeys.map((key) => (
                  <li
                    key={key}
                    className="flex items-start gap-2 text-sm text-boxflow-muted"
                  >
                    <span className="text-boxflow-primary mt-1 shrink-0">
                      •
                    </span>
                    {t(key)}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
