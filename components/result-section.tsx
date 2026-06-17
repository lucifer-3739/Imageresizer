'use client';

import React from 'react';
import { Download, Trash2, FileArchive } from 'lucide-react';
import { ImageFile } from '@/types/image';

interface ResultSectionProps {
  files: ImageFile[];
  activeFile: ImageFile | null;
  onDownloadSingle: (file: ImageFile) => void;
  onDownloadZip: () => void;
  onClearAll: () => void;
  isDownloadingZip?: boolean;
}

export function ResultSection({
  files,
  activeFile,
  onDownloadSingle,
  onDownloadZip,
  onClearAll,
  isDownloadingZip = false,
}: ResultSectionProps) {
  const successFiles = files.filter((f) => f.status === 'success');
  const hasSuccessFiles = successFiles.length > 0;

  if (files.length === 0 || !hasSuccessFiles) return null;

  const isBatch = files.length > 1;

  return (
    <div className="flex flex-col sm:flex-row gap-3 items-center justify-end w-full pt-6 border-t border-zinc-150 dark:border-zinc-800/60">
      {/* Clear All Button */}
      <button
        onClick={onClearAll}
        className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white hover:bg-zinc-50 dark:bg-zinc-900/50 dark:hover:bg-zinc-800/80 text-sm font-semibold text-zinc-750 dark:text-zinc-300 transition-colors shadow-2xs cursor-pointer"
      >
        <Trash2 className="w-4 h-4 text-zinc-400" />
        <span>Compress Another</span>
      </button>

      {/* Download Selected Image (available in batch mode for quick single extraction) */}
      {activeFile && activeFile.status === 'success' && isBatch && (
        <button
          onClick={() => onDownloadSingle(activeFile)}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4.5 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/30 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-sm font-bold text-zinc-800 dark:text-zinc-250 transition-colors shadow-2xs cursor-pointer"
        >
          <Download className="w-4 h-4" />
          <span>Download Selected</span>
        </button>
      )}

      {/* Main Action (ZIP for batch, single download for one file) */}
      {isBatch ? (
        <button
          onClick={onDownloadZip}
          disabled={isDownloadingZip}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-transparent bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-white text-sm font-bold transition-colors shadow-xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          {isDownloadingZip ? (
            <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
          ) : (
            <FileArchive className="w-4 h-4" />
          )}
          <span>Download All as ZIP ({successFiles.length} files)</span>
        </button>
      ) : (
        activeFile && activeFile.status === 'success' && (
          <button
            onClick={() => onDownloadSingle(activeFile)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5.5 py-2.5 rounded-xl border border-transparent bg-zinc-900 hover:bg-zinc-850 dark:bg-white dark:hover:bg-zinc-100 dark:text-zinc-950 text-white text-sm font-bold transition-colors shadow-xs cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download Compressed Image</span>
          </button>
        )
      )}
    </div>
  );
}
