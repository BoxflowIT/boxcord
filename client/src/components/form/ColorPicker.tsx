// Color Picker Input - Simple color picker
import React from 'react';

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  presets?: string[];
  disabled?: boolean;
  className?: string;
}

export default function ColorPicker({
  value,
  onChange,
  label,
  presets = ['#5865f2', '#57f287', '#fee75c', '#ed4245', '#eb459e'],
  disabled = false,
  className = ''
}: ColorPickerProps) {
  return (
    <div className={className}>
      {label && (
        <label className="block text-sm text-gray-400 mb-2">{label}</label>
      )}
      <div className="flex items-center gap-2">
        {/* Color input */}
        <input
          type="color"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="w-12 h-12 rounded cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        />

        {/* Hex value display */}
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-boxflow-dark text-boxflow-light border border-boxflow-border rounded px-3 py-2 text-sm outline-none focus:border-boxflow-primary"
          placeholder="#000000"
        />
      </div>

      {/* Preset colors */}
      {presets.length > 0 && (
        <div className="flex gap-2 mt-2">
          {presets.map((color) => (
            <button
              key={color}
              type="button"
              onClick={() => onChange(color)}
              disabled={disabled}
              className="w-8 h-8 rounded border-2 border-transparent hover:border-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: color }}
              title={color}
            />
          ))}
        </div>
      )}
    </div>
  );
}
