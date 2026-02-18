/**
 * Device Selector Component
 * Dropdown for selecting audio input/output devices
 */

import { AudioDevice } from '../../../hooks/useAudioDevices';

interface DeviceSelectorProps {
  label: string;
  devices: AudioDevice[];
  selectedDeviceId: string | null;
  onSelect: (deviceId: string | null) => void;
  disabled?: boolean;
}

export default function DeviceSelector({
  label,
  devices,
  selectedDeviceId,
  onSelect,
  disabled = false
}: DeviceSelectorProps) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">
        {label}
      </label>
      <select
        value={selectedDeviceId || 'default'}
        onChange={(e) =>
          onSelect(e.target.value === 'default' ? null : e.target.value)
        }
        disabled={disabled}
        className="w-full bg-boxflow-hover text-white rounded-lg px-4 py-2 border border-gray-600 focus:border-green-500 focus:outline-none disabled:opacity-50"
      >
        <option value="default">Default</option>
        {devices.map((device) => (
          <option key={device.deviceId} value={device.deviceId}>
            {device.label}
          </option>
        ))}
      </select>
    </div>
  );
}
