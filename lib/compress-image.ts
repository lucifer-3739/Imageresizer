import imageCompression from 'browser-image-compression';
import { CompressionSettings } from '@/types/image';

/**
 * Loads a File object into an HTMLImageElement to read dimensions.
 */
export function getImageDimensions(file: File): Promise<{ width: number; height: number }> {
  return new Promise((resolve) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      const dimensions = { width: img.naturalWidth, height: img.naturalHeight };
      URL.revokeObjectURL(img.src);
      resolve(dimensions);
    };
    img.onerror = () => {
      resolve({ width: 0, height: 0 });
    };
  });
}

/**
 * Helper to resize an image using HTML5 Canvas.
 * Used when aspect ratio is NOT locked, or when precise dimensions are needed.
 */
function resizeImageOnCanvas(
  file: File,
  width?: number,
  height?: number,
  outputType?: string
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(img.src);
      
      const targetWidth = width || img.naturalWidth;
      const targetHeight = height || img.naturalHeight;
      
      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;
      
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to get canvas context'));
        return;
      }
      
      // Draw image stretching or squishing to fit the exact dimensions
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);
      
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas conversion to blob failed'));
            return;
          }
          const resizedFile = new File([blob], file.name, {
            type: outputType || file.type,
            lastModified: Date.now(),
          });
          resolve(resizedFile);
        },
        outputType || file.type,
        1.0 // Max quality for intermediate canvas representation
      );
    };
    img.onerror = () => {
      reject(new Error('Failed to load image on canvas'));
    };
  });
}

/**
 * Main compression logic. Runs client-side using browser-image-compression.
 */
export async function compressImage(
  file: File,
  settings: CompressionSettings,
  onProgress?: (progress: number) => void
): Promise<File> {
  let workingFile = file;

  const targetType = settings.format === 'original' 
    ? file.type 
    : `image/${settings.format}`;

  // 1. If width/height are specified and we are NOT maintaining aspect ratio
  if ((settings.maxWidth || settings.maxHeight) && !settings.keepAspectRatio) {
    workingFile = await resizeImageOnCanvas(
      file,
      settings.maxWidth,
      settings.maxHeight,
      targetType
    );
  }

  // 2. Prepare browser-image-compression options
  const options: any = {
    maxSizeMB: 50, // Keep high so Quality slider is the principal compressor
    useWebWorker: true,
    initialQuality: settings.quality / 100,
    fileType: targetType,
    onProgress: (progress: number) => {
      if (onProgress) {
        onProgress(progress);
      }
    },
  };

  // If maintaining aspect ratio, set maxWidthOrHeight for browser-image-compression
  if (settings.keepAspectRatio) {
    // If both are specified, we fit within the box by setting the larger constraint
    if (settings.maxWidth && settings.maxHeight) {
      // Since browser-image-compression will scale down so that the max(width, height) <= maxWidthOrHeight,
      // to guarantee fitting inside a bounding box [W, H], we must scale according to the most restrictive dimension.
      // Let's get the original dimensions first to calculate the correct scale.
      const dims = await getImageDimensions(file);
      if (dims.width > 0 && dims.height > 0) {
        const scaleW = settings.maxWidth / dims.width;
        const scaleH = settings.maxHeight / dims.height;
        const scale = Math.min(scaleW, scaleH, 1.0); // Don't upscale
        
        options.maxWidthOrHeight = Math.round(Math.max(dims.width * scale, dims.height * scale));
      } else {
        options.maxWidthOrHeight = Math.min(settings.maxWidth, settings.maxHeight);
      }
    } else if (settings.maxWidth) {
      options.maxWidthOrHeight = settings.maxWidth;
    } else if (settings.maxHeight) {
      options.maxWidthOrHeight = settings.maxHeight;
    }
  }

  // 3. Compress
  const compressedBlob = await imageCompression(workingFile, options);

  // 4. Generate appropriate file extension and name
  const extension = settings.format === 'original'
    ? file.name.split('.').pop()
    : settings.format;
  
  const baseName = file.name.substring(0, file.name.lastIndexOf('.'));
  const newName = `${baseName}_pixelshrink.${extension}`;

  return new File([compressedBlob], newName, {
    type: targetType,
    lastModified: Date.now(),
  });
}
