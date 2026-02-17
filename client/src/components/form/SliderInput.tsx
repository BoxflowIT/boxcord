// Slider Input - Range slider with label
import React from 'react';

interface SliderInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  label?: string;
  showValue?: boolean;
  disabled?: boolean;
  className?: string;
}

export default function SliderInput({
  value,
  onChange,
  min = 0,
  max = 100,
  step = 1,
  label,
  showValue = true,
  disabled = false,
  className = ''
}: SliderInputProps) {
  return (
    <div className={className}>
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="block text-sm text-gray-400">{label}</label>
          {showValue && (
            <span className="text-sm text-boxflow-light font-medium">
              {value}
            </span>
          )}
        </div>
      )}
      <input
        type="range"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full h-2 bg-boxflow-darker rounded-lg appearance-none cursor-pointer accent-boxflow-primary disabled:opacity-50 disabled:cursor-not-allowed"
      />
    </div>
  );
}
