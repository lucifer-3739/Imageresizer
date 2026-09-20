export type ToolMode = 'compress' | 'resize' | 'convert' | 'crop' | 'media';

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
  duration?: number;

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
  backgroundColor: string; // hex or 'transparent'
  quality: number;
}

export type SupportedConvertFormat = 'jpeg' | 'png' | 'webp' | 'avif' | 'bmp' | 'ico';

export interface ConvertSettings {
  targetFormat: SupportedConvertFormat;
  quality: number;
  backgroundColor: string;
  icoSize: number; // 16, 32, 48, 64, 128, 256
}

export interface CropTransformSettings {
  aspectRatioPreset: 'free' | '1:1' | '16:9' | '9:16' | '4:3' | '3:2';
  rotation: number; // 0, 90, 180, 270
  flipHorizontal: boolean;
  flipVertical: boolean;
  quality: number;
}

export interface MediaExtractSettings {
  mode: 'audio' | 'frames';
  audioFormat: 'wav';
  frameInterval: number; // snapshot every N seconds
  maxFrames: number;
}
