'use client';

import React, { useState, useEffect, useCallback } from 'react';
import JSZip from 'jszip';
import {
  ImageFile,
  ToolMode,
  CompressionSettings,
  ResizeSettings,
  ConvertSettings,
  CropTransformSettings,
  MediaExtractSettings,
  PdfSettings,
} from '@/types/image';
import { compressImage, getImageDimensions } from '@/lib/compress-image';
import { resizeImage } from '@/lib/resize-image';
import { convertImage } from '@/lib/convert-image';
import { transformImage } from '@/lib/crop-transform';
import { extractAudioFromMedia, extractFramesFromVideo } from '@/lib/media-extractor';
import { generatePdfFromImages } from '@/lib/image-to-pdf';

import { Hero } from '@/components/hero';
import { NavbarTabs } from '@/components/navbar-tabs';
import { UploadZone } from '@/components/upload-zone';
import { CompressionSettingsPanel } from '@/components/compression-settings';
import { ResizerPanel } from '@/components/resizer-panel';
import { ConverterPanel } from '@/components/converter-panel';
import { CropPanel } from '@/components/crop-panel';
import { MediaExtractorPanel } from '@/components/media-extractor-panel';
import { PdfPanel } from '@/components/pdf-panel';
import { ImagePreviewList } from '@/components/image-preview';
import { StatsCard } from '@/components/stats-card';
import { ComparisonView } from '@/components/comparison-view';
import { ResultSection } from '@/components/result-section';
import { ThemeToggle } from '@/components/theme-toggle';
import { formatSize } from '@/lib/format-size';

import {
  Sparkles,
  Info,
  ShieldCheck,
  RefreshCw,
  Scaling,
  Minimize2,
  Crop,
  Film,
  FileText,
  Download,
  CheckCircle2,
} from 'lucide-react';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'info' | 'error';
}

