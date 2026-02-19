// Join Page - Handle invite links
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useParams, useNavigate } from 'react-router-dom';
import { api } from '../services/api';
import { Button } from '../components/ui/button';
import type { InvitePreview } from '../types';

export default function JoinPage() {
  const { t } = useTranslation();
  const { code } = useParams<{ code: string }>();
  const navigate = useNavigate();
  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [joining, setJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!code) {
      setError(t('invite.noCodeProvided'));
      setLoading(false);
      return;
    }

    const fetchPreview = async () => {
      try {
        const data = await api.previewInvite(code);
        setPreview(data);
      } catch {
        setError(t('invite.notFoundOrExpired'));
      } finally {
        setLoading(false);
      }
    };

    fetchPreview();
  }, [code]);

  const handleJoin = async () => {
    if (!code) return;

    setJoining(true);
    setError(null);

    try {
      await api.joinWithInvite(code);
      navigate('/chat');
    } catch {
      setError(t('invite.joinFailed'));
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="min-h-screen bg-boxflow-darkest flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-boxflow-dark rounded-lg p-8 shadow-xl">
        {loading ? (
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-boxflow-primary mx-auto" />
            <p className="mt-4 text-boxflow-muted">{t('invite.loading')}</p>
          </div>
        ) : error ? (
          <div className="text-center">
            <div className="text-red-400 text-5xl mb-4">😕</div>
            <h1 className="text-xl font-bold text-white mb-2">
              {t('invite.invalid')}
            </h1>
            <p className="text-boxflow-muted mb-6">{error}</p>
            <Button onClick={() => navigate('/chat')}>
              {t('invite.goToChat')}
            </Button>
          </div>
        ) : preview ? (
          <div className="text-center">
            <h1 className="text-xl font-semibold text-white mb-6">
              {t('invite.youveBeenInvited')}
            </h1>

            <div className="p-6 bg-boxflow-darker rounded-lg mb-6">
              <div className="flex items-center justify-center gap-4">
                {preview.workspace.iconUrl ? (
                  <img
                    src={preview.workspace.iconUrl}
                    alt=""
                    className="w-16 h-16 rounded-full"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-boxflow-primary flex items-center justify-center text-white font-bold text-2xl">
                    {preview.workspace.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="text-left">
                  <h2 className="text-2xl font-bold text-white">
                    {preview.workspace.name}
                  </h2>
                  {preview.workspace.description && (
                    <p className="text-boxflow-muted">
                      {preview.workspace.description}
                    </p>
                  )}
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Button
                onClick={handleJoin}
                disabled={joining}
                className="w-full"
              >
                {joining ? t('invite.joining') : t('invite.accept')}
              </Button>
              <Button
                variant="ghost"
                onClick={() => navigate('/chat')}
                className="w-full"
              >
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
