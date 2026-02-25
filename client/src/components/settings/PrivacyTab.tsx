/**
 * Privacy Settings Tab
 * Control privacy-related features like read receipts, typing indicators, etc.
 */

import { useTranslation } from 'react-i18next';
import { useLocalStorage } from '../../hooks/useLocalStorage';
import { cn } from '../../utils/classNames';

export default function PrivacyTab() {
  const { t } = useTranslation();

  const [showReadReceipts, setShowReadReceipts] = useLocalStorage(
    'showReadReceipts',
    true
  );
  const [showTypingIndicators, setShowTypingIndicators] = useLocalStorage(
    'showTypingIndicators',
    true
  );
  const [showOnlineStatus, setShowOnlineStatus] = useLocalStorage(
    'showOnlineStatus',
    true
  );
  const [allowDMs, setAllowDMs] = useLocalStorage('allowDMs', true);
  const [showActivity, setShowActivity] = useLocalStorage('showActivity', true);

  return (
    <div className="space-y-6">
      {/* Read Receipts */}
      <div>
        <label className="flex items-center justify-between p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover cursor-pointer hover:bg-boxflow-hover/50 transition-colors">
          <div>
            <span className="text-white font-medium">
              ✓ {t('settings.readReceipts')}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Let others see when you've read their messages
            </p>
          </div>
          <input
            type="checkbox"
            checked={showReadReceipts}
            onChange={(e) => setShowReadReceipts(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-boxflow-darkest text-boxflow-accent focus:ring-2 focus:ring-boxflow-accent focus:ring-offset-2 focus:ring-offset-boxflow-dark"
          />
        </label>
        {!showReadReceipts && (
          <p className="text-xs text-yellow-400 mt-2 ml-4">
            ⚠️ Disabling this also hides read receipts from you
          </p>
        )}
      </div>

      {/* Typing Indicators */}
      <div>
        <label className="flex items-center justify-between p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover cursor-pointer hover:bg-boxflow-hover/50 transition-colors">
          <div>
            <span className="text-white font-medium">
              ⌨️ {t('settings.typingIndicators')}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Show "typing..." when someone is writing a message
            </p>
          </div>
          <input
            type="checkbox"
            checked={showTypingIndicators}
            onChange={(e) => setShowTypingIndicators(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-boxflow-darkest text-boxflow-accent focus:ring-2 focus:ring-boxflow-accent focus:ring-offset-2 focus:ring-offset-boxflow-dark"
          />
        </label>
        {!showTypingIndicators && (
          <p className="text-xs text-yellow-400 mt-2 ml-4">
            ⚠️ You also won't see when others are typing
          </p>
        )}
      </div>

      {/* Online Status */}
      <div>
        <label className="flex items-center justify-between p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover cursor-pointer hover:bg-boxflow-hover/50 transition-colors">
          <div>
            <span className="text-white font-medium">
              🟢 {t('settings.onlineStatus')}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Let others see when you're online
            </p>
          </div>
          <input
            type="checkbox"
            checked={showOnlineStatus}
            onChange={(e) => setShowOnlineStatus(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-boxflow-darkest text-boxflow-accent focus:ring-2 focus:ring-boxflow-accent focus:ring-offset-2 focus:ring-offset-boxflow-dark"
          />
        </label>
        {!showOnlineStatus && (
          <p className="text-xs text-yellow-400 mt-2 ml-4">
            ⚠️ You'll appear offline to everyone
          </p>
        )}
      </div>

      {/* Activity Status */}
      <div>
        <label className="flex items-center justify-between p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover cursor-pointer hover:bg-boxflow-hover/50 transition-colors">
          <div>
            <span className="text-white font-medium">
              📊 {t('settings.activityStatus')}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Show what channel/DM you're currently viewing
            </p>
          </div>
          <input
            type="checkbox"
            checked={showActivity}
            onChange={(e) => setShowActivity(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-boxflow-darkest text-boxflow-accent focus:ring-2 focus:ring-boxflow-accent focus:ring-offset-2 focus:ring-offset-boxflow-dark"
          />
        </label>
      </div>

      {/* Allow DMs */}
      <div>
        <label className="flex items-center justify-between p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover cursor-pointer hover:bg-boxflow-hover/50 transition-colors">
          <div>
            <span className="text-white font-medium">
              💬 {t('settings.allowDMs')}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Allow other workspace members to send you direct messages
            </p>
          </div>
          <input
            type="checkbox"
            checked={allowDMs}
            onChange={(e) => setAllowDMs(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-boxflow-darkest text-boxflow-accent focus:ring-2 focus:ring-boxflow-accent focus:ring-offset-2 focus:ring-offset-boxflow-dark"
          />
        </label>
        {!allowDMs && (
          <p className="text-xs text-yellow-400 mt-2 ml-4">
            ⚠️ Others won't be able to start new DM conversations with you
          </p>
        )}
      </div>

      {/* Privacy Levels Quick Select */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🛡️ {t('settings.privacyLevel')}
        </label>
        <div className="space-y-2">
          <button
            onClick={() => {
              setShowReadReceipts(true);
              setShowTypingIndicators(true);
              setShowOnlineStatus(true);
              setShowActivity(true);
              setAllowDMs(true);
            }}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border transition-colors',
              'bg-boxflow-darkest border-boxflow-hover text-gray-300 hover:bg-boxflow-hover/50'
            )}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">🟢 Public</span>
                <p className="text-xs text-gray-400 mt-1">
                  Full visibility - all features enabled
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowReadReceipts(true);
              setShowTypingIndicators(true);
              setShowOnlineStatus(true);
              setShowActivity(false);
              setAllowDMs(true);
            }}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border transition-colors',
              'bg-boxflow-darkest border-boxflow-hover text-gray-300 hover:bg-boxflow-hover/50'
            )}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">🟡 Balanced</span>
                <p className="text-xs text-gray-400 mt-1">
                  Show online status but hide activity
                </p>
              </div>
            </div>
          </button>

          <button
            onClick={() => {
              setShowReadReceipts(false);
              setShowTypingIndicators(false);
              setShowOnlineStatus(false);
              setShowActivity(false);
              setAllowDMs(true);
            }}
            className={cn(
              'w-full text-left px-4 py-3 rounded-lg border transition-colors',
              'bg-boxflow-darkest border-boxflow-hover text-gray-300 hover:bg-boxflow-hover/50'
            )}
          >
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">🔴 Private</span>
                <p className="text-xs text-gray-400 mt-1">
                  Minimal visibility - hide most activity
                </p>
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-boxflow-dark-lighter p-4 rounded-lg border border-boxflow-hover-50">
        <h3 className="text-sm font-medium text-white mb-2">
          🔒 Privacy Information
        </h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Privacy settings are stored locally on your device</li>
          <li>• Admins can still see your activity for moderation</li>
          <li>• Disabling features affects both sending and receiving</li>
          <li>• Settings sync across your logged-in devices</li>
        </ul>
      </div>
    </div>
  );
}
