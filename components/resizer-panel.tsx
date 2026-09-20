'use client';

import React from 'react';
import { ResizeSettings } from '@/types/image';
import { SOCIAL_PRESETS } from '@/lib/resize-image';
import { Scaling, Lock, Unlock, Sliders, Palette } from 'lucide-react';

interface ResizerPanelProps {
  settings: ResizeSettings;
  onSettingsChange: (settings: ResizeSettings) => void;
  originalWidth?: number;
  originalHeight?: number;
  disabled?: boolean;
}

export function ResizerPanel({
  settings,
  onSettingsChange,
  originalWidth = 1920,
  originalHeight = 1080,
  disabled = false,
}: ResizerPanelProps) {
  const update = <K extends keyof ResizeSettings>(key: K, value: ResizeSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
        <div className="flex items-center gap-2">
          <Scaling className="w-5 h-5 text-indigo-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Resize Settings</h2>
        </div>
        <span className="text-xs font-mono text-zinc-500">
          Source: {originalWidth} × {originalHeight} px
        </span>
      </div>

      {/* Resize Mode Selector */}
      <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
        {(['exact', 'percentage', 'preset'] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => update('mode', m)}
            disabled={disabled}
            className={`py-1.5 px-2 rounded-lg text-xs font-semibold capitalize transition-all cursor-pointer
              ${
                settings.mode === m
                  ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                  : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
              }
            `}
          >
            {m === 'exact' ? 'Exact Pixels' : m === 'percentage' ? 'Percentage' : 'Social Presets'}
          </button>
        ))}
      </div>

      {/* Mode 1: Exact Dimensions */}
      {settings.mode === 'exact' && (
        <div className="space-y-4 animate-fade-in">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Width (px)
              </label>
              <input
                type="number"
                min="1"
                placeholder={originalWidth.toString()}
                value={settings.width || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  update('width', val);
                }}
                disabled={disabled}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-sm shadow-xs focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-hidden"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                Height (px)
              </label>
              <input
                type="number"
                min="1"
                placeholder={originalHeight.toString()}
                value={settings.height || ''}
                onChange={(e) => {
                  const val = e.target.value ? parseInt(e.target.value) : undefined;
                  update('height', val);
                }}
                disabled={disabled}
                className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-sm shadow-xs focus:ring-1 focus:ring-zinc-900 dark:focus:ring-white outline-hidden"
              />
            </div>
          </div>

          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={settings.maintainAspectRatio}
              onChange={(e) => update('maintainAspectRatio', e.target.checked)}
              disabled={disabled}
              className="rounded border-zinc-300 dark:border-zinc-700 text-zinc-900 focus:ring-zinc-900 w-4 h-4 dark:bg-zinc-950"
            />
            <span className="text-xs font-semibold text-zinc-650 dark:text-zinc-400 flex items-center gap-1">
              {settings.maintainAspectRatio ? (
                <Lock className="w-3.5 h-3.5 text-emerald-500" />
              ) : (
                <Unlock className="w-3.5 h-3.5 text-zinc-400" />
              )}
              Maintain aspect ratio
            </span>
          </label>
        </div>
      )}

      {/* Mode 2: Percentage Scaling */}
      {settings.mode === 'percentage' && (
        <div className="space-y-4 animate-fade-in">
          <div className="flex justify-between items-center text-sm">
            <label className="font-semibold text-zinc-800 dark:text-zinc-200">Scale Factor</label>
            <span className="font-mono bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300 px-2 py-0.5 rounded-md font-bold text-xs">
              {settings.percentage}% (
              {Math.round(originalWidth * (settings.percentage / 100))} ×{' '}
              {Math.round(originalHeight * (settings.percentage / 100))} px)
            </span>
          </div>

          <input
            type="range"
            min="10"
            max="400"
            step="5"
            value={settings.percentage}
            onChange={(e) => update('percentage', parseInt(e.target.value))}
            disabled={disabled}
            className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-indigo-600 dark:accent-indigo-400"
          />

          <div className="flex flex-wrap gap-2 pt-1">
            {[25, 50, 75, 100, 150, 200].map((pct) => (
              <button
                key={pct}
                type="button"
                onClick={() => update('percentage', pct)}
                disabled={disabled}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                  ${
                    settings.percentage === pct
                      ? 'border-indigo-500 bg-indigo-50 text-indigo-700 dark:bg-indigo-950/40 dark:text-indigo-300'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                  }
                `}
              >
                {pct}%
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Mode 3: Social Media Presets */}
      {settings.mode === 'preset' && (
        <div className="space-y-3 animate-fade-in">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
            Select Social Template
          </label>
          <div className="grid grid-cols-1 gap-2 max-h-[220px] overflow-y-auto pr-1">
            {SOCIAL_PRESETS.map((p) => {
              const isSelected = settings.preset === p.id;
              return (
                <div
                  key={p.id}
                  onClick={() => update('preset', p.id)}
                  className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between
                    ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/50 dark:border-indigo-500 dark:bg-indigo-950/30'
                        : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                    }
                  `}
                >
                  <div>
                    <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{p.name}</p>
                    <p className="text-[10px] text-zinc-500">{p.description}</p>
                  </div>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 font-semibold">
                    {p.width} × {p.height}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Fit Modes (Contain / Cover / Stretch) */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
          Fitting Mode
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(
            [
              { id: 'contain', label: 'Contain', desc: 'Fit within canvas' },
              { id: 'cover', label: 'Cover', desc: 'Crop to fill' },
              { id: 'stretch', label: 'Stretch', desc: 'Exact scale' },
            ] as const
          ).map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => update('fit', f.id)}
              disabled={disabled}
              className={`p-2 rounded-xl border text-left cursor-pointer transition-all
                ${
                  settings.fit === f.id
                    ? 'border-zinc-900 bg-zinc-50 dark:border-white dark:bg-zinc-800'
                    : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                }
              `}
            >
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{f.label}</p>
              <p className="text-[10px] text-zinc-400">{f.desc}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Background Color for Contain Mode */}
      {settings.fit === 'contain' && (
        <div className="space-y-2 pt-2 animate-fade-in">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-zinc-400" />
            Canvas Fill Color (for borders)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor}
              onChange={(e) => update('backgroundColor', e.target.value)}
              disabled={disabled}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0.5"
            />
            <button
              type="button"
              onClick={() => update('backgroundColor', 'transparent')}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer
                ${
                  settings.backgroundColor === 'transparent'
                    ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
                    : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400'
                }
              `}
            >
              Transparent
            </button>
            <button
              type="button"
              onClick={() => update('backgroundColor', '#ffffff')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850"
            >
              White
            </button>
            <button
              type="button"
              onClick={() => update('backgroundColor', '#000000')}
              className="px-2.5 py-1.5 rounded-lg text-xs font-semibold border border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-850"
            >
              Black
            </button>
          </div>
        </div>
      )}

      {/* Quality Slider */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            Output Quality
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
          className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-zinc-900 dark:accent-white"
        />
      </div>
    </div>
  );
}
