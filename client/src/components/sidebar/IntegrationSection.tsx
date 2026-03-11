/**
 * Sidebar section for Microsoft 365 integrations (OneDrive, Calendar, SharePoint).
 * Only visible when the feature is enabled and the user is connected.
 */

import { useNavigate, useLocation } from 'react-router-dom';
import { useMicrosoftStatus } from '../../hooks/queries/microsoft';
import { microsoft365Api } from '../../services/api';
import { toast } from '../../store/notification';
import { cn } from '../../utils/classNames';
import { openExternalUrl } from '../../utils/platform';
import { CloudIcon, CalendarIcon, GlobeIcon } from '../ui/Icons';

// ─── Icons ───────────────────────────────────────────────────────────────────

function MicrosoftIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

// ─── Integration items ───────────────────────────────────────────────────────

const INTEGRATION_ITEMS = [
  { id: 'onedrive', icon: CloudIcon, label: 'OneDrive' },
  { id: 'calendar', icon: CalendarIcon, label: 'Kalender' },
  { id: 'sharepoint', icon: GlobeIcon, label: 'SharePoint' }
] as const;

// ─── Component ───────────────────────────────────────────────────────────────

export default function IntegrationSection() {
  const navigate = useNavigate();
  const location = useLocation();
  const { data: status, isLoading } = useMicrosoftStatus();

  // Don't render anything while loading or if feature is disabled
  if (isLoading || !status?.enabled) return null;

  // Extract active integration type from URL
  const activeType = location.pathname.match(
    /\/chat\/integrations\/(onedrive|calendar|sharepoint)/
  )?.[1];

  // Not connected — show connect prompt
  if (!status.connected) {
    return (
      <div className="mt-3">
        <div className="px-3 py-2 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-semibold text-gray-400 uppercase">
            Microsoft 365
          </span>
        </div>
        <button
          onClick={async () => {
            try {
              const { url } = await microsoft365Api.getConnectUrl();
              openExternalUrl(url);
            } catch {
              toast.error('Kunde inte starta anslutningen');
            }
          }}
          className="w-full flex items-center gap-2 px-2 py-1.5 mx-1 rounded-lg text-sm text-boxflow-muted hover:text-white hover:bg-boxflow-hover/50 transition-colors cursor-pointer"
        >
          <MicrosoftIcon />
          <span>Anslut Microsoft 365</span>
        </button>
      </div>
    );
  }

  // Connected — show integration items
  return (
    <div className="mt-3">
      <div className="px-3 py-2 flex items-center justify-between flex-shrink-0">
        <span className="text-xs font-semibold text-gray-400 uppercase">
          Microsoft 365
        </span>
      </div>
      {INTEGRATION_ITEMS.map((item) => (
        <div
          key={item.id}
          className={cn(
            'group w-full flex items-center gap-1.5 px-2 py-1 rounded-lg text-sm transition-colors cursor-pointer mx-1',
            activeType === item.id ? 'nav-item-active' : 'nav-item-default'
          )}
          onClick={() => navigate(`/chat/integrations/${item.id}`)}
        >
          <span className="flex-shrink-0">
            <item.icon size="sm" className="text-boxflow-muted" />
          </span>
          <span className="truncate flex-1">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
