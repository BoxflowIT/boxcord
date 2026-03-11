/**
 * Microsoft 365 Integration Settings Tab
 * Connect/disconnect Microsoft 365 account.
 * OneDrive, Calendar, and SharePoint are accessed from the sidebar.
 */

import { microsoft365Api } from '../../services/api';
import { openExternalUrl } from '../../utils/platform';
import { toast } from '../../store/notification';
import {
  useMicrosoftStatus,
  useMicrosoftDisconnect
} from '../../hooks/queries/microsoft';

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

// ─── Main Tab ────────────────────────────────────────────────────────────────

export default function IntegrationsTab() {
  const { data: status, isLoading } = useMicrosoftStatus();
  const disconnect = useMicrosoftDisconnect();

  if (isLoading) {
    return (
      <div className="flex items-center gap-3 p-4 bg-boxflow-darker rounded-lg border border-boxflow-hover-50">
        <div className="animate-pulse h-5 w-40 bg-boxflow-hover rounded" />
      </div>
    );
  }

  // Feature not enabled
  if (status && !status.enabled) {
    return (
      <div className="p-4 bg-boxflow-darker rounded-lg border border-boxflow-hover-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gray-600/50 rounded-lg flex items-center justify-center opacity-50">
            <MicrosoftIcon />
          </div>
          <div>
            <p className="text-white/50 font-medium">Microsoft 365</p>
            <p className="text-sm text-boxflow-muted">
              Integrationen är inte aktiverad. Kontakta admin.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Connected
  if (status?.connected) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-boxflow-muted">
          Hantera din Microsoft 365-anslutning. OneDrive, Kalender och
          SharePoint nås via sidomenyn.
        </p>
        <div className="p-4 bg-boxflow-darker rounded-lg border border-boxflow-hover-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
                <MicrosoftIcon />
              </div>
              <div>
                <p className="text-white font-medium">Microsoft 365</p>
                <p className="text-sm text-green-400">
                  Ansluten som {status.email}
                </p>
              </div>
            </div>
            <button
              onClick={() => {
                disconnect.mutate(undefined, {
                  onSuccess: () => toast.success('Microsoft 365 frånkopplad'),
                  onError: () => toast.error('Kunde inte koppla från')
                });
              }}
              disabled={disconnect.isPending}
              className="px-4 py-2 text-sm bg-red-600/20 text-red-400 hover:bg-red-600/30 rounded-lg transition-colors"
            >
              {disconnect.isPending ? 'Kopplar från...' : 'Koppla från'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Not connected
  return (
    <div className="space-y-4">
      <p className="text-sm text-boxflow-muted">
        Koppla ditt Microsoft 365-konto för att komma åt OneDrive, Kalender och
        SharePoint direkt i sidomenyn.
      </p>
      <div className="p-4 bg-boxflow-darker rounded-lg border border-boxflow-hover-50">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center">
              <MicrosoftIcon />
            </div>
            <div>
              <p className="text-white font-medium">Microsoft 365</p>
              <p className="text-sm text-boxflow-muted">
                Koppla till OneDrive, Kalender & SharePoint
              </p>
            </div>
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
            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors"
          >
            Anslut
          </button>
        </div>
      </div>
    </div>
  );
}
