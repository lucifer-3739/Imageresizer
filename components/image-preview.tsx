'use client';

import React from 'react';
import { ImageFile } from '@/types/image';
import { formatSize } from '@/lib/format-size';
import { X, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react';

interface ImagePreviewListProps {
  files: ImageFile[];
  selectedFileId: string | null;
  onSelectFile: (id: string) => void;
  onRemoveFile: (id: string) => void;
}

export function ImagePreviewList({
  files,
  selectedFileId,
  onSelectFile,
  onRemoveFile,
}: ImagePreviewListProps) {
  if (files.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex justify-between items-center">
        <h3 className="text-xs font-bold text-zinc-450 dark:text-zinc-400 uppercase tracking-wider">
          Uploaded Images ({files.length})
        </h3>
        <span className="text-xs text-zinc-400 dark:text-zinc-550">Click to select & inspect</span>
      </div>
      
      <div className="grid gap-2.5 max-h-[360px] overflow-y-auto pr-1">
        {files.map((file) => {
          const isSelected = file.id === selectedFileId;
          const hasSavings = file.status === 'success' && file.compressedSize !== undefined;
          const savingsPercent = hasSavings && file.originalSize > 0
            ? Math.round(((file.originalSize - file.compressedSize!) / file.originalSize) * 100)
            : 0;

          return (
            <div
              key={file.id}
              onClick={() => onSelectFile(file.id)}
              className={`group relative flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer select-none
                ${
                  isSelected
                    ? 'border-zinc-900 bg-zinc-50/80 dark:border-white dark:bg-zinc-900/50 shadow-xs'
                    : 'border-zinc-200/80 bg-white hover:bg-zinc-50/40 dark:border-zinc-800/80 dark:bg-zinc-950/20 dark:hover:bg-zinc-900/20'
                }
              `}
            >
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Thumbnail */}
                <div className="relative w-12 h-12 rounded-lg overflow-hidden bg-zinc-100 dark:bg-zinc-900 shrink-0 border border-zinc-200/50 dark:border-zinc-800/80 flex items-center justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={file.originalPreviewUrl}
                    alt={file.name}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* File Details */}
                <div className="min-w-0 flex-1 pr-4">
                  <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 truncate">
                    {file.name}
                  </p>
                  
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5 text-xs text-zinc-500 font-medium">
                    <span>{formatSize(file.originalSize)}</span>
                    {file.status === 'success' && file.compressedSize !== undefined && (
                      <>
                        <span className="text-zinc-400">→</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                          {formatSize(file.compressedSize)}
                        </span>
                        {savingsPercent > 0 && (
                          <span className="px-1.5 py-0.2 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400 font-bold text-[10px]">
                            -{savingsPercent}%
                          </span>
                        )}
                      </>
                    )}
                  </div>
                </div>
              </div>

              {/* Status Actions */}
              <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
                {file.status === 'compressing' && (
                  <div className="flex items-center gap-2 text-zinc-500">
                    <RefreshCw className="w-4.5 h-4.5 animate-spin text-zinc-400 dark:text-zinc-500" />
                    <span className="text-xs font-mono font-bold">{Math.round(file.progress)}%</span>
                  </div>
                )}
                
                {file.status === 'success' && (
                  <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                )}
                
                {file.status === 'error' && (
                  <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400" title={file.errorMsg}>
                    <AlertCircle className="w-5 h-5" />
                  </div>
                )}

                <button
                  onClick={() => onRemoveFile(file.id)}
                  className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1.5 rounded-lg text-zinc-400 hover:text-zinc-900 hover:bg-zinc-100 dark:hover:text-zinc-100 dark:hover:bg-zinc-800 transition-all ml-1"
                  aria-label="Remove image"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
