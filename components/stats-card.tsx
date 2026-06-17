'use client';

import React, { useState } from 'react';
import { ImageFile } from '@/types/image';
import { formatSize } from '@/lib/format-size';
import { BarChart3, Copy, Check, FileText, Layout } from 'lucide-react';

interface StatsCardProps {
  file: ImageFile;
}

export function StatsCard({ file }: StatsCardProps) {
  const [copied, setCopied] = useState(false);

  if (!file || file.status !== 'success') return null;

  const originalSizeStr = formatSize(file.originalSize);
  const compressedSizeStr = file.compressedSize !== undefined ? formatSize(file.compressedSize) : 'N/A';
  const hasSavings = file.compressedSize !== undefined;
  
  const savedBytes = hasSavings ? file.originalSize - file.compressedSize! : 0;
  const savedSizeStr = formatSize(savedBytes);
  const savingsPercent = hasSavings && file.originalSize > 0
    ? Math.round((savedBytes / file.originalSize) * 100)
    : 0;

  const dimensionsStr = file.compressedWidth && file.compressedHeight
    ? `${file.compressedWidth} × ${file.compressedHeight}`
    : `${file.originalWidth} × ${file.originalHeight}`;

  const originalDimensionsStr = `${file.originalWidth} × ${file.originalHeight}`;
  const fileExtension = file.compressedFile?.type.split('/').pop()?.toUpperCase() || file.originalType.split('/').pop()?.toUpperCase();

  const copyStats = () => {
    const text = `PixelShrink Compression Stats for ${file.name}:
- Original Size: ${originalSizeStr} (${originalDimensionsStr})
- Compressed Size: ${compressedSizeStr} (${dimensionsStr})
- Space Saved: ${savedSizeStr} (-${savingsPercent}%)
- Format: ${fileExtension}`;

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-6 shadow-xs space-y-5">
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-850 pb-4">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-zinc-500" />
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-50">Compression Stats</h3>
        </div>
        <button
          onClick={copyStats}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 text-xs font-semibold text-zinc-600 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-zinc-100 transition-all cursor-pointer"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">Copied!</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span>Copy Stats</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {/* Original Size */}
        <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/10 space-y-1">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
            Original Size
          </span>
          <span className="text-lg font-extrabold text-zinc-800 dark:text-zinc-200">
            {originalSizeStr}
          </span>
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 block">
            {originalDimensionsStr}
          </span>
        </div>

        {/* Compressed Size */}
        <div className="p-4 rounded-xl border border-zinc-150 dark:border-zinc-800/50 bg-zinc-50/30 dark:bg-zinc-950/10 space-y-1">
          <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-550 uppercase tracking-wider block">
            Compressed Size
          </span>
          <span className="text-lg font-extrabold text-zinc-900 dark:text-zinc-50">
            {compressedSizeStr}
          </span>
          <span className="text-[10px] font-medium text-zinc-400 dark:text-zinc-500 block">
            {dimensionsStr}
          </span>
        </div>

        {/* Space Saved */}
        <div className="p-4 rounded-xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/20 dark:bg-emerald-950/5 space-y-1 col-span-2 md:col-span-1 flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-500 uppercase tracking-wider block">
              Space Saved
            </span>
            <span className="text-lg font-extrabold text-emerald-600 dark:text-emerald-450">
              {savedSizeStr}
            </span>
          </div>
          <div className="inline-flex mt-1">
            <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-250 dark:border-emerald-900/30">
              -{savingsPercent}% Saved
            </span>
          </div>
        </div>
      </div>
      
      <div className="grid grid-cols-2 gap-4 pt-1">
        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <FileText className="w-4 h-4 text-zinc-400" />
          <span>Format: <strong className="text-zinc-700 dark:text-zinc-300 font-bold uppercase">{fileExtension}</strong></span>
        </div>
        <div className="flex items-center gap-2 text-sm text-zinc-500 font-medium">
          <Layout className="w-4 h-4 text-zinc-400" />
          <span>Status: <strong className="text-emerald-600 dark:text-emerald-450 font-bold uppercase">Optimized</strong></span>
        </div>
      </div>
    </div>
  );
}
