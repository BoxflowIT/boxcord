// About Tab Component
import { APP_VERSION } from '../../utils/version';
import { useDesktop } from '../../hooks/useDesktop';
import { RefreshCw, AlertTriangle } from 'lucide-react';

export default function AboutTab() {
  const {
    isDesktop,
    version: desktopVersion,
    updateReady,
    updateAvailable,
    updateError,
    checkingUpdate,
    checkForUpdates,
    installUpdate
  } = useDesktop();

  return (
    <div className="space-y-6">
      <div className="text-gray-400">
        <h3 className="text-white font-semibold mb-4 text-xl">Boxcord</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm font-semibold text-gray-300">Version</p>
            <p className="text-sm">
              {isDesktop && desktopVersion
                ? `${desktopVersion} (desktop)`
                : APP_VERSION}
            </p>
          </div>
          {isDesktop && (
            <div className="flex flex-col gap-2">
              {updateReady ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-green-400">
                    Version {updateReady} ready to install
                  </span>
                  <button
                    onClick={installUpdate}
                    className="btn-primary text-xs px-3 py-1"
                  >
                    Restart now
                  </button>
                </div>
              ) : updateAvailable ? (
                <p className="text-sm text-blue-400">
                  Downloading version {updateAvailable}...
                </p>
              ) : (
                <button
                  onClick={checkForUpdates}
                  disabled={checkingUpdate}
                  className="flex items-center gap-2 text-sm text-gray-300 hover:text-white transition-colors disabled:opacity-50"
                >
                  <RefreshCw
                    size={14}
                    className={checkingUpdate ? 'animate-spin' : ''}
                  />
                  {checkingUpdate ? 'Checking...' : 'Check for updates'}
                </button>
              )}
              {updateError && (
                <p className="flex items-center gap-1.5 text-sm text-amber-400">
                  <AlertTriangle size={14} />
                  {updateError}
                </p>
              )}
            </div>
          )}
          <div className="border-t border-discord-darkest pt-4">
            <p className="text-sm font-semibold text-gray-300 mb-2">
              Privacy & Security
            </p>
            <ul className="text-sm space-y-2 list-disc list-inside">
              <li>Messages are encrypted in transit (TLS)</li>
              <li>Your online status is visible to workspace members</li>
              <li>Message history is stored securely</li>
              <li>Authentication via AWS Cognito</li>
            </ul>
          </div>
          <div className="border-t border-discord-darkest pt-4">
            <p className="text-sm font-semibold text-gray-300 mb-2">
              Technology Stack
            </p>
            <ul className="text-sm space-y-1">
              <li>• React + TypeScript</li>
              <li>• Socket.IO for real-time messaging</li>
              <li>• TanStack Query for data management</li>
              <li>• Tailwind CSS for styling</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
