import { Download } from 'lucide-react';
import { useDesktop } from '../hooks/useDesktop';

export function UpdateBanner() {
  const { updateReady, installUpdate } = useDesktop();

  if (!updateReady) return null;

  return (
    <div className="flex items-center justify-center gap-3 bg-blue-600 px-4 py-2 text-sm text-white">
      <Download size={16} />
      <span>Version {updateReady} is ready — restart to update</span>
      <button
        onClick={installUpdate}
        className="rounded bg-white/20 px-3 py-0.5 font-medium hover:bg-white/30 transition-colors"
      >
        Restart now
      </button>
    </div>
  );
}
