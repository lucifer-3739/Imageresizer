'use client';

import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, AlertCircle } from 'lucide-react';

interface UploadZoneProps {
  onFilesSelected: (files: File[]) => void;
  disabled?: boolean;
}

export function UploadZone({ onFilesSelected, disabled = false }: UploadZoneProps) {
  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      if (acceptedFiles && acceptedFiles.length > 0) {
        onFilesSelected(acceptedFiles);
      }
    },
    [onFilesSelected]
  );

  const { getRootProps, getInputProps, isDragActive, fileRejections } = useDropzone({
    onDrop,
    disabled,
    accept: {
      'image/jpeg': ['.jpeg', '.jpg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
    },
    multiple: true,
  });

  return (
    <div className="w-full">
      <div
        {...getRootProps()}
        className={`relative flex flex-col items-center justify-center w-full min-h-[260px] border border-dashed rounded-2xl cursor-pointer p-8 text-center transition-all outline-hidden
          ${
            disabled
              ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/20 cursor-not-allowed opacity-60'
              : isDragActive
              ? 'border-zinc-900 bg-zinc-50/50 dark:border-zinc-100 dark:bg-zinc-900/50 scale-[0.99] shadow-inner'
              : 'border-zinc-200 hover:border-zinc-400 bg-white hover:bg-zinc-50/50 dark:border-zinc-800 dark:bg-zinc-950/30 dark:hover:border-zinc-700 dark:hover:bg-zinc-900/30'
          }
        `}
      >
        <input {...getInputProps()} />
        
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className={`p-4 rounded-full transition-all duration-300 ${
            isDragActive 
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 scale-110 shadow-md' 
              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400'
          }`}>
            <Upload className="w-8 h-8" />
          </div>
          
          <div className="space-y-2 max-w-sm">
            <p className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
              {isDragActive ? 'Drop your images here' : 'Drag & drop images here'}
            </p>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              or <span className="text-zinc-900 dark:text-zinc-100 font-medium underline underline-offset-4 decoration-zinc-400 hover:decoration-zinc-900 transition-colors">browse files</span> from your computer
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500">
              Supports JPEG, JPG, PNG, and WEBP
            </p>
          </div>
        </div>
      </div>
      
      {fileRejections.length > 0 && (
        <div className="mt-4 p-3 rounded-lg border border-red-200 bg-red-50 text-red-800 dark:border-red-900/30 dark:bg-red-950/20 dark:text-red-400 flex items-start gap-2 text-sm animate-fade-in">
          <AlertCircle className="w-4.5 h-4.5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold text-red-800 dark:text-red-400">Some files were rejected</p>
            <p className="text-xs mt-0.5 opacity-90 text-red-700 dark:text-red-500">Please upload only valid image files (JPG, PNG, or WEBP).</p>
          </div>
        </div>
      )}
    </div>
  );
}
