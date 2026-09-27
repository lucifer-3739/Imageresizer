export type ToolMode = 'compress' | 'resize' | 'convert' | 'crop' | 'media' | 'pdf';

export type PdfToolSubMode =
  | 'image-to-pdf'
  | 'resize-pdf'
  | 'edit-pages'
  | 'watermark'
  | 'split-merge';

export interface PdfPageInfo {
  pageNumber: number;
  width: number;
  height: number;
  rotation: number;
}

export interface PdfDocInfo {
  pageCount: number;
  pages: PdfPageInfo[];
  title?: string;
  author?: string;
}

export interface PdfPageEditState {
  pageIndex: number;
  rotation: number; // 0, 90, 180, 270
  deleted: boolean;
}

export interface PdfResizeOptions {
  targetSize: 'a4' | 'letter' | 'legal' | 'a3' | 'a5' | 'custom';
  customWidth?: number;
  customHeight?: number;
  orientation: 'portrait' | 'landscape' | 'auto';
  scaleContent: boolean;
  margin: 'none' | 'small' | 'normal' | 'large';
}

export interface PdfWatermarkOptions {
  text: string;
  fontSize: number;
  opacity: number; // 0.05 to 1.0
  color: string;
  rotation: number; // 0 to 360, default 45
  addPageNumbers: boolean;
  pageNumberPosition: 'bottom-center' | 'bottom-right' | 'top-right';
  pageNumberFormat: 'page-x-of-y' | 'x-of-y' | 'x';
}

export interface PdfSplitMergeOptions {
  action: 'split' | 'merge';
  splitRange: string; // e.g. "1-3, 5"
}

export interface ImageFile {
  id: string;
  file: File;
  name: string;
  originalSize: number;
  originalWidth: number;
  originalHeight: number;
  originalType: string;
  originalPreviewUrl: string;
  aspectRatio: number;
  isVideo?: boolean;
  isAudio?: boolean;
  isPdf?: boolean;
  duration?: number;

  // PDF inspection metadata
  pdfDocInfo?: PdfDocInfo;
  pdfPageEdits?: Record<number, PdfPageEditState>;

  // Processed Output state
  compressedFile?: File;
  compressedSize?: number;
  compressedWidth?: number;
  compressedHeight?: number;
  compressedPreviewUrl?: string;
  status: 'idle' | 'compressing' | 'success' | 'error';
  progress: number; // 0 - 100
  errorMsg?: string;

  // Media extractor specific
  extractedFrames?: { url: string; time: number; name: string; file: File }[];
  extractedAudioFile?: File;

  // PDF specific
  generatedPdfFile?: File;
}

export interface CompressionSettings {
  quality: number; // 10 to 100
  format: 'original' | 'jpeg' | 'png' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
  keepAspectRatio: boolean;
}

export interface ResizeSettings {
  mode: 'exact' | 'percentage' | 'preset';
  width?: number;
  height?: number;
  percentage: number; // 10 to 400
  preset?: string;
  maintainAspectRatio: boolean;
  fit: 'contain' | 'cover' | 'stretch';
  backgroundColor: string;
  quality: number;
}

export type SupportedConvertFormat =
  | 'webp'
  | 'jpeg'
  | 'png'
  | 'avif'
  | 'svg'
  | 'pdf'
  | 'tiff'
  | 'ico'
  | 'bmp'
  | 'gif'
  | 'tga'
  | 'ppm';

export interface ConvertSettings {
  targetFormat: SupportedConvertFormat;
  quality: number;
  backgroundColor: string;
  icoSize: number;
}

export interface CropTransformSettings {
  aspectRatioPreset: 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2';
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  quality: number;
}

export interface MediaExtractSettings {
  mode: 'audio' | 'frames' | 'url-music';
  audioFormat: 'wav';
  frameInterval: number;
  maxFrames: number;
}

export interface PdfSettings {
  subMode: PdfToolSubMode;
  pageSize: 'a4' | 'letter' | 'legal' | 'fit' | 'square';
  orientation: 'portrait' | 'landscape' | 'auto';
  margin: 'none' | 'small' | 'normal' | 'large';
  layout: '1-per-page' | '2-per-page' | '4-per-page';
  mergeAllIntoSinglePdf: boolean;
  imageQuality: number;
  pdfTitle: string;

  // Advanced PDF Edit & Resize Settings
  resizeOptions: PdfResizeOptions;
  watermarkOptions: PdfWatermarkOptions;
  splitMergeOptions: PdfSplitMergeOptions;
}
