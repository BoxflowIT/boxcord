import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ChangelogEntry {
  version: string;
  date: string;
  notes: Record<string, string[]>;
}

const INITIAL_VISIBLE = 2;

export function ChangelogSection() {
  const { t, i18n } = useTranslation();
  const [entries, setEntries] = useState<ChangelogEntry[]>([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetch('/changelog.json')
      .then((res) => (res.ok ? res.json() : []))
      .then((data: ChangelogEntry[]) => setEntries(data))
      .catch(() => setEntries([]));
  }, []);

  if (entries.length === 0) return null;

  const lang = i18n.language?.startsWith('sv') ? 'sv' : 'en';
  const visible = expanded ? entries : entries.slice(0, INITIAL_VISIBLE);
  const hasMore = entries.length > INITIAL_VISIBLE;

  return (
    <section id="changelog" className="py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <h2 className="text-3xl font-bold text-center mb-4">
          {t('landing.changelogHeading', 'Changelog')}
        </h2>
        <p className="text-boxflow-muted text-center mb-14 max-w-xl mx-auto">
          {t('landing.changelogSubheading', 'Latest updates for Boxcord.')}
        </p>

        <div className="space-y-8">
          {visible.map((entry) => (
            <article
              key={entry.version}
              className="bg-boxflow-darker/60 border border-boxflow-border-50 rounded-xl p-6"
            >
              <div className="flex items-center gap-3 mb-4">
                <span className="badge-primary">v{entry.version}</span>
                <span className="text-xs text-boxflow-subtle">
                  {entry.date}
                </span>
              </div>
              <ul className="space-y-2">
                {(entry.notes[lang] || entry.notes['en'] || []).map(
                  (note, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-2 text-sm text-boxflow-muted"
                    >
                      <span className="text-boxflow-primary mt-1 shrink-0">
                        •
                      </span>
                      {note}
                    </li>
                  )
                )}
              </ul>
            </article>
          ))}
        </div>

        {hasMore && (
          <div className="text-center mt-8">
            <button
              onClick={() => setExpanded(!expanded)}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-boxflow-muted hover:text-white border border-boxflow-border-50 hover:border-boxflow-primary-30 rounded-lg transition-colors"
            >
              {expanded
                ? t('landing.showLess', 'Show less')
                : t('landing.showMore', 'Show older versions')}
              {expanded ? (
                <ChevronUp className="w-4 h-4" />
              ) : (
                <ChevronDown className="w-4 h-4" />
              )}
            </button>
          </div>
        )}
      </div>
    </section>
  );
}
