import Avatar from '../ui/Avatar';

interface DMEmptyStateProps {
  userName: string;
  userInitial: string;
}

/**
 * Empty state for DM channel with no messages
 */
export default function DMEmptyState({
  userName,
  userInitial
}: DMEmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center h-full text-boxflow-muted">
      <Avatar size="lg" className="mb-4">
        {userInitial}
      </Avatar>
      <p className="text-xl mb-2">{userName}</p>
      <p className="text-sm text-boxflow-subtle">
        Detta är början av din direktmeddelandehistorik med {userName}.
      </p>
    </div>
  );
}
