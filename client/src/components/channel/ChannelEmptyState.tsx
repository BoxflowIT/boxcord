import { HashIcon } from '../ui/Icons';

interface ChannelEmptyStateProps {
  channelName: string;
}

/**
 * Empty state shown when channel has no messages
 */
export default function ChannelEmptyState({
  channelName
}: ChannelEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-boxflow-muted animate-fade-in-up">
      <div className="w-16 h-16 rounded-full bg-boxflow-hover flex items-center justify-center mb-4">
        <HashIcon size="lg" className="w-8 h-8 text-boxflow-muted" />
      </div>
      <p className="text-xl font-semibold mb-2 text-boxflow-light">
        Välkommen till #{channelName}!
      </p>
      <p className="text-sm text-boxflow-subtle">
        Detta är början av #{channelName} kanalen.
      </p>
    </div>
  );
}
