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
    <div className="flex flex-col items-center justify-center h-full text-[#b5bac1]">
      <p className="text-xl mb-2">Välkommen till #{channelName}!</p>
      <p className="text-sm text-[#80848e]">
        Detta är början av #{channelName} kanalen.
      </p>
    </div>
  );
}
