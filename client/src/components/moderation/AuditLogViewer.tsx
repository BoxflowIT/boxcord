// Audit Log Viewer Component
import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { CloseIcon } from '../ui/Icons';
import { logger } from '../../utils/logger';

interface AuditLogEntry {
  id: string;
  userId: string;
  action: string;
  targetId?: string;
  targetType?: string;
  metadata?: Record<string, unknown>;
  ipAddress?: string;
  createdAt: string;
  user?: {
    firstName?: string;
    lastName?: string;
    email: string;
  };
}

interface AuditLogViewerProps {
  workspaceId: string;
  onClose: () => void;
}

export function AuditLogViewer({ workspaceId, onClose }: AuditLogViewerProps) {
  const { t } = useTranslation();
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    // Fetch audit logs
    const fetchLogs = async () => {
      try {
        setLoading(true);
        const response = await fetch(
          `/api/v1/workspaces/${workspaceId}/audit-logs?filter=${filter}`
        );
        const data = await response.json();
        setLogs(data.data || []);
      } catch (error) {
        logger.error('Failed to fetch audit logs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLogs();
  }, [workspaceId, filter]);

  const getActionColor = (action: string) => {
    if (action.includes('BAN') || action.includes('DELETE'))
      return 'text-red-400';
    if (action.includes('KICK') || action.includes('EDIT'))
      return 'text-yellow-400';
    if (action.includes('CREATE') || action.includes('JOIN'))
      return 'text-green-400';
    return 'text-blue-400';
  };

  const getActionIcon = (action: string) => {
    if (action.includes('BAN')) return '🚫';
    if (action.includes('KICK')) return '👢';
    if (action.includes('DELETE')) return '🗑️';
    if (action.includes('CREATE')) return '➕';
    if (action.includes('EDIT')) return '✏️';
    if (action.includes('JOIN')) return '👋';
    return '📋';
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString();
  };

  const getUserName = (log: AuditLogEntry) => {
    if (log.user?.firstName || log.user?.lastName) {
      return `${log.user.firstName || ''} ${log.user.lastName || ''}`.trim();
    }
    return log.user?.email || 'Unknown User';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-gray-900 rounded-lg w-full max-w-4xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold">{t('moderation.auditLogs')}</h2>
          <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded">
            <CloseIcon size="sm" />
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex gap-2">
            {['all', 'user', 'channel', 'message', 'workspace'].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                  filter === f
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                {t(
                  `moderation.filter${f.charAt(0).toUpperCase() + f.slice(1)}`
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Logs List */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="spinner-ring w-12 h-12" />
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <span className="text-4xl mb-2">📋</span>
              <p>{t('moderation.noAuditLogs')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div
                  key={log.id}
                  className="p-4 bg-gray-800 rounded border border-gray-700"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">
                      {getActionIcon(log.action)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold">
                          {getUserName(log)}
                        </span>
                        <span
                          className={`text-sm font-medium ${getActionColor(log.action)}`}
                        >
                          {log.action.replace(/_/g, ' ')}
                        </span>
                      </div>
                      {log.metadata && (
                        <div className="text-sm text-gray-400 mb-1">
                          {JSON.stringify(log.metadata, null, 2)}
                        </div>
                      )}
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>{formatDate(log.createdAt)}</span>
                        {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
