'use client';

import React from 'react';
import { CropTransformSettings } from '@/types/image';
import { Crop, RotateCcw, RotateCw, FlipHorizontal, FlipVertical, Sliders } from 'lucide-react';

interface CropPanelProps {
  settings: CropTransformSettings;
  onSettingsChange: (settings: CropTransformSettings) => void;
  disabled?: boolean;
}

export function CropPanel({ settings, onSettingsChange, disabled = false }: CropPanelProps) {
  const update = <K extends keyof CropTransformSettings>(
    key: K,
    value: CropTransformSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const rotateBy = (degrees: number) => {
    const next = (settings.rotation + degrees + 360) % 360;
    update('rotation', next);
  };

  const ratios: { id: CropTransformSettings['aspectRatioPreset']; label: string; desc: string }[] = [
    { id: 'free', label: 'Original', desc: 'No crop' },
    { id: '1:1', label: '1:1', desc: 'Square' },
    { id: '16:9', label: '16:9', desc: 'Widescreen' },
    { id: '9:16', label: '9:16', desc: 'Story / Reel' },
    { id: '4:3', label: '4:3', desc: 'Standard' },
    { id: '3:2', label: '3:2', desc: 'DSLR Photo' },
  ];

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
        <div className="flex items-center gap-2">
          <Crop className="w-5 h-5 text-amber-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Crop & Transform</h2>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          Rotation: {settings.rotation}°
        </span>
      </div>

      {/* Aspect Ratio Cropping Presets */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
          Crop Aspect Ratio
        </label>
        <div className="grid grid-cols-3 gap-2">
          {ratios.map((r) => {
            const isSelected = settings.aspectRatioPreset === r.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => update('aspectRatioPreset', r.id)}
                disabled={disabled}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all
                  ${
                    isSelected
                      ? 'border-amber-600 bg-amber-50/60 text-amber-900 dark:border-amber-500 dark:bg-amber-950/30 dark:text-amber-200'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300'
                  }
                `}
              >
                <p className="text-xs font-bold">{r.label}</p>
                <p className="text-[10px] text-zinc-400">{r.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Rotation & Flip Controls */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
          Orientation & Mirror
        </label>
        <div className="grid grid-cols-4 gap-2">
          <button
            type="button"
            onClick={() => rotateBy(-90)}
            disabled={disabled}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-all"
            title="Rotate 90° Left"
          >
            <RotateCcw className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] font-semibold">-90°</span>
          </button>

          <button
            type="button"
            onClick={() => rotateBy(90)}
            disabled={disabled}
            className="flex flex-col items-center justify-center p-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300 cursor-pointer transition-all"
            title="Rotate 90° Right"
          >
            <RotateCw className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] font-semibold">+90°</span>
          </button>

          <button
            type="button"
            onClick={() => update('flipHorizontal', !settings.flipHorizontal)}
            disabled={disabled}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer
              ${
                settings.flipHorizontal
                  ? 'border-amber-600 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
              }
            `}
            title="Flip Horizontal"
          >
            <FlipHorizontal className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] font-semibold">Flip H</span>
          </button>

          <button
            type="button"
            onClick={() => update('flipVertical', !settings.flipVertical)}
            disabled={disabled}
            className={`flex flex-col items-center justify-center p-2.5 rounded-xl border transition-all cursor-pointer
              ${
                settings.flipVertical
                  ? 'border-amber-600 bg-amber-50 text-amber-800 dark:border-amber-500 dark:bg-amber-950/40 dark:text-amber-300'
                  : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-700 dark:text-zinc-300'
              }
            `}
            title="Flip Vertical"
          >
            <FlipVertical className="w-4 h-4 text-amber-500 mb-1" />
            <span className="text-[10px] font-semibold">Flip V</span>
          </button>
        </div>
      </div>

      {/* Quality Slider */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            Export Quality
          </label>
          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {settings.quality}%
          </span>
        </div>
        <input
          type="range"
          min="10"
          max="100"
          value={settings.quality}
          onChange={(e) => update('quality', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
        />
      </div>
    </div>
  );
}
