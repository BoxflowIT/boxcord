/**
 * Giphy Configuration
 * API key for GIF functionality
 *
 * To get your own API key:
 * 1. Go to https://developers.giphy.com/
 * 2. Create an account
 * 3. Create a new app
 * 4. Copy the API key
 * 5. Set VITE_GIPHY_API_KEY in .env file
 *
 * Public Beta Key (for development only, rate limited):
 * This key is provided for testing purposes only
 */

export const GIPHY_API_KEY =
  import.meta.env.VITE_GIPHY_API_KEY || 'E2USScP1hkaRhjQzx6MRjbGYuoO4p38N';

// Rate limits for public beta key:
// - 42 requests per hour
// - 1000 requests per day
// For production, get your own key with higher limits

export const GIPHY_CONFIG = {
  apiKey: GIPHY_API_KEY,
  rating: 'g', // g, pg, pg-13, r
  limit: 10, // Number of GIFs per page
  enabled:
    GIPHY_API_KEY !== 'your_giphy_api_key_here' && GIPHY_API_KEY.length > 0
};
