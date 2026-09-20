'use client';

import React from 'react';
import { PdfSettings } from '@/types/image';
import { FileText, Sliders, Layout, Layers, CheckSquare, Square, Info } from 'lucide-react';

interface PdfPanelProps {
  settings: PdfSettings;
  onSettingsChange: (settings: PdfSettings) => void;
  filesCount?: number;
  disabled?: boolean;
}

export function PdfPanel({
  settings,
  onSettingsChange,
  filesCount = 1,
  disabled = false,
}: PdfPanelProps) {
  const update = <K extends keyof PdfSettings>(key: K, value: PdfSettings[K]) => {
    onSettingsChange({
      ...settings,
      [key]: value,
    });
  };

  const pageSizes = [
    { id: 'a4', label: 'A4', desc: 'Standard (210 × 297mm)' },
    { id: 'letter', label: 'US Letter', desc: '8.5 × 11 inches' },
    { id: 'legal', label: 'US Legal', desc: '8.5 × 14 inches' },
    { id: 'fit', label: 'Fit to Image', desc: 'Exact photo dimensions' },
    { id: 'square', label: 'Square', desc: '1:1 ratio canvas' },
  ] as const;

  const orientations = [
    { id: 'auto', label: 'Auto' },
    { id: 'portrait', label: 'Portrait' },
    { id: 'landscape', label: 'Landscape' },
  ] as const;

  const margins = [
    { id: 'none', label: 'None (Full Bleed)' },
    { id: 'small', label: 'Small (5mm)' },
    { id: 'normal', label: 'Normal (10mm)' },
    { id: 'large', label: 'Large (16mm)' },
  ] as const;

  const layouts = [
    { id: '1-per-page', label: '1 per page', desc: 'Standard single photo' },
    { id: '2-per-page', label: '2 per page', desc: '2 photos stacked' },
    { id: '4-per-page', label: '4 per page', desc: '2 × 2 photo grid' },
  ] as const;

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-6">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800/60 pb-4">
        <div className="flex items-center gap-2">
          <FileText className="w-5 h-5 text-rose-500" />
          <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">PDF Studio Settings</h2>
        </div>
        <span className="text-xs font-bold px-2 py-0.5 rounded bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-800">
          pdf-lib Engine
        </span>
      </div>

      {/* Multi-Image Merge Mode */}
      {filesCount > 1 && (
        <div className="p-3.5 rounded-xl bg-rose-50/50 dark:bg-rose-950/20 border border-rose-200/60 dark:border-rose-900/40 space-y-2 animate-fade-in">
          <label
            onClick={() => update('mergeAllIntoSinglePdf', !settings.mergeAllIntoSinglePdf)}
            className="flex items-center justify-between cursor-pointer select-none"
          >
            <div className="space-y-0.5">
              <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                Merge all {filesCount} images into 1 combined PDF
              </p>
              <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                {settings.mergeAllIntoSinglePdf
                  ? 'All images will be compiled into a single multi-page PDF book.'
                  : 'Each image will produce its own separate PDF file.'}
              </p>
            </div>
            <div className="text-rose-600 dark:text-rose-400 shrink-0">
              {settings.mergeAllIntoSinglePdf ? (
                <CheckSquare className="w-5 h-5" />
              ) : (
                <Square className="w-5 h-5" />
              )}
            </div>
          </label>
        </div>
      )}

      {/* Document Name */}
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
          PDF Document Title
        </label>
        <input
          type="text"
          placeholder="pixelshrink_document"
          value={settings.pdfTitle}
          onChange={(e) => update('pdfTitle', e.target.value)}
          disabled={disabled}
          className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 py-2 px-3 text-sm shadow-xs focus:ring-1 focus:ring-rose-500 outline-hidden"
        />
      </div>

      {/* Paper Size */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
          Paper / Canvas Size
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
          {pageSizes.map((ps) => {
            const isSelected = settings.pageSize === ps.id;
            return (
              <button
                key={ps.id}
                type="button"
                onClick={() => update('pageSize', ps.id)}
                disabled={disabled}
                className={`p-2.5 rounded-xl border text-left cursor-pointer transition-all
                  ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50/60 dark:border-rose-500 dark:bg-rose-950/30'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30'
                  }
                `}
              >
                <p className="text-xs font-bold text-zinc-900 dark:text-zinc-100">{ps.label}</p>
                <p className="text-[10px] text-zinc-400 line-clamp-1">{ps.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Orientation (Only for standard fixed paper sizes) */}
      {settings.pageSize !== 'fit' && (
        <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850 animate-fade-in">
          <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
            Page Orientation
          </label>
          <div className="grid grid-cols-3 gap-2 p-1 bg-zinc-100 dark:bg-zinc-950 rounded-xl border border-zinc-200/60 dark:border-zinc-800">
            {orientations.map((ori) => (
              <button
                key={ori.id}
                type="button"
                onClick={() => update('orientation', ori.id)}
                disabled={disabled}
                className={`py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer text-center
                  ${
                    settings.orientation === ori.id
                      ? 'bg-white dark:bg-zinc-800 text-zinc-950 dark:text-white shadow-xs'
                      : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200'
                  }
                `}
              >
                {ori.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Margins */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
          Page Margins
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {margins.map((m) => {
            const isSelected = settings.margin === m.id;
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => update('margin', m.id)}
                disabled={disabled}
                className={`py-2 px-2.5 rounded-xl border text-center text-xs font-semibold transition-all cursor-pointer
                  ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50 text-rose-700 dark:border-rose-500 dark:bg-rose-950/40 dark:text-rose-300'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-850 text-zinc-600 dark:text-zinc-400'
                  }
                `}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Layout Grid (1, 2, or 4 images per page) */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
        <label className="text-xs font-semibold text-zinc-600 dark:text-zinc-400 block">
          Page Layout Grid
        </label>
        <div className="grid grid-cols-3 gap-2">
          {layouts.map((l) => {
            const isSelected = settings.layout === l.id;
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => update('layout', l.id)}
                disabled={disabled}
                className={`p-2.5 rounded-xl border text-center cursor-pointer transition-all
                  ${
                    isSelected
                      ? 'border-rose-600 bg-rose-50/60 dark:border-rose-500 dark:bg-rose-950/30 text-rose-900 dark:text-rose-200'
                      : 'border-zinc-200 dark:border-zinc-800 hover:bg-zinc-50 dark:hover:bg-zinc-900/30 text-zinc-700 dark:text-zinc-300'
                  }
                `}
              >
                <p className="text-xs font-bold">{l.label}</p>
                <p className="text-[10px] text-zinc-400">{l.desc}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Embedded Image Compression Slider */}
      <div className="space-y-2 pt-2 border-t border-zinc-100 dark:border-zinc-850">
        <div className="flex justify-between items-center text-xs">
          <label className="font-semibold text-zinc-700 dark:text-zinc-300 flex items-center gap-1.5">
            <Sliders className="w-3.5 h-3.5 text-zinc-400" />
            PDF Image Compression Quality
          </label>
          <span className="font-mono font-bold text-zinc-800 dark:text-zinc-200">
            {settings.imageQuality}%
          </span>
        </div>
        <input
          type="range"
          min="30"
          max="100"
          value={settings.imageQuality}
          onChange={(e) => update('imageQuality', parseInt(e.target.value))}
          disabled={disabled}
          className="w-full h-1.5 bg-zinc-150 dark:bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500"
        />
        <div className="flex justify-between text-[10px] text-zinc-400">
          <span>Small File (Email)</span>
          <span>Balanced</span>
          <span>Max Quality (Print)</span>
        </div>
      </div>
    </div>
  );
}
