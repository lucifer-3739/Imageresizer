'use client';

import React from 'react';
import { ConvertSettings, SupportedConvertFormat } from '@/types/image';
import { RefreshCw, Sliders, Palette, Info } from 'lucide-react';

interface ConverterPanelProps {
  settings: ConvertSettings;
  onSettingsChange: (settings: ConvertSettings) => void;
  disabled?: boolean;
}

export function ConverterPanel({
  settings,
  onSettingsChange,
  disabled = false,
}: ConverterPanelProps) {
  const update = <K extends keyof ConvertSettings>(key: K, value: ConvertSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const formats: {
    id: SupportedConvertFormat;
    label: string;
    badge: string;
    desc: string;
    supportsAlpha: boolean;
  }[] = [
    { id: 'webp', label: 'WEBP', badge: 'Recommended', desc: 'Modern web format, high efficiency', supportsAlpha: true },
    { id: 'jpeg', label: 'JPEG', badge: 'Universal', desc: 'Best for standard photos & compatibility', supportsAlpha: false },
    { id: 'png', label: 'PNG', badge: 'Lossless', desc: 'Crisp graphics with transparency', supportsAlpha: true },
    { id: 'avif', label: 'AVIF', badge: 'Next-Gen', desc: 'Ultra-efficient next generation format', supportsAlpha: true },
    { id: 'ico', label: 'ICO', badge: 'Favicon', desc: 'Windows icon & website favicon', supportsAlpha: true },
    { id: 'bmp', label: 'BMP', badge: 'Bitmap', desc: 'Uncompressed Windows Bitmap file', supportsAlpha: false },
  ];

  const activeFmtObj = formats.find((f) => f.id === settings.targetFormat);

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-5 h-5 text-emerald-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Image Converter</h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
          6 Formats Supported
        </span>
      </div>

      {/* Target Format Grid */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
          Target Output Format
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {formats.map((fmt) => {
            const isSelected = settings.targetFormat === fmt.id;
            return (
              <button
                key={fmt.id}
                type="button"
                onClick={() => update('targetFormat', fmt.id)}
                disabled={disabled}
                className={`p-3 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between min-h-[78px]
                  ${
                    isSelected
                      ? 'border-emerald-600 bg-emerald-50/50 dark:border-emerald-500 dark:bg-emerald-950/30 shadow-xs'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                  }
                `}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="text-sm font-extrabold uppercase text-zinc-900 dark:text-zinc-100">
                    {fmt.label}
                  </span>
                  <span
                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded
                      ${
                        isSelected
                          ? 'bg-emerald-600 text-white dark:bg-emerald-500'
                          : 'bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400'
                      }
                    `}
                  >
                    {fmt.badge}
                  </span>
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 line-clamp-1 mt-1">
                  {fmt.desc}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* ICO Favicon Resolution Picker */}
      {settings.targetFormat === 'ico' && (
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850 animate-fade-in">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center justify-between">
            <span>Icon Layer Resolution</span>
            <span className="text-[10px] text-zinc-500">{settings.icoSize} × {settings.icoSize} px</span>
          </label>
          <div className="grid grid-cols-6 gap-1.5">
            {[16, 32, 48, 64, 128, 256].map((sz) => (
              <button
                key={sz}
                type="button"
                onClick={() => update('icoSize', sz)}
                disabled={disabled}
                className={`py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer text-center
                  ${
                    settings.icoSize === sz
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700 dark:border-emerald-500 dark:bg-emerald-950/40 dark:text-emerald-300'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                  }
                `}
              >
                {sz}px
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quality Slider (for lossy formats) */}
      {(settings.targetFormat === 'jpeg' ||
        settings.targetFormat === 'webp' ||
        settings.targetFormat === 'avif') && (
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850 animate-fade-in">
          <div className="flex justify-between items-center text-xs">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-zinc-400" />
              Encoding Quality
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
            className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-emerald-600 dark:accent-emerald-400"
          />
        </div>
      )}

      {/* Background Fill for Opaque Formats */}
      {(!activeFmtObj?.supportsAlpha || (settings.backgroundColor && settings.backgroundColor !== 'transparent')) && (
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850 animate-fade-in">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex items-center gap-1.5">
            <Palette className="w-3.5 h-3.5 text-zinc-400" />
            Background Color (for transparent PNG/SVG inputs)
          </label>
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={settings.backgroundColor === 'transparent' ? '#ffffff' : settings.backgroundColor}
              onChange={(e) => update('backgroundColor', e.target.value)}
              disabled={disabled}
              className="w-8 h-8 rounded-lg border border-zinc-200 dark:border-zinc-700 cursor-pointer p-0.5"
            />
            {activeFmtObj?.supportsAlpha && (
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
            )}
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

      {/* Info notice */}
      <div className="flex items-start gap-2 p-3 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 border border-zinc-200/50 dark:border-zinc-800/50 text-[11px] text-zinc-500">
        <Info className="w-4 h-4 shrink-0 text-emerald-500 mt-0.5" />
        <p>
          Converts images client-side instantly with pixel-level color precision. No data uploaded to servers.
        </p>
      </div>
    </div>
  );
}
