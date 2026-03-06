/**
 * Giphy Configuration
 * Client-side only — API calls go directly to Giphy (required by ToS)
 *
 * To get your own API key:
 * 1. Go to https://developers.giphy.com/
 * 2. Create an account
 * 3. Create a new app (choose API, not SDK)
 * 4. Copy the API key
 * 5. Set VITE_GIPHY_API_KEY in client/.env
 */

export const GIPHY_API_KEY = import.meta.env.VITE_GIPHY_API_KEY || '';

export const GIPHY_CONFIG = {
  apiKey: GIPHY_API_KEY,
  rating: 'g', // g, pg, pg-13, r
  limit: 10, // Number of GIFs per page
  enabled: GIPHY_API_KEY.length > 0
};
