/**
 * Utility to detect and render GIF URLs as images in messages
 */

// Common GIF hosting domains
const GIF_DOMAINS = [
  'giphy.com',
  'media.giphy.com',
  'i.giphy.com',
  'tenor.com',
  'media.tenor.com',
  'i.imgur.com',
  'media.discordapp.net'
];

/**
 * Check if a URL is likely a GIF image
 */
export function isGifUrl(url: string): boolean {
  try {
    const urlObj = new URL(url);

    // Check if it's from a known GIF domain
    const isKnownDomain = GIF_DOMAINS.some((domain) =>
      urlObj.hostname.includes(domain)
    );

    // Check if URL ends with .gif
    const hasGifExtension = urlObj.pathname.toLowerCase().endsWith('.gif');

    return isKnownDomain || hasGifExtension;
  } catch {
    return false;
  }
}

/**
 * Check if text is only a GIF URL (no other content)
 */
export function isOnlyGifUrl(text: string): boolean {
  const trimmed = text.trim();

  // Must start with http:// or https://
  if (!trimmed.match(/^https?:\/\//)) {
    return false;
  }

  // Check if it's a valid URL
  try {
    new URL(trimmed);
    return isGifUrl(trimmed);
  } catch {
    return false;
  }
}

/**
 * Render GIF URL as an image element
 */
export function renderGif(url: string): JSX.Element {
  return (
    <div className="mt-2 max-w-md">
      <img
        src={url}
        alt="GIF"
        className="rounded-lg max-w-full h-auto"
        loading="lazy"
        onError={(e) => {
          // Fallback if GIF fails to load
          const target = e.target as HTMLImageElement;
          target.style.display = 'none';
          const fallback = document.createElement('a');
          fallback.href = url;
          fallback.textContent = url;
          fallback.className = 'text-blue-400 hover:underline';
          fallback.target = '_blank';
          fallback.rel = 'noopener noreferrer';
          target.parentNode?.appendChild(fallback);
        }}
      />
    </div>
  );
}
