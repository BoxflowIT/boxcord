/**
 * Integration View — main content area for Microsoft 365 integrations.
 * Renders OneDrive / Calendar / SharePoint based on the :type route param.
 */

import { useParams, Navigate } from 'react-router-dom';
import {
  useMicrosoftStatus,
  useMicrosoftDisconnect
} from '../../hooks/queries/microsoft';
import { toast } from '../../store/notification';
import { CloudIcon, CalendarIcon, GlobeIcon } from '../ui/Icons';
import { OneDriveView } from './OneDriveView';
import { CalendarView } from './CalendarView';
import { SharePointView } from './SharePointView';

// ─── Icons ───────────────────────────────────────────────────────────────────

function MicrosoftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 21 21" fill="none">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  );
}

// ─── Header labels ───────────────────────────────────────────────────────────

const TITLES: Record<string, { icon: typeof CloudIcon; label: string }> = {
  onedrive: { icon: CloudIcon, label: 'OneDrive' },
  calendar: { icon: CalendarIcon, label: 'Kalender' },
  sharepoint: { icon: GlobeIcon, label: 'SharePoint' }
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function IntegrationView() {
  const { type } = useParams<{ type: string }>();
  const { data: status, isLoading } = useMicrosoftStatus();
  const disconnect = useMicrosoftDisconnect();

  // Invalid type → redirect to welcome
  if (!type || !TITLES[type]) {
    return <Navigate to="/chat" replace />;
  }

  const { icon: Icon, label } = TITLES[type];

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-boxflow-muted">Laddar...</div>
      </div>
    );
  }

  if (!status?.connected) {
    return (
      <div className="flex-1 flex items-center justify-center text-boxflow-muted">
        Anslut Microsoft 365 i sidomenyn för att använda {label}.
      </div>
    );
  }

  return (
    <>
      {/* Header */}
      <div className="h-12 border-b border-boxflow-hover-50 flex items-center justify-between px-4 flex-shrink-0 bg-boxflow-dark">
        <div className="flex items-center gap-2">
          <Icon size="md" className="text-white" />
          <h2 className="text-white font-semibold text-base">{label}</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-green-400">
            <MicrosoftIcon />
            <span>{status.email}</span>
          </div>
          <button
            onClick={() => {
              disconnect.mutate(undefined, {
                onSuccess: () => toast.success('Microsoft 365 frånkopplad'),
                onError: () => toast.error('Kunde inte koppla från')
              });
            }}
            className="text-xs text-red-400 hover:text-red-300 transition-colors"
          >
            Koppla från
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {type === 'onedrive' && <OneDriveView />}
        {type === 'calendar' && <CalendarView />}
        {type === 'sharepoint' && <SharePointView />}
      </div>
    </>
  );
}
