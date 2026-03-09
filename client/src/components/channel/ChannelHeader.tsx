// Reusable Channel Header Component
import { useTranslation } from 'react-i18next';
import { UsersIcon, WebhookIcon } from '../ui/Icons';

interface ChannelHeaderProps {
  channelName?: string;
  channelDescription?: string;
  onToggleMemberList?: () => void;
  onOpenWebhooks?: () => void;
}

export function ChannelHeader({
  channelName,
  channelDescription,
  onToggleMemberList,
  onOpenWebhooks
}: ChannelHeaderProps) {
  const { t } = useTranslation();
  return (
    <div className="panel-header justify-between">
      <div>
        <h2 className="text-heading">
          <span className="text-boxflow-muted mr-1">#</span>
          {channelName ?? t('common.loading')}
        </h2>
        {channelDescription && (
          <p className="text-sm text-boxflow-muted mt-0.5">
            {channelDescription}
          </p>
        )}
      </div>
      <div className="flex items-center gap-1">
        {onOpenWebhooks && (
          <button
            onClick={onOpenWebhooks}
            className="btn-icon"
            title={t('webhooks.title')}
          >
            <WebhookIcon />
          </button>
        )}
        {onToggleMemberList && (
          <button
            onClick={onToggleMemberList}
            className="btn-icon"
            title={t('common.showMembers')}
          >
            <UsersIcon />
          </button>
        )}
      </div>
    </div>
  );
}
