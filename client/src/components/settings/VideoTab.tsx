/**
 * Video & Camera Settings Tab
 * Test camera, adjust video quality, and configure video settings
 */

import { useEffect, useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { cn } from '../../utils/classNames';
import { VideoIcon, VideoOffIcon } from '../ui/Icons';

export default function VideoTab() {
  const { t } = useTranslation();
  const videoRef = useRef<HTMLVideoElement>(null);
  const shouldRestartRef = useRef(false);
  const [isTesting, setIsTesting] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');
  const [videoQuality, setVideoQuality] = useState<'low' | 'medium' | 'high'>(
    () => {
      const saved = localStorage.getItem('video-quality');
      return (saved as 'low' | 'medium' | 'high') || 'medium';
    }
  );
  const [mirrorVideo, setMirrorVideo] = useState(() => {
    const saved = localStorage.getItem('mirror-video');
    return saved === null ? true : saved === 'true';
  });
  const [error, setError] = useState<string>('');

  // Load video devices
  useEffect(() => {
    async function loadDevices() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const cameras = devices.filter((d) => d.kind === 'videoinput');
        setVideoDevices(cameras);

        if (cameras.length > 0 && !selectedDeviceId) {
          setSelectedDeviceId(cameras[0].deviceId);
        }
      } catch (err) {
        console.error('Failed to load video devices:', err);
        setError('Failed to load video devices');
      }
    }

    loadDevices();
  }, [selectedDeviceId]);

  // Save video quality to localStorage
  useEffect(() => {
    localStorage.setItem('video-quality', videoQuality);
  }, [videoQuality]);

  // Save mirror video setting to localStorage
  useEffect(() => {
    localStorage.setItem('mirror-video', String(mirrorVideo));
  }, [mirrorVideo]);

  // Attach stream to video element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
      videoRef.current.play().catch((err) => {
        console.error('Failed to play video:', err);
      });
    }
  }, [stream]);

  // Cleanup stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Restart test when quality changes (if flag is set)
  useEffect(() => {
    if (shouldRestartRef.current && !stream) {
      shouldRestartRef.current = false;
      startVideoTest();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoQuality, stream]);

  const startVideoTest = async () => {
    try {
      setError('');

      const constraints: MediaStreamConstraints = {
        video: {
          deviceId: selectedDeviceId ? { exact: selectedDeviceId } : undefined,
          width:
            videoQuality === 'high'
              ? { ideal: 1280 }
              : videoQuality === 'medium'
                ? { ideal: 640 }
                : { ideal: 320 },
          height:
            videoQuality === 'high'
              ? { ideal: 720 }
              : videoQuality === 'medium'
                ? { ideal: 480 }
                : { ideal: 240 },
          frameRate: { ideal: videoQuality === 'high' ? 30 : 24 }
        }
      };

      const mediaStream =
        await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      setIsTesting(true);
    } catch (err) {
      console.error('Failed to start video test:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to access camera. Please check permissions.'
      );
    }
  };

  const stopVideoTest = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsTesting(false);
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);

    // If testing, restart with new device
    if (isTesting) {
      stopVideoTest();
      setTimeout(() => {
        setSelectedDeviceId(deviceId);
        startVideoTest();
      }, 100);
    }
  };

  return (
    <div className="space-y-6">
      {/* Camera Device Selection */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          📹 {t('settings.camera')}
        </label>
        <select
          value={selectedDeviceId}
          onChange={(e) => handleDeviceChange(e.target.value)}
          className="w-full bg-boxflow-darkest text-white px-3 py-2 rounded-lg border border-boxflow-hover focus:border-boxflow-accent focus:outline-none"
          disabled={videoDevices.length === 0}
        >
          {videoDevices.length === 0 ? (
            <option>No cameras found</option>
          ) : (
            videoDevices.map((device) => (
              <option key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${device.deviceId.slice(0, 8)}...`}
              </option>
            ))
          )}
        </select>
      </div>

      {/* Video Test Preview */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🎬 {t('settings.cameraTest')}
        </label>

        <div className="bg-boxflow-darkest rounded-lg overflow-hidden border border-boxflow-hover aspect-video relative">
          {isTesting ? (
            <>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={cn(
                  'w-full h-full object-cover',
                  mirrorVideo && 'scale-x-[-1]'
                )}
              />
              {/* Quality indicator badge */}
              <div className="absolute top-2 right-2 px-2 py-1 bg-black/70 text-white text-xs rounded backdrop-blur-sm">
                {videoQuality === 'low' && '320x240 @ 24fps'}
                {videoQuality === 'medium' && '640x480 @ 24fps'}
                {videoQuality === 'high' && '1280x720 @ 30fps'}
              </div>
            </>
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-500">
              <div className="text-center">
                <VideoOffIcon size="lg" className="mx-auto mb-2" />
                <p>Camera preview</p>
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-red-400 text-sm mt-2">⚠️ {error}</p>}

        <div className="flex gap-2 mt-3">
          {!isTesting ? (
            <button
              onClick={startVideoTest}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg transition-colors flex items-center gap-2"
              disabled={videoDevices.length === 0}
            >
              <VideoIcon size="sm" />
              {t('settings.startCameraTest')}
            </button>
          ) : (
            <button
              onClick={stopVideoTest}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <VideoOffIcon size="sm" />
              {t('settings.stopCameraTest')}
            </button>
          )}
        </div>
      </div>

      {/* Video Quality */}
      <div>
        <label className="block text-sm font-medium text-gray-300 mb-2">
          🎨 {t('settings.videoQuality')}
        </label>
        <div className="space-y-2">
          {(['low', 'medium', 'high'] as const).map((quality) => (
            <button
              key={quality}
              onClick={() => {
                // If testing, flag that we should restart after quality changes
                if (isTesting) {
                  shouldRestartRef.current = true;
                  stopVideoTest();
                }
                // Update quality (will be saved to localStorage via useEffect)
                setVideoQuality(quality);
              }}
              className={cn(
                'w-full text-left px-4 py-3 rounded-lg border transition-colors',
                videoQuality === quality
                  ? 'bg-boxflow-hover border-boxflow-accent text-white'
                  : 'bg-boxflow-darkest border-boxflow-hover text-gray-300 hover:bg-boxflow-hover/50'
              )}
            >
              <div className="flex justify-between items-center">
                <div>
                  <span className="font-medium capitalize">{quality}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {quality === 'low' && '(320x240, 24fps)'}
                    {quality === 'medium' && '(640x480, 24fps)'}
                    {quality === 'high' && '(1280x720, 30fps)'}
                  </span>
                </div>
                {videoQuality === quality && (
                  <span className="text-green-400">✓</span>
                )}
              </div>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          💡 Higher quality uses more bandwidth. Use "Medium" for most
          situations.
        </p>
      </div>

      {/* Mirror Video Toggle */}
      <div>
        <label className="flex items-center justify-between p-4 bg-boxflow-darkest rounded-lg border border-boxflow-hover cursor-pointer hover:bg-boxflow-hover/50 transition-colors">
          <div>
            <span className="text-white font-medium">
              🪞 {t('settings.mirrorVideo')}
            </span>
            <p className="text-xs text-gray-400 mt-1">
              Flip your video horizontally (like a mirror)
            </p>
          </div>
          <input
            type="checkbox"
            checked={mirrorVideo}
            onChange={(e) => setMirrorVideo(e.target.checked)}
            className="w-5 h-5 rounded border-gray-600 bg-boxflow-darkest text-boxflow-accent focus:ring-2 focus:ring-boxflow-accent focus:ring-offset-2 focus:ring-offset-boxflow-dark"
          />
        </label>
      </div>

      {/* Info Box */}
      <div className="bg-boxflow-dark-lighter p-4 rounded-lg border border-boxflow-hover-50">
        <h3 className="text-sm font-medium text-white mb-2">
          📱 Camera Settings Info
        </h3>
        <ul className="text-xs text-gray-400 space-y-1">
          <li>• Test your camera before joining video calls</li>
          <li>• Adjust quality based on your internet speed</li>
          <li>• Camera permissions required in browser settings</li>
          <li>• Settings apply to all video calls and DMs</li>
        </ul>
      </div>
    </div>
  );
}