export default function Home() {
  // Application State
  const [toolMode, setToolMode] = useState<ToolMode>('compress');
  const [files, setFiles] = useState<ImageFile[]>([]);
  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [isDownloadingZip, setIsDownloadingZip] = useState(false);
  const [mergedPdfFile, setMergedPdfFile] = useState<File | null>(null);
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Tool Specific Settings
  const [compressSettings, setCompressSettings] = useState<CompressionSettings>({
    quality: 80,
    format: 'original',
    keepAspectRatio: true,
  });

  const [resizeSettings, setResizeSettings] = useState<ResizeSettings>({
    mode: 'exact',
    width: undefined,
    height: undefined,
    percentage: 100,
    preset: 'youtube-thumbnail',
    maintainAspectRatio: true,
    fit: 'contain',
    backgroundColor: 'transparent',
    quality: 90,
  });

  const [convertSettings, setConvertSettings] = useState<ConvertSettings>({
    targetFormat: 'webp',
    quality: 85,
    backgroundColor: 'transparent',
    icoSize: 64,
  });

  const [cropSettings, setCropSettings] = useState<CropTransformSettings>({
    aspectRatioPreset: 'free',
    rotation: 0,
    flipHorizontal: false,
    flipVertical: false,
    quality: 90,
  });

  const [mediaSettings, setMediaSettings] = useState<MediaExtractSettings>({
    mode: 'audio',
    audioFormat: 'wav',
    frameInterval: 2,
    maxFrames: 8,
  });

  const [pdfSettings, setPdfSettings] = useState<PdfSettings>({
    pageSize: 'a4',
    orientation: 'auto',
    margin: 'normal',
    layout: '1-per-page',
    mergeAllIntoSinglePdf: true,
    imageQuality: 85,
    pdfTitle: 'pixelshrink_document',
  });

  // Cleanup helper for object URLs
  const cleanupFilesUrls = useCallback((filesList: ImageFile[]) => {
    filesList.forEach((f) => {
      if (f.originalPreviewUrl) URL.revokeObjectURL(f.originalPreviewUrl);
      if (f.compressedPreviewUrl) URL.revokeObjectURL(f.compressedPreviewUrl);
      if (f.extractedFrames) {
        f.extractedFrames.forEach((frame) => URL.revokeObjectURL(frame.url));
      }
    });
  }, []);

  useEffect(() => {
    return () => {
      cleanupFilesUrls(files);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Toast Helper
  const addToast = useCallback(
    (message: string, type: 'success' | 'info' | 'error' = 'success') => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, message, type }]);
      setTimeout(() => {
        setToasts((prev) => prev.filter((t) => t.id !== id));
      }, 3000);
    },
    []
  );

  // Single File Processor
  const processSingleFile = useCallback(
    async (
      id: string,
      mode: ToolMode,
      cSettings: CompressionSettings,
      rSettings: ResizeSettings,
      convSettings: ConvertSettings,
      crSettings: CropTransformSettings,
      mSettings: MediaExtractSettings,
      pSettings: PdfSettings,
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
        let processedFile: File | undefined;
        let extractedAudio: File | undefined;
        let extractedFramesList: { url: string; time: number; name: string; file: File }[] | undefined;
        let generatedPdf: File | undefined;

        if (mode === 'compress') {
          processedFile = await compressImage(target.file, cSettings, (progress) => {
            setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
          });
        } else if (mode === 'resize') {
          processedFile = await resizeImage(target.file, rSettings, (progress) => {
            setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
          });
        } else if (mode === 'convert') {
          processedFile = await convertImage(target.file, convSettings, (progress) => {
            setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
          });
        } else if (mode === 'crop') {
          processedFile = await transformImage(target.file, crSettings, (progress) => {
            setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
          });
        } else if (mode === 'media') {
          if (mSettings.mode === 'audio') {
            extractedAudio = await extractAudioFromMedia(target.file, (progress) => {
              setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
            });
            processedFile = extractedAudio;
          } else {
            extractedFramesList = await extractFramesFromVideo(
              target.file,
              mSettings.frameInterval,
              mSettings.maxFrames,
              (progress) => {
                setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
              }
            );
            if (extractedFramesList.length > 0) {
              processedFile = extractedFramesList[0].file;
            }
          }
        } else if (mode === 'pdf') {
          generatedPdf = await generatePdfFromImages([target.file], pSettings, (progress) => {
            setFiles((prev) => prev.map((f) => (f.id === id ? { ...f, progress } : f)));
          });
          processedFile = generatedPdf;
        }

        // Clean up previous output URL
        if (target.compressedPreviewUrl) {
          URL.revokeObjectURL(target.compressedPreviewUrl);
        }

        let compressedPreviewUrl: string | undefined;
        let dims = { width: target.originalWidth, height: target.originalHeight };

        if (processedFile && !target.isVideo && !target.isAudio && mode !== 'pdf') {
          compressedPreviewUrl = URL.createObjectURL(processedFile);
          dims = await getImageDimensions(processedFile);
        } else if (extractedFramesList && extractedFramesList.length > 0) {
          compressedPreviewUrl = extractedFramesList[0].url;
        }

        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: 'success',
                  progress: 100,
                  compressedFile: processedFile,
                  compressedSize: processedFile?.size,
                  compressedPreviewUrl,
                  compressedWidth: dims.width,
                  compressedHeight: dims.height,
                  extractedAudioFile: extractedAudio,
                  extractedFrames: extractedFramesList,
                  generatedPdfFile: generatedPdf,
                }
              : f
          )
        );
      } catch (error: any) {
        console.error('Processing error for file:', target.name, error);
        setFiles((prev) =>
          prev.map((f) =>
            f.id === id
              ? {
                  ...f,
                  status: 'error',
                  progress: 0,
                  errorMsg: error.message || 'Operation failed',
                }
              : f
          )
        );
        addToast(`Failed to process ${target.name}`, 'error');
      }
    },
    [addToast]
  );

  // Trigger processing on all active files
  const triggerProcessAll = useCallback(
    async (
      mode: ToolMode,
      cSettings: CompressionSettings,
      rSettings: ResizeSettings,
      convSettings: ConvertSettings,
      crSettings: CropTransformSettings,
      mSettings: MediaExtractSettings,
      pSettings: PdfSettings,
      filesList: ImageFile[]
    ) => {
      if (mode === 'pdf' && pSettings.mergeAllIntoSinglePdf && filesList.length > 1) {
        // Multi-image merge to 1 single PDF
        setFiles((prev) =>
          prev.map((f) => ({ ...f, status: 'compressing', progress: 0 }))
        );
        try {
          const rawFiles = filesList.map((f) => f.file);
          const merged = await generatePdfFromImages(rawFiles, pSettings, (p) => {
            setFiles((prev) => prev.map((f) => ({ ...f, progress: p })));
          });
          setMergedPdfFile(merged);
          setFiles((prev) =>
            prev.map((f) => ({
              ...f,
              status: 'success',
              progress: 100,
              generatedPdfFile: merged,
            }))
          );
          addToast(`Generated merged PDF (${filesList.length} pages)`, 'success');
        } catch (e: any) {
          console.error(e);
          setFiles((prev) =>
            prev.map((f) => ({
              ...f,
              status: 'error',
              errorMsg: e.message || 'PDF compilation failed',
            }))
          );
          addToast('Failed to compile PDF', 'error');
        }
        return;
      }

      setMergedPdfFile(null);
      filesList.forEach((f) => {
        processSingleFile(
          f.id,
          mode,
          cSettings,
          rSettings,
          convSettings,
          crSettings,
          mSettings,
          pSettings,
          filesList
        );
      });
    },
    [processSingleFile, addToast]
  );

  // Handler for Files Added
  const handleFilesSelected = async (newFiles: File[]) => {
    const newImageFiles: ImageFile[] = [];
    addToast(`Importing ${newFiles.length} file(s)...`, 'info');

    for (const file of newFiles) {
      const id = Math.random().toString(36).substring(2, 9);
      const isVideo = file.type.startsWith('video/');
      const isAudio = file.type.startsWith('audio/');
      const isPdf = file.type === 'application/pdf';
      let originalPreviewUrl = '';
      let dimensions = { width: 1280, height: 720 };

      if (!isVideo && !isAudio && !isPdf) {
        originalPreviewUrl = URL.createObjectURL(file);
        dimensions = await getImageDimensions(file);
      } else {
        originalPreviewUrl = URL.createObjectURL(file);
      }

      const aspectRatio =
        dimensions.width > 0 ? dimensions.width / dimensions.height : 1;

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
        isVideo,
        isAudio,
        isPdf,
        status: 'idle',
        progress: 0,
      });
    }

    setFiles((prev) => {
      const updated = [...prev, ...newImageFiles];
      if (!selectedFileId && updated.length > 0) {
        setSelectedFileId(updated[0].id);
      }

      // Auto process newly added files with current active tool
      triggerProcessAll(
        toolMode,
        compressSettings,
        resizeSettings,
        convertSettings,
        cropSettings,
        mediaSettings,
        pdfSettings,
        updated
      );

      return updated;
    });

    addToast(`Added ${newFiles.length} file(s) to workspace.`, 'success');
  };

  // Tool Mode Switcher
  const handleSelectToolMode = (newMode: ToolMode) => {
    setToolMode(newMode);
    if (files.length > 0) {
      triggerProcessAll(
        newMode,
        compressSettings,
        resizeSettings,
        convertSettings,
        cropSettings,
        mediaSettings,
        pdfSettings,
        files
      );
      addToast(`Switched to ${newMode.toUpperCase()} mode. Processing files...`, 'info');
    }
  };

  // Handler for Settings Changes
  const handleCompressSettingsChange = (newSettings: CompressionSettings) => {
    setCompressSettings(newSettings);
    if (files.length > 0 && toolMode === 'compress') {
      triggerProcessAll(
        'compress',
        newSettings,
        resizeSettings,
        convertSettings,
        cropSettings,
        mediaSettings,
        pdfSettings,
        files
      );
    }
  };

  const handleResizeSettingsChange = (newSettings: ResizeSettings) => {
    setResizeSettings(newSettings);
    if (files.length > 0 && toolMode === 'resize') {
      triggerProcessAll(
        'resize',
        compressSettings,
        newSettings,
        convertSettings,
        cropSettings,
        mediaSettings,
        pdfSettings,
        files
      );
    }
  };

  const handleConvertSettingsChange = (newSettings: ConvertSettings) => {
    setConvertSettings(newSettings);
    if (files.length > 0 && toolMode === 'convert') {
      triggerProcessAll(
        'convert',
        compressSettings,
        resizeSettings,
        newSettings,
        cropSettings,
        mediaSettings,
        pdfSettings,
        files
      );
    }
  };

  const handleCropSettingsChange = (newSettings: CropTransformSettings) => {
    setCropSettings(newSettings);
    if (files.length > 0 && toolMode === 'crop') {
      triggerProcessAll(
        'crop',
        compressSettings,
        resizeSettings,
        convertSettings,
        newSettings,
        mediaSettings,
        pdfSettings,
        files
      );
    }
  };

  const handleMediaSettingsChange = (newSettings: MediaExtractSettings) => {
    setMediaSettings(newSettings);
    if (files.length > 0 && toolMode === 'media') {
      triggerProcessAll(
        'media',
        compressSettings,
        resizeSettings,
        convertSettings,
        cropSettings,
        newSettings,
        pdfSettings,
        files
      );
    }
  };

  const handlePdfSettingsChange = (newSettings: PdfSettings) => {
    setPdfSettings(newSettings);
    if (files.length > 0 && toolMode === 'pdf') {
      triggerProcessAll(
        'pdf',
        compressSettings,
        resizeSettings,
        convertSettings,
        cropSettings,
        mediaSettings,
        newSettings,
        files
      );
    }
  };

  // Handler for File Removal
  const handleRemoveFile = (id: string) => {
    setFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) {
        if (target.originalPreviewUrl) URL.revokeObjectURL(target.originalPreviewUrl);
        if (target.compressedPreviewUrl) URL.revokeObjectURL(target.compressedPreviewUrl);
        if (target.extractedFrames) {
          target.extractedFrames.forEach((frame) => URL.revokeObjectURL(frame.url));
        }
      }
      const updated = prev.filter((f) => f.id !== id);
      if (selectedFileId === id) {
        setSelectedFileId(updated.length > 0 ? updated[0].id : null);
      }
      return updated;
    });
  };

  const downloadBlob = (blob: Blob, fileName: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // Handler for Single Download
  const handleDownloadSingle = (file: ImageFile) => {
    if (toolMode === 'pdf') {
      if (pdfSettings.mergeAllIntoSinglePdf && mergedPdfFile) {
        downloadBlob(mergedPdfFile, mergedPdfFile.name);
        addToast(`Downloaded ${mergedPdfFile.name}`, 'success');
        return;
      }
      if (file.generatedPdfFile) {
        downloadBlob(file.generatedPdfFile, file.generatedPdfFile.name);
        addToast(`Downloaded ${file.generatedPdfFile.name}`, 'success');
        return;
      }
    }

    if (file.extractedAudioFile) {
      downloadBlob(file.extractedAudioFile, file.extractedAudioFile.name);
      return;
    }

    if (!file.compressedFile || !file.compressedPreviewUrl) return;
    downloadBlob(file.compressedFile, file.compressedFile.name);
    addToast(`Downloaded ${file.compressedFile.name}`, 'success');
  };

  // Handler for Batch ZIP Download
  const handleDownloadZip = async () => {
    if (toolMode === 'pdf' && pdfSettings.mergeAllIntoSinglePdf && mergedPdfFile) {
      downloadBlob(mergedPdfFile, mergedPdfFile.name);
      return;
    }

    const successFiles = files.filter(
      (f) =>
        f.status === 'success' &&
        (f.compressedFile || f.extractedFrames || f.extractedAudioFile || f.generatedPdfFile)
    );
    if (successFiles.length === 0) return;

    setIsDownloadingZip(true);
    addToast('Generating ZIP package...', 'info');

    try {
      const zip = new JSZip();

      successFiles.forEach((f) => {
        if (toolMode === 'pdf' && f.generatedPdfFile) {
          zip.file(f.generatedPdfFile.name, f.generatedPdfFile);
        } else if (f.compressedFile) {
          zip.file(f.compressedFile.name, f.compressedFile);
        }
        if (f.extractedAudioFile) {
          zip.file(f.extractedAudioFile.name, f.extractedAudioFile);
        }
        if (f.extractedFrames && f.extractedFrames.length > 0) {
          const folder = zip.folder(`${f.name}_frames`);
          f.extractedFrames.forEach((fr) => {
            folder?.file(fr.name, fr.file);
          });
        }
      });

      const zipBlob = await zip.generateAsync({ type: 'blob' });
      downloadBlob(zipBlob, `pixelshrink_${toolMode}_${Date.now()}.zip`);
      addToast('ZIP archive downloaded successfully!', 'success');
    } catch (err) {
      console.error('ZIP generation error:', err);
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
    setMergedPdfFile(null);
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
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-zinc-100 dark:bg-zinc-900 border border-zinc-200/60 dark:border-zinc-800/60 text-zinc-500">
                Studio Pro
              </span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <ThemeToggle />
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 md:py-8 flex flex-col justify-start">
        {/* Tool Navigation Tabs */}
        <NavbarTabs activeMode={toolMode} onSelectMode={handleSelectToolMode} />

        {files.length === 0 ? (
          // Landing View
          <div className="space-y-10 animate-fade-in mt-2">
            <Hero toolMode={toolMode} />

            <div className="max-w-2xl mx-auto w-full">
              <UploadZone
                onFilesSelected={handleFilesSelected}
                toolMode={toolMode}
              />
            </div>

            {/* Studio Tools Feature Matrix */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3.5 max-w-6xl mx-auto pt-4 text-left">
              <div
                onClick={() => handleSelectToolMode('compress')}
                className="p-4 rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-900/60 dark:bg-zinc-950/30 space-y-1.5 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Minimize2 className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Compressor</h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Lossless & lossy image shrinking up to 90% space reduction.
                </p>
              </div>

              <div
                onClick={() => handleSelectToolMode('resize')}
                className="p-4 rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-900/60 dark:bg-zinc-950/30 space-y-1.5 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Scaling className="w-4 h-4 text-indigo-500" />
                  <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Resizer</h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  YouTube thumbnail/banner & Instagram presets.
                </p>
              </div>

              <div
                onClick={() => handleSelectToolMode('convert')}
                className="p-4 rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-900/60 dark:bg-zinc-950/30 space-y-1.5 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <RefreshCw className="w-4 h-4 text-emerald-500" />
                  <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Converter</h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Convert to WEBP, JPEG, PNG, AVIF, BMP, and ICO.
                </p>
              </div>

              <div
                onClick={() => handleSelectToolMode('pdf')}
                className="p-4 rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-900/60 dark:bg-zinc-950/30 space-y-1.5 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-500" />
                  <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">PDF Studio</h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Convert images to A4/Letter PDF & merge into books.
                </p>
              </div>

              <div
                onClick={() => handleSelectToolMode('media')}
                className="p-4 rounded-2xl border border-zinc-200/60 bg-white dark:border-zinc-900/60 dark:bg-zinc-950/30 space-y-1.5 cursor-pointer hover:border-zinc-400 dark:hover:border-zinc-700 transition-all shadow-2xs"
              >
                <div className="flex items-center gap-2">
                  <Film className="w-4 h-4 text-sky-500" />
                  <h4 className="font-bold text-xs text-zinc-800 dark:text-zinc-200">Media Extractor</h4>
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed">
                  Extract audio tracks (WAV) & video snapshot frames.
                </p>
              </div>
            </div>
          </div>
        ) : (
          // Dashboard Studio Workspace View
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start animate-fade-in mt-4">
            {/* Sidebar (Left Column - 5 Cols) */}
            <div className="lg:col-span-5 space-y-6">
              {/* Mini Upload Zone */}
              <div className="bg-white dark:bg-zinc-900/50 border border-zinc-200/80 dark:border-zinc-800/60 rounded-2xl p-4 shadow-2xs">
                <UploadZone
                  onFilesSelected={handleFilesSelected}
                  toolMode={toolMode}
                />
              </div>

              {/* Uploaded List Preview */}
              <ImagePreviewList
                files={files}
                selectedFileId={selectedFileId}
                onSelectFile={(id) => setSelectedFileId(id)}
                onRemoveFile={handleRemoveFile}
              />

              {/* Dynamic Settings Panel based on active ToolMode */}
              {toolMode === 'compress' && (
                <CompressionSettingsPanel
                  settings={compressSettings}
                  onSettingsChange={handleCompressSettingsChange}
                />
              )}

              {toolMode === 'resize' && (
                <ResizerPanel
                  settings={resizeSettings}
                  onSettingsChange={handleResizeSettingsChange}
                  originalWidth={activeFile?.originalWidth}
                  originalHeight={activeFile?.originalHeight}
                />
              )}

              {toolMode === 'convert' && (
                <ConverterPanel
                  settings={convertSettings}
                  onSettingsChange={handleConvertSettingsChange}
                />
              )}

              {toolMode === 'crop' && (
                <CropPanel
                  settings={cropSettings}
                  onSettingsChange={handleCropSettingsChange}
                />
              )}

              {toolMode === 'media' && (
                <MediaExtractorPanel
                  settings={mediaSettings}
                  onSettingsChange={handleMediaSettingsChange}
                  activeFile={activeFile}
                  onDownloadAudio={(audioFile) => downloadBlob(audioFile, audioFile.name)}
                  onDownloadFrame={(fr) => downloadBlob(fr.file, fr.name)}
                />
              )}

              {toolMode === 'pdf' && (
                <PdfPanel
                  settings={pdfSettings}
                  onSettingsChange={handlePdfSettingsChange}
                  filesCount={files.length}
                />
              )}
            </div>

            {/* Visualizer Area (Right Column - 7 Cols) */}
            <div className="lg:col-span-7 space-y-6">
              {/* Special PDF Merged Document Card */}
              {toolMode === 'pdf' && pdfSettings.mergeAllIntoSinglePdf && mergedPdfFile && (
                <div className="p-6 rounded-2xl bg-white dark:bg-zinc-900/50 border border-rose-200/80 dark:border-rose-900/40 shadow-xs space-y-4 animate-fade-in">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
                        <FileText className="w-6 h-6" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-50">
                          {mergedPdfFile.name}
                        </h3>
                        <p className="text-xs text-zinc-500">
                          Compiled {files.length} photos into 1 multi-page PDF document
                        </p>
                      </div>
                    </div>
                    <span className="text-xs font-mono font-bold px-2.5 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                      {formatSize(mergedPdfFile.size)}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-3 p-3.5 rounded-xl bg-zinc-50 dark:bg-zinc-950/40 text-xs">
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-bold block">Page Size</span>
                      <strong className="text-zinc-800 dark:text-zinc-200 uppercase">{pdfSettings.pageSize}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-bold block">Orientation</span>
                      <strong className="text-zinc-800 dark:text-zinc-200 capitalize">{pdfSettings.orientation}</strong>
                    </div>
                    <div>
                      <span className="text-zinc-400 text-[10px] uppercase font-bold block">Layout Grid</span>
                      <strong className="text-zinc-800 dark:text-zinc-200">{pdfSettings.layout}</strong>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => downloadBlob(mergedPdfFile, mergedPdfFile.name)}
                    className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm transition-all shadow-xs cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Combined PDF ({files.length} Pages)</span>
                  </button>
                </div>
              )}

              {activeFile ? (
                <>
                  {activeFile.status === 'compressing' && (
                    <div className="min-h-[400px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 rounded-2xl flex flex-col items-center justify-center p-8 space-y-4 shadow-2xs">
                      <RefreshCw className="w-8 h-8 text-zinc-400 animate-spin" />
                      <div className="space-y-1.5 text-center">
                        <p className="text-sm font-bold text-zinc-800 dark:text-zinc-200">
                          Processing {toolMode.toUpperCase()}...
                        </p>
                        <p className="text-xs text-zinc-400 dark:text-zinc-500">
                          Optimizing {activeFile.name} ({Math.round(activeFile.progress)}%)
                        </p>
                      </div>
                    </div>
                  )}

                  {activeFile.status === 'error' && (
                    <div className="min-h-[400px] border border-red-200 bg-red-50/20 dark:border-red-900/30 dark:bg-red-950/5 rounded-2xl flex flex-col items-center justify-center p-8 space-y-3 shadow-2xs">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
                        <Info className="w-5 h-5" />
                      </div>
                      <div className="text-center space-y-1">
                        <h4 className="text-sm font-bold text-red-800 dark:text-red-400">
                          Processing Failed
                        </h4>
                        <p className="text-xs text-red-600 dark:text-red-500 max-w-sm leading-relaxed">
                          {activeFile.errorMsg || 'An error occurred during operation.'}
                        </p>
                      </div>
                    </div>
                  )}

                  {activeFile.status === 'success' && (
                    <div className="space-y-6">
                      {/* Before / After comparison slider (for images) */}
                      {!activeFile.isVideo && !activeFile.isAudio && toolMode !== 'pdf' && (
                        <ComparisonView file={activeFile} />
                      )}

                      {/* Video Player */}
                      {activeFile.isVideo && activeFile.originalPreviewUrl && (
                        <div className="space-y-2">
                          <label className="text-xs font-semibold text-zinc-500 block">
                            Video Player
                          </label>
                          <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-zinc-200 dark:border-zinc-800">
                            <video
                              controls
                              src={activeFile.originalPreviewUrl}
                              className="w-full h-full"
                            />
                          </div>
                        </div>
                      )}

                      {/* Image Preview in PDF mode */}
                      {toolMode === 'pdf' && (
                        <div className="p-4 rounded-2xl bg-white dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 space-y-3">
                          <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider block">
                            Page Source Preview
                          </span>
                          <div className="aspect-video bg-zinc-100 dark:bg-zinc-950 rounded-xl overflow-hidden border border-zinc-200/50 dark:border-zinc-800/50 flex items-center justify-center p-2">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activeFile.originalPreviewUrl}
                              alt={activeFile.name}
                              className="max-h-full max-w-full object-contain rounded-lg"
                            />
                          </div>
                        </div>
                      )}

                      {/* Output Stats card */}
                      {!activeFile.isVideo && !activeFile.isAudio && toolMode !== 'pdf' && (
                        <StatsCard file={activeFile} />
                      )}
                    </div>
                  )}
                </>
              ) : (
                <div className="min-h-[400px] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/20 rounded-2xl flex flex-col items-center justify-center p-8 space-y-2 shadow-2xs">
                  <p className="text-sm font-bold text-zinc-500 dark:text-zinc-400">
                    No File Selected
                  </p>
                  <p className="text-xs text-zinc-400 dark:text-zinc-500">
                    Select a file from the sidebar to inspect output.
                  </p>
                </div>
              )}
            </div>

            {/* Bottom Actions footer */}
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
