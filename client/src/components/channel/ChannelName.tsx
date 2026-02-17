// Channel Name - Display channel name with prefix
import ChannelIcon from './ChannelIcon';

interface ChannelNameProps {
  name: string;
  type?: 'text' | 'voice' | 'announcement';
  showIcon?: boolean;
  prefix?: string;
  className?: string;
}

export default function ChannelName({
  name,
  type = 'text',
  showIcon = true,
  prefix = '#',
  className = ''
}: ChannelNameProps) {
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {showIcon && <ChannelIcon type={type} size="sm" />}
      <span className="font-medium">
        {!showIcon && type === 'text' && prefix}
        {name}
      </span>
    </div>
  );
}
