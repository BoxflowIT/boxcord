type Platform = 'windows' | 'mac' | 'linux' | 'linux-deb' | 'unknown';

export function useDetectedPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('linux')) {
    // Recommend .deb for Ubuntu/Debian-based distros
    if (ua.includes('ubuntu') || ua.includes('debian')) return 'linux-deb';
    return 'linux';
  }
  return 'unknown';
}
