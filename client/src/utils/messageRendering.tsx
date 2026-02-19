// Message Rendering Utilities - Markdown + Mentions + Link Previews
import React from 'react';
import { MarkdownRenderer } from '../components/message/MarkdownRenderer';
import { LinkPreview, extractUrls } from '../components/message/LinkPreview';
import { parseMentions } from '../components/MentionAutocomplete';

/**
 * Enhanced message renderer that combines:
 * - Markdown formatting (bold, italic, code, etc.)
 * - @mention highlighting
 * - Link previews
 */
export function renderEnhancedMessage(content: string): React.ReactNode {
  // Extract URLs for link previews
  const urls = extractUrls(content);

  return (
    <div className="enhanced-message">
      {/* Render markdown content */}
      <MarkdownRenderer content={content} />

      {/* Render link previews */}
      {urls.length > 0 && (
        <div className="mt-2 space-y-2">
          {urls.slice(0, 3).map((url, idx) => (
            <LinkPreview key={idx} url={url} />
          ))}
        </div>
      )}
    </div>
  );
}

/**
 * Simple renderer for messages (backward compatibility)
 * Only parses mentions, no markdown or link previews
 */
export function renderSimpleMessage(content: string): React.ReactNode {
  return parseMentions(content);
}
