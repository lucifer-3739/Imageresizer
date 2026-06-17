'use client';

import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import { ImageFile, CompressionSettings } from '@/types/image';
import { compressImage, getImageDimensions } from '@/lib/compress-image';
import { Hero } from '@/components/hero';
import { UploadZone } from '@/components/upload-zone';
import { CompressionSettingsPanel } from '@/components/compression-settings';
import { ImagePreviewList } from '@/components/image-preview';
import { StatsCard } from '@/components/stats-card';
import { ComparisonView } from '@/components/comparison-view';
import { ResultSection } from '@/components/result-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { Sparkles, Info, ShieldCheck, RefreshCw } from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function Home() {
  // Application State
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [settings, setSettings] = useState<CompressionSettings>({
    quality: 80,
    format: 'original',
    keepAspectRatio: true,
  });

  // Cleanup helper for object URLs to prevent memory leaks
  const cleanupFilesUrls = useCallback((filesList: ImageFile[]) => {
    filesList.forEach((f) => {
      if (f.originalPreviewUrl) URL.revokeObjectURL(f.originalPreviewUrl);
      if (f.compressedPreviewUrl) URL.revokeObjectURL(f.compressedPreviewUrl);
    });
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      cleanupFilesUrls(files);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast Management Helper
  const addToast = useCallback((message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  // Individual Compression Runner
  const compressSingleFile = useCallback(async (
    id: string,
    activeSettings: CompressionSettings,
    currentFilesList: ImageFile[]
  ) => {
    const target = currentFilesList.find((f) => f.id === id);
    if (!target) return;

    setFiles((prev) =>
      prev.map((f) =>
        f.id === id
          ? { ...f, status: 'compressing', progress: 0, errorMsg: undefined }
          : f
      )
    );

    try {
      const compressedFile = await compressImage(target.file, activeSettings, (progress) => {
        setFiles((prev) =>
          prev.map((f) => (f.id === id ? { ...f, progress } : f))
        );
      });

      // Release previous compressed URL if re-running
      if (target.compressedPreviewUrl) {
        URL.revokeObjectURL(target.compressedPreviewUrl);
      }

      const compressedPreviewUrl = URL.createObjectURL(compressedFile);
      const dims = await getImageDimensions(compressedFile);

      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'success',
                progress: 100,
                compressedFile,
                compressedSize: compressedFile.size,
                compressedPreviewUrl,
                compressedWidth: dims.width,
                compressedHeight: dims.height,
              }
            : f
        )
      );
    } catch (error: any) {
      console.error('Compression error for file:', target.name, error);
      setFiles((prev) =>
        prev.map((f) =>
          f.id === id
            ? {
                ...f,
                status: 'error',
                progress: 0,
                errorMsg: error.message || 'Compression failed',
              }
            : f
        )
      );
      addToast(`Failed to compress ${target.name}`, 'error');
    }
  }, [addToast]);

  // Handler for Files Added
  const handleFilesSelected = async (newFiles: File[]) => {
    const newImageFiles: ImageFile[] = [];
    addToast(`Processing ${newFiles.length} image(s)...`, 'info');

    for (const file of newFiles) {
      const id = Math.random().toString(36).substring(2, 9);
      const originalPreviewUrl = URL.createObjectURL(file);
      const dimensions = await getImageDimensions(file);
      const aspectRatio = dimensions.width > 0 ? dimensions.width / dimensions.height : 1;

      newImageFiles.push({
        id,
        file,
        name: file.name,
        originalSize: file.size,
        originalWidth: dimensions.width,
        originalHeight: dimensions.height,
        originalType: file.type,
        originalPreviewUrl,
        aspectRatio,
        status: 'idle',
        progress: 0,
      });
    }

    setFiles((prev) => {
      const updated = [...prev, ...newImageFiles];
      // Select the first image if nothing was selected yet
      if (!selectedFileId && updated.length > 0) {
        setSelectedFileId(updated[0].id);
      }
      
      // Auto-compress the newly added files
      newImageFiles.forEach((imageFile) => {
        compressSingleFile(imageFile.id, settings, updated);
      });

      return updated;
    });

    addToast(`Added ${newFiles.length} image(s) successfully.`, 'success');
  };

  // Handler for Settings Changes
  const handleSettingsChange = (newSettings: CompressionSettings) => {
    setSettings(newSettings);
    
    // Automatically re-compress all files when settings are adjusted
    if (files.length > 0) {
      files.forEach((f) => {
        compressSingleFile(f.id, newSettings, files);
      });
      addToast('Settings updated. Recompressing...', 'info');
    }
  };

  // Handler for File Selection
  const handleSelectFile = (id: string) => {
    setSelectedFileId(id);
  };

  // Handler for File Removal
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        if (target.originalPreviewUrl) URL.revokeObjectURL(target.originalPreviewUrl);
        if (target.compressedPreviewUrl) URL.revokeObjectURL(target.compressedPreviewUrl);
      }
      const updated = prev.filter((f) => f.id !== id);
      
      // If we deleted the active item, adjust selectedFileId
      if (selectedFileId === id) {
        setSelectedFileId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  // Handler for Single Download
  const handleDownloadSingle = (file: ImageFile) => {
    if (!file.compressedFile || !file.compressedPreviewUrl) return;
    
    const a = document.createElement('a');
    a.href = file.compressedPreviewUrl;
    a.download = file.compressedFile.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    addToast(`Downloaded ${file.compressedFile.name}`, 'success');
  };

  // Handler for Batch ZIP Download
  const handleDownloadZip = async () => {
    const successFiles = files.filter((f) => f.status === 'success' && f.compressedFile);
    if (successFiles.length === 0) return;

    setIsDownloadingZip(true);
    addToast('Generating ZIP archive...', 'info');

    try {
      const zip = new JSZip();
      
      successFiles.forEach((f) => {
        if (f.compressedFile) {
          zip.file(f.compressedFile.name, f.compressedFile);
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      const zipUrl = URL.createObjectURL(zipBlob);
      
      const a = document.createElement('a');
      a.href = zipUrl;
      a.download = `pixelshrink_compressed_${Date.now()}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(zipUrl);

      addToast('ZIP archive downloaded successfully!', 'success');
    } catch (err) {
      console.error('ZIP compilation error:', err);
      addToast('Failed to create ZIP package.', 'error');
    } finally {
      setIsDownloadingZip(false);
    }
  };

  // Handler to Clear workspace
  const handleClearAll = () => {
    cleanupFilesUrls(files);
    setFiles([]);
    setSelectedFileId(null);
    addToast('Workspace cleared.', 'info');
  };

  const activeFile = files.find((f) => f.id === selectedFileId) || null;

  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-black font-sans transition-colors duration-300">
      {/* Top Header */}
      <header className="sticky top-0 z-40 w-full border-b border-zinc-200/80 bg-white/85 dark:border-zinc-850 dark:bg-black/85 backdrop-blur-md transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center text-white dark:text-black font-extrabold text-sm tracking-tight shadow-sm select-none">
              P
            </div>
            <span className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50 select-none flex items-center gap-1.5">
              PixelShrink
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500">v1.0</span>
            </span>
          </div>
          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 flex flex-col justify-center">
        {files.length === 0 ? (
          // Landing View
          <div className="space-y-12 animate-fade-in">
            <Hero />
            <div className="max-w-2xl mx-auto w-full">
              <UploadZone onFilesSelected={handleFilesSelected} />
            </div>
            {/* Features Row */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto pt-6 text-center md:text-left">
              <div className="p-5 rounded-2xl border border-zinc-200/50 bg-white dark:border-zinc-900/50 dark:bg-zinc-950/20 space-y-2">
                <ShieldCheck className="w-6 h-6 text-emerald-500 mx-auto md:mx-0" />
                <h4 className="font-bold text-sm text-zinc-800 dark:text-zinc-250">Absolute Privacy</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">Images are compressed directly inside your browser. No files are uploaded to any server.</p>
              </div>
              <div className="p-5 rounded-2xl border border-zinc-200/50 bg-white dark:border-zinc-900/50 dark:bg-zinc-950/20 space-y-2">
                <Sparkles className="w-6 h-6 text-indigo-500 mx-auto md:mx-0" />
                <h4 className="font-bold text-sm text-zinc-855 dark:text-zinc-250">Quality Retention</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">Smart compression algorithms shrink file size by up to 90% while keeping visual details intact.</p>
              </div>
              <div className="p-5 rounded-2xl border border-zinc-200/50 bg-white dark:border-zinc-900/50 dark:bg-zinc-950/20 space-y-2">
                <Info className="w-6 h-6 text-sky-500 mx-auto md:mx-0" />
                <h4 className="font-bold text-sm text-zinc-855 dark:text-zinc-250">Batch Compression</h4>
                <p className="text-xs text-zinc-500 dark:text-zinc-450 leading-relaxed">Drop multiple JPEG, PNG, and WEBP files. Compress all at once and download as a ZIP package.</p>
              </div>
            </div>
          </div>
        ) : (
          // Dashboard Workspace View
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in">
            {/* Sidebar (Left Column - 5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Mini Upload Zone */}
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-4 shadow-2xs">
                <UploadZone onFilesSelected={handleFilesSelected} />
              </div>

              {/* Uploaded List Preview */}
              <ImagePreviewList
                files={files}
                selectedFileId={selectedFileId}
                onSelectFile={handleSelectFile}
                onRemoveFile={handleRemoveFile}
              />

              {/* Compression settings panel */}
              <CompressionSettingsPanel
                settings={settings}
                onSettingsChange={handleSettingsChange}
              />
            </div>

            {/* Editor/Visualizer Area (Right Column - 7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {activeFile ? (
                <>
                  {activeFile.status === 'compressing' && (
                    <div className="min-h-[400px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 rounded-2xl flex flex-col items-center justify-center p-8 space-y-4 shadow-2xs">
                      <RefreshCw className="w-8 h-8 text-zinc-455 animate-spin" />
                      <div className="space-y-1.5 text-center">
                        <p className="text-sm font-bold text-zinc-850 dark:text-zinc-250">Compressing Image...</p>
                        <p className="text-xs text-zinc-450 dark:text-zinc-500">Optimizing {activeFile.name} ({Math.round(activeFile.progress)}%)</p>
                      </div>
                    </div>
                  )}

                  {activeFile.status === 'error' && (
                    <div className="min-h-[400px] border border-red-200 bg-red-50/20 dark:border-red-900/30 dark:bg-red-950/5 rounded-2xl flex flex-col items-center justify-center p-8 space-y-3 shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-650 dark:text-red-400">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="text-sm font-bold text-red-800 dark:text-red-400">Optimization Failed</h4>
                        <p className="text-xs text-red-650 dark:text-red-500 max-w-sm leading-relaxed">{activeFile.errorMsg || 'An error occurred during compression.'}</p>
                      </div>
                    </div>
                  )}

                  {activeFile.status === 'success' && (
                    <div className="space-y-6">
                      {/* Before / After visual slider */}
                      <ComparisonView file={activeFile} />

                      {/* Compression stats summary card */}
                      <StatsCard file={activeFile} />
                    </div>
                  )}
                </>
              ) : (
                <div className="min-h-[400px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 rounded-2xl flex flex-col items-center justify-center p-8 space-y-2 shadow-2xs">
                  <p className="text-sm font-bold text-zinc-500 dark:text-zinc-450">No Image Selected</p>
                  <p className="text-xs text-zinc-450 dark:text-zinc-500">Select an image from the sidebar to inspect compression details.</p>
                </div>
              )}
            </div>

            {/* Bottom Actions footer (spans all columns) */}
            <div className="lg:col-span-12">
              <ResultSection
                files={files}
                activeFile={activeFile}
                onDownloadSingle={handleDownloadSingle}
                onDownloadZip={handleDownloadZip}
                onClearAll={handleClearAll}
                isDownloadingZip={isDownloadingZip}
              />
            </div>
          </div>
        )}
      </main>

      {/* Floating Toasts container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 pointer-events-none max-w-xs w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 px-4 py-3.5 rounded-xl border shadow-lg animate-fade-in text-xs font-semibold tracking-wide transition-all
              ${
                toast.type === 'success'
                  ? 'bg-zinc-950 border-zinc-800 text-white dark:bg-white dark:border-zinc-100 dark:text-zinc-950'
                  : toast.type === 'error'
                  ? 'bg-red-50 text-red-800 border-red-200 dark:bg-red-950/95 dark:text-red-200 dark:border-red-900/50'
                  : 'bg-zinc-900 border-zinc-800 text-zinc-50 dark:bg-zinc-900 dark:text-zinc-100'
              }
            `}
          >
            <span>{toast.message}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
