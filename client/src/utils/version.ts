// Import version from package.json
// Vite allows importing JSON files directly
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;
