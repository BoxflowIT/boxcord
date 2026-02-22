// Message Embed Preview Component - Shows rich media previews for links
import { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { logger } from '../../utils/logger';

export interface EmbedData {
  url: string;
  type: 'link' | 'video' | 'audio' | 'photo' | 'rich';
  title?: string;
  description?: string;
  siteName?: string;
  image?: string;
  video?: string;
  audio?: string;
  author?: string;
  authorUrl?: string;
  providerName?: string;
  providerUrl?: string;
  html?: string;
  width?: number;
  height?: number;
  duration?: number;
  thumbnail?: string;
  color?: string;
}

interface MessageEmbedProps {
  content: string;
}

/**
 * Automatically fetches and displays rich embeds for URLs in message content
 */
export function MessageEmbed({ content }: MessageEmbedProps) {
  const [embeds, setEmbeds] = useState<EmbedData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Extract URLs from content
    const urlRegex =
      /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
    const urls = content.match(urlRegex);

    if (!urls || urls.length === 0) {
      setEmbeds([]);
      return;
    }

    // Fetch embeds for all URLs
    const fetchEmbeds = async () => {
      setLoading(true);
      try {
        const response = await api.post<EmbedData[]>('/embeds/parse', {
          content
        });
        setEmbeds(response.data || []);
      } catch (error) {
        logger.error('Failed to fetch embeds:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmbeds();
  }, [content]);

  if (loading || embeds.length === 0) {
    return null;
  }

  return (
    <div className="mt-2 space-y-2">
      {embeds.map((embed, index) => (
        <EmbedPreview key={index} embed={embed} />
      ))}
    </div>
  );
}

interface EmbedPreviewProps {
  embed: EmbedData;
}

function EmbedPreview({ embed }: EmbedPreviewProps) {
  const accentColor = embed.color || '#5865F2'; // Default Discord blue

  // YouTube/Video embeds
  if (embed.type === 'video' && embed.html) {
    return (
      <div
        className="rounded-lg overflow-hidden border-l-4 bg-gray-800/50"
        style={{ borderColor: accentColor }}
      >
        <div
          className="embed-video"
          dangerouslySetInnerHTML={{ __html: embed.html }}
        />
        {embed.title && (
          <div className="p-3">
            <div className="font-semibold text-blue-400">{embed.title}</div>
            {embed.providerName && (
              <div className="text-xs text-gray-400 mt-1">
                {embed.providerName}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Image embeds
  if (embed.type === 'photo' || embed.image) {
    return (
      <a
        href={embed.url}
        target="_blank"
        rel="noopener noreferrer"
        className="block rounded-lg overflow-hidden border-l-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors"
        style={{ borderColor: accentColor }}
      >
        <div className="flex gap-3 p-3">
          <div className="flex-1 min-w-0">
            {embed.siteName && (
              <div className="text-xs text-gray-400 mb-1">{embed.siteName}</div>
            )}
            {embed.title && (
              <div className="font-semibold text-blue-400 mb-1 truncate">
                {embed.title}
              </div>
            )}
            {embed.description && (
              <div className="text-sm text-gray-300 line-clamp-2">
                {embed.description}
              </div>
            )}
          </div>
          {embed.image && (
            <img
              src={embed.image}
              alt={embed.title || 'Preview'}
              className="w-20 h-20 object-cover rounded flex-shrink-0"
            />
          )}
        </div>
      </a>
    );
  }

  // Rich/Link embeds (default)
  return (
    <a
      href={embed.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-lg overflow-hidden border-l-4 bg-gray-800/50 hover:bg-gray-800/70 transition-colors max-w-xl"
      style={{ borderColor: accentColor }}
    >
      <div className="p-3">
        {embed.siteName && (
          <div className="text-xs text-gray-400 mb-1">{embed.siteName}</div>
        )}
        {embed.title && (
          <div className="font-semibold text-blue-400 mb-1">{embed.title}</div>
        )}
        {embed.description && (
          <div className="text-sm text-gray-300 mb-2 line-clamp-3">
            {embed.description}
          </div>
        )}
        {embed.image && (
          <img
            src={embed.image}
            alt={embed.title || 'Preview'}
            className="w-full h-auto rounded mt-2"
            style={{ maxHeight: '300px', objectFit: 'cover' }}
          />
        )}
        {embed.author && (
          <div className="text-xs text-gray-400 mt-2">
            {embed.author}
            {embed.providerName && ` • ${embed.providerName}`}
          </div>
        )}
      </div>
    </a>
  );
}

export default MessageEmbed;
