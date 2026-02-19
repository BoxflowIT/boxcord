// Link Preview - Show preview cards for URLs
import { useState, useEffect } from 'react';

interface LinkPreviewData {
  url: string;
  title?: string;
  description?: string;
  image?: string;
  siteName?: string;
}

interface LinkPreviewProps {
  url: string;
}

export function LinkPreview({ url }: LinkPreviewProps) {
  const [preview, setPreview] = useState<LinkPreviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    // For now, just show a simple link card
    // In production, you'd fetch metadata from backend API
    const loadPreview = async () => {
      try {
        setLoading(true);
        const urlObj = new URL(url);

        // Simple preview with just the domain
        setPreview({
          url,
          title: urlObj.hostname,
          description: url,
          siteName: urlObj.hostname
        });
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadPreview();
  }, [url]);

  if (loading) {
    return (
      <div className="border border-gray-700 rounded p-3 mt-2 animate-pulse">
        <div className="h-4 bg-gray-700 rounded w-3/4 mb-2" />
        <div className="h-3 bg-gray-700 rounded w-full" />
      </div>
    );
  }

  if (error || !preview) {
    return null;
  }

  return (
    <a
      href={preview.url}
      target="_blank"
      rel="noopener noreferrer"
      className="block border border-gray-700 rounded overflow-hidden mt-2 hover:border-gray-600 transition-colors"
    >
      {preview.image && (
        <img
          src={preview.image}
          alt={preview.title}
          className="w-full h-48 object-cover"
        />
      )}
      <div className="p-3">
        {preview.siteName && (
          <div className="text-xs text-gray-400 mb-1">{preview.siteName}</div>
        )}
        {preview.title && (
          <div className="font-semibold text-blue-400 mb-1">
            {preview.title}
          </div>
        )}
        {preview.description && (
          <div className="text-sm text-gray-300 line-clamp-2">
            {preview.description}
          </div>
        )}
      </div>
    </a>
  );
}

// Extract URLs from message content
export function extractUrls(content: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const matches = content.match(urlRegex);
  return matches || [];
}
