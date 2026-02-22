// URL Embed Service - Fetch OpenGraph and oEmbed metadata
import * as cheerio from 'cheerio';
import { logger } from '../../00-core/logger.js';

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
  html?: string; // For oEmbed rich content
  width?: number;
  height?: number;
  duration?: number; // For videos/audio
  thumbnail?: string;
  color?: string; // Embed color
}

// Popular oEmbed providers
const OEMBED_PROVIDERS: Record<string, string> = {
  'youtube.com': 'https://www.youtube.com/oembed',
  'youtu.be': 'https://www.youtube.com/oembed',
  'twitter.com': 'https://publish.twitter.com/oembed',
  'x.com': 'https://publish.twitter.com/oembed',
  'vimeo.com': 'https://vimeo.com/api/oembed.json',
  'soundcloud.com': 'https://soundcloud.com/oembed',
  'spotify.com': 'https://open.spotify.com/oembed',
  'reddit.com': 'https://www.reddit.com/oembed'
};

/**
 * Check if URL is from a supported oEmbed provider
 */
function getOEmbedEndpoint(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    for (const [domain, endpoint] of Object.entries(OEMBED_PROVIDERS)) {
      if (hostname.includes(domain)) {
        return endpoint;
      }
    }
  } catch {
    return null;
  }
  return null;
}

/**
 * Fetch oEmbed data from provider
 */
async function fetchOEmbed(url: string): Promise<EmbedData | null> {
  const endpoint = getOEmbedEndpoint(url);
  if (!endpoint) return null;

  try {
    const oembedUrl = `${endpoint}?url=${encodeURIComponent(url)}&format=json`;
    const response = await fetch(oembedUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BoxcordBot/1.0; +https://boxflow.com)'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const data = (await response.json()) as {
      type?: 'link' | 'video' | 'audio' | 'photo' | 'rich';
      title?: string;
      description?: string;
      provider_name?: string;
      provider_url?: string;
      author_name?: string;
      author_url?: string;
      thumbnail_url?: string;
      html?: string;
      width?: number;
      height?: number;
      duration?: number;
    };

    return {
      url,
      type: data.type || 'rich',
      title: data.title,
      description: data.description,
      siteName: data.provider_name,
      providerName: data.provider_name,
      providerUrl: data.provider_url,
      author: data.author_name,
      authorUrl: data.author_url,
      image: data.thumbnail_url,
      thumbnail: data.thumbnail_url,
      html: data.html,
      width: data.width,
      height: data.height,
      duration: data.duration
    };
  } catch {
    logger.warn(`Failed to fetch oEmbed: ${url}`);
    return null;
  }
}

/**
 * Parse OpenGraph meta tags from HTML
 */
function parseOpenGraph(html: string, url: string): EmbedData {
  const $ = cheerio.load(html);
  const data: EmbedData = { url, type: 'link' };

  // OpenGraph tags
  data.title = $('meta[property="og:title"]').attr('content');
  data.description =
    $('meta[property="og:description"]').attr('content') ||
    $('meta[name="description"]').attr('content');
  data.image = $('meta[property="og:image"]').attr('content');
  data.video = $('meta[property="og:video"]').attr('content');
  data.audio = $('meta[property="og:audio"]').attr('content');
  data.siteName = $('meta[property="og:site_name"]').attr('content');

  // Twitter Card tags (fallback)
  if (!data.title) {
    data.title = $('meta[name="twitter:title"]').attr('content');
  }
  if (!data.description) {
    data.description = $('meta[name="twitter:description"]').attr('content');
  }
  if (!data.image) {
    data.image = $('meta[name="twitter:image"]').attr('content');
  }

  // Fallback to HTML title
  if (!data.title) {
    data.title = $('title').text();
  }

  // Determine type
  if (data.video) {
    data.type = 'video';
  } else if (data.audio) {
    data.type = 'audio';
  } else if (data.image) {
    data.type = 'photo';
  }

  // Extract color for Discord-style accent
  const themeColor = $('meta[name="theme-color"]').attr('content');
  if (themeColor) {
    data.color = themeColor;
  }

  return data;
}

/**
 * Fetch and parse URL metadata
 */
export async function fetchUrlMetadata(url: string): Promise<EmbedData | null> {
  try {
    // Validate URL
    const urlObj = new URL(url);
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return null;
    }

    // Try oEmbed first (better for rich embeds)
    const oembedData = await fetchOEmbed(url);
    if (oembedData) {
      return oembedData;
    }

    // Fallback to OpenGraph/HTML parsing
    const response = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (compatible; BoxcordBot/1.0; +https://boxflow.com)'
      },
      signal: AbortSignal.timeout(5000)
    });

    if (!response.ok) return null;

    const html = await response.text();
    return parseOpenGraph(html, url);
  } catch {
    logger.warn(`Failed to fetch URL metadata: ${url}`);
    return null;
  }
}

/**
 * Extract URLs from message content
 */
export function extractUrls(content: string): string[] {
  const urlRegex =
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi;
  const matches = content.match(urlRegex);
  return matches || [];
}

/**
 * Fetch embeds for all URLs in message content
 */
export async function fetchMessageEmbeds(
  content: string
): Promise<EmbedData[]> {
  const urls = extractUrls(content);
  const uniqueUrls = [...new Set(urls)].slice(0, 5); // Limit to 5 embeds per message

  const embedPromises = uniqueUrls.map((url) => fetchUrlMetadata(url));
  const embeds = await Promise.all(embedPromises);

  return embeds.filter((embed): embed is EmbedData => embed !== null);
}
