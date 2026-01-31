import React, { useState } from 'react';

interface SlippageSettingsProps {
  slippageBps: number;
  onChange: (bps: number) => void;
}

const PRESETS = [
  { label: '0.1%', bps: 10 },
  { label: '0.5%', bps: 50 },
  { label: '1%', bps: 100 },
];

export const SlippageSettings: React.FC<SlippageSettingsProps> = ({
  slippageBps,
  onChange,
}) => {
  const [customValue, setCustomValue] = useState('');
  const isCustom = !PRESETS.some((p) => p.bps === slippageBps);

  const handleCustomChange = (value: string) => {
    setCustomValue(value);
    const num = parseFloat(value);
    if (!isNaN(num) && num > 0 && num <= 50) {
      onChange(Math.round(num * 100));
    }
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-text-secondary text-sm">Slippage tolerance</span>
        <span className="text-white text-sm font-medium">
          {(slippageBps / 100).toFixed(1)}%
        </span>
      </div>

      <div className="flex items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.bps}
            type="button"
            onClick={() => {
              onChange(preset.bps);
              setCustomValue('');
            }}
            className={`
              px-3 py-1.5 rounded-lg text-sm font-medium transition-colors
              ${slippageBps === preset.bps
                ? 'bg-accent-orange text-white'
                : 'bg-dark-surface border border-gray-600 text-text-secondary hover:border-gray-500'}
            `}
          >
            {preset.label}
          </button>
        ))}

        <div className="relative flex-1">
          <input
            type="number"
            value={isCustom ? (slippageBps / 100).toString() : customValue}
            onChange={(e) => handleCustomChange(e.target.value)}
            placeholder="Custom"
            step="0.1"
            min="0.01"
            max="50"
            className={`
              w-full bg-dark-surface border rounded-lg px-3 py-1.5 text-sm text-white
              placeholder-text-secondary focus:outline-none transition-colors
              ${isCustom ? 'border-accent-orange' : 'border-gray-600 focus:border-accent-orange'}
            `}
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-text-secondary text-sm">
            %
          </span>
        </div>
      </div>

      {slippageBps > 200 && (
        <p className="text-yellow-400 text-xs flex items-center gap-1">
          <span className="inline-block w-2 h-2 rounded-full bg-yellow-400" />
          High slippage — your trade may be frontrun
        </p>
      )}
    </div>
  );
};
