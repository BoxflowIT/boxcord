import { cn } from '../../utils/classNames';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'rounded bg-boxflow-hover/50 animate-pulse-soft',
        className
      )}
    />
  );
}

export function MessageSkeleton() {
  return (
    <div className="flex items-start gap-4 px-4 py-3 animate-fade-in">
      <Skeleton className="w-10 h-10 rounded-full flex-shrink-0" />
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-3 w-16" />
        </div>
        <Skeleton className="h-4 w-full max-w-md" />
        <Skeleton className="h-4 w-3/4 max-w-sm" />
      </div>
    </div>
  );
}

export function MessageListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-1 p-2">
      {Array.from({ length: count }, (_, i) => (
        <MessageSkeleton key={i} />
      ))}
    </div>
  );
}

export function ChannelSkeleton() {
  return (
    <div className="space-y-1 px-2 animate-fade-in">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-2 px-2 py-1.5">
          <Skeleton className="w-4 h-4" />
          <Skeleton className="h-4 flex-1 max-w-[120px]" />
        </div>
      ))}
    </div>
  );
}

export function MemberSkeleton() {
  return (
    <div className="flex items-center gap-3 px-3 py-2 animate-fade-in">
      <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
      <Skeleton className="h-4 w-24" />
    </div>
  );
}

export function MemberListSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: count }, (_, i) => (
        <MemberSkeleton key={i} />
      ))}
    </div>
  );
}
