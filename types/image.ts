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

  // Compression Result state
  compressedFile?: File;
  compressedSize?: number;
  compressedWidth?: number;
  compressedHeight?: number;
  compressedPreviewUrl?: string;
  status: 'idle' | 'compressing' | 'success' | 'error';
  progress: number; // 0 - 100
  errorMsg?: string;
}

export interface CompressionSettings {
  quality: number; // 10 to 100
  format: 'original' | 'jpeg' | 'png' | 'webp';
  maxWidth?: number;
  maxHeight?: number;
  keepAspectRatio: boolean;
}
