'use client';

import React from 'react';
import { CompressionSettings } from '@/types/image';
import { Sliders, Layers, Minimize2, Lock, Unlock } from 'lucide-react';

interface CompressionSettingsPanelProps {
  settings: CompressionSettings;
  onSettingsChange: (settings: CompressionSettings) => void;
  disabled?: boolean;
}

export function CompressionSettingsPanel({
  settings,
  onSettingsChange,
  disabled = false,
}: CompressionSettingsPanelProps) {
  const updateSetting = <K extends keyof CompressionSettings>(
    key: K,
    value: CompressionSettings[K]
  ) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center gap-2 border-b border-zinc-100 dark:border-zinc-850 pb-4">
        <Sliders className="w-5 h-5 text-zinc-500" />
        <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Compression Settings</h2>
      </div>

      <div className="space-y-5">
        {/* Quality Slider */}
        <div className="space-y-2">
          <div className="flex justify-between items-center text-sm">
            <label htmlFor="quality" className="font-semibold text-zinc-850 dark:text-zinc-200">
              Compression Quality
            </label>
            <span className="font-mono bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md text-zinc-700 dark:text-zinc-300 font-semibold">
              {settings.quality}%
            </span>
          </div>
          <input
            id="quality"
            type="range"
            min="10"
            max="100"
            value={settings.quality}
            onChange={(e) => updateSetting('quality', parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <div className="flex justify-between text-xs text-zinc-400 dark:text-zinc-500 font-medium">
            <span>High Compression (Low Quality)</span>
            <span>Balanced</span>
            <span>Low Compression (High Quality)</span>
          </div>
        </div>

        {/* Output Format */}
        <div className="space-y-2">
          <label htmlFor="format" className="text-sm font-semibold text-zinc-850 dark:text-zinc-200 block">
            Output Format
          </label>
          <div className="relative">
            <select
              id="format"
              value={settings.format}
              onChange={(e) => updateSetting('format', e.target.value as any)}
              disabled={disabled}
              className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2.5 px-3.5 text-sm shadow-xs focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-hidden disabled:opacity-50 disabled:cursor-not-allowed text-zinc-800 dark:text-zinc-100 cursor-pointer appearance-none"
            >
              <option value="original">Keep Original Format</option>
              <option value="jpeg">Convert to JPEG</option>
              <option value="png">Convert to PNG</option>
              <option value="webp">Convert to WEBP</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3.5 pointer-events-none text-zinc-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Resize Options */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center gap-2">
            <Minimize2 className="w-4.5 h-4.5 text-zinc-500" />
            <span className="text-sm font-semibold text-zinc-850 dark:text-zinc-200">
              Resize Dimensions (Optional)
            </span>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label htmlFor="maxWidth" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Max Width (px)
              </label>
              <input
                id="maxWidth"
                type="number"
                placeholder="Original"
                value={settings.maxWidth || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  updateSetting('maxWidth', val);
                }}
                disabled={disabled}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-sm shadow-xs focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-hidden disabled:opacity-50 text-zinc-800 dark:text-zinc-100"
              />
            </div>
            
            <div className="space-y-1.5">
              <label htmlFor="maxHeight" className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                Max Height (px)
              </label>
              <input
                id="maxHeight"
                type="number"
                placeholder="Original"
                value={settings.maxHeight || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  updateSetting('maxHeight', val);
                }}
                disabled={disabled}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-sm shadow-xs focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-hidden disabled:opacity-50 text-zinc-800 dark:text-zinc-100"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 mt-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.keepAspectRatio}
              onChange={(e) => updateSetting('keepAspectRatio', e.target.checked)}
              disabled={disabled}
              className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-900 w-4 h-4 dark:bg-zinc-950"
            />
            <span className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 flex items-center gap-1">
              {settings.keepAspectRatio ? <Lock className="w-3.5 h-3.5 text-emerald-500" /> : <Unlock className="w-3.5 h-3.5 text-zinc-450" />}
              Maintain aspect ratio
            </span>
          </label>
        </div>
      </div>
    </div>
  );
}
