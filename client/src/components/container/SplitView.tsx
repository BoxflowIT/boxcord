// Split View - Two-panel split layout

interface SplitViewProps {
  left: React.ReactNode;
  right: React.ReactNode;
  leftWidth?: string; // e.g., '300px', '25%'
  className?: string;
}

export default function SplitView({
  left,
  right,
  leftWidth = '300px',
  className = ''
}: SplitViewProps) {
  return (
    <div className={`flex h-full ${className}`}>
      <div
        className="flex-shrink-0 border-r border-boxflow-border"
        style={{ width: leftWidth }}
      >
        {left}
      </div>
      <div className="flex-1 min-w-0">{right}</div>
    </div>
  );
}
