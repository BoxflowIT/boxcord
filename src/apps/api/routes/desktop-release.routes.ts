import type { FastifyInstance } from 'fastify';

const REPO = 'BoxflowIT/boxcord';
const GITHUB_API = `https://api.github.com/repos/${REPO}/releases`;

// Cache releases for 5 minutes to avoid hitting GitHub rate limits
let cachedReleases: unknown[] | null = null;
let cacheExpiry = 0;
const CACHE_TTL = 5 * 60 * 1000;

export async function desktopReleaseRoutes(app: FastifyInstance) {
  // GET /api/desktop-releases — public, no auth required
  app.get('/api/desktop-releases', async (_request, reply) => {
    const now = Date.now();

    if (cachedReleases && now < cacheExpiry) {
      return reply
        .header('Cache-Control', 'public, max-age=300')
        .send(cachedReleases);
    }

    const ghToken = process.env.GH_PAT;
    const headers: Record<string, string> = {
      Accept: 'application/vnd.github+json',
      'User-Agent': 'boxcord-server'
    };
    if (ghToken) {
      headers.Authorization = `Bearer ${ghToken}`;
    }

    const res = await fetch(`${GITHUB_API}?per_page=20`, { headers });

    if (!res.ok) {
      // Return empty array so frontend uses fallback values
      cachedReleases = [];
      cacheExpiry = now + 60_000; // retry after 1 min on failure
      return reply.header('Cache-Control', 'public, max-age=60').send([]);
    }

    const releases = (await res.json()) as {
      tag_name: string;
      draft: boolean;
      prerelease: boolean;
      assets: { name: string; browser_download_url: string; size: number }[];
    }[];

    // Filter to desktop releases only, strip to minimal payload
    const desktopReleases = releases
      .filter(
        (r) => r.tag_name.startsWith('desktop-v') && !r.draft && !r.prerelease
      )
      .map((r) => ({
        tag: r.tag_name,
        version: r.tag_name.replace('desktop-v', ''),
        assets: r.assets.map((a) => ({
          name: a.name,
          url: a.browser_download_url,
          size: a.size
        }))
      }));

    cachedReleases = desktopReleases;
    cacheExpiry = now + CACHE_TTL;

    return reply
      .header('Cache-Control', 'public, max-age=300')
      .send(desktopReleases);
  });
}
