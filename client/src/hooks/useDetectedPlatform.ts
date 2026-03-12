type Platform = 'windows' | 'mac' | 'linux' | 'linux-deb' | 'unknown';

export function useDetectedPlatform(): Platform {
  const ua = navigator.userAgent.toLowerCase();
  if (ua.includes('win')) return 'windows';
  if (ua.includes('mac')) return 'mac';
  if (ua.includes('linux')) return 'linux';
  return 'unknown';
}
