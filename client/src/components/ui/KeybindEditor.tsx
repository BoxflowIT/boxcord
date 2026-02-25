/**
 * KeybindEditor Component
 * Edit and customize keyboard shortcuts with conflict detection
 */
import { useState } from 'react';
import KeyRecorder from './KeyRecorder';
import {
  useKeyboardShortcutsStore,
  type ShortcutAction,
  QUICK_REACTION_EMOJIS
} from '../../store/keyboardShortcutsStore';

interface KeybindEditorProps {
  action: ShortcutAction;
  showCategory?: boolean;
}

export default function KeybindEditor({
  action,
  showCategory = false
}: KeybindEditorProps) {
  const { getShortcut, setShortcut, resetShortcut, hasConflict } =
    useKeyboardShortcutsStore();
  const shortcut = getShortcut(action);
  const [tempKeys, setTempKeys] = useState(shortcut.keys);
  const [hasConflictWarning, setHasConflictWarning] = useState(false);

  const handleKeysChange = (keys: string) => {
    setTempKeys(keys);
    const conflict = hasConflict(keys, action);
    setHasConflictWarning(conflict);

    if (!conflict && keys) {
      setShortcut(action, keys);
    }
  };

  const handleReset = () => {
    resetShortcut(action);
    setTempKeys(getShortcut(action).keys);
    setHasConflictWarning(false);
  };

  const isQuickReaction = action.startsWith('emoji-react-');
  const emoji = isQuickReaction ? QUICK_REACTION_EMOJIS[action] : null;

  return (
    <div className="flex items-center justify-between py-3 px-4 rounded-lg bg-boxflow-dark border border-boxflow-border hover:border-primary-50 transition-colors">
      <div className="flex-1">
        <div className="flex items-center gap-2">
          {emoji && <span className="text-xl">{emoji}</span>}
          <h4 className="text-white font-medium">{shortcut.description}</h4>
          {showCategory && (
            <span className="text-xs px-2 py-1 rounded bg-boxflow-hover text-boxflow-muted">
              {shortcut.category}
            </span>
          )}
        </div>
        {hasConflictWarning && (
          <p className="text-xs text-danger mt-1">
            ⚠️ This key combination is already in use
          </p>
        )}
      </div>

      <div className="flex items-center gap-3">
        <KeyRecorder
          value={tempKeys}
          onChange={handleKeysChange}
          placeholder="Press keys..."
          disabled={!shortcut.customizable}
        />

        {shortcut.customizable && tempKeys !== getShortcut(action).keys && (
          <button
            onClick={handleReset}
            className="px-3 py-2 rounded-lg text-xs text-boxflow-muted hover:text-white hover:bg-boxflow-hover transition-colors"
            title="Reset to default"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
