import { ResizeSettings } from '@/types/image';
import { getImageDimensions } from './compress-image';

export interface SocialPreset {
  id: string;
  name: string;
  category: 'YouTube' | 'Instagram' | 'Twitter/X' | 'LinkedIn' | 'Facebook' | 'Pinterest';
  width: number;
  height: number;
  description: string;
}

export const SOCIAL_PRESETS: SocialPreset[] = [
  { id: 'youtube-thumbnail', name: 'YouTube Thumbnail', category: 'YouTube', width: 1280, height: 720, description: '1280 × 720 (16:9 HD)' },
  { id: 'youtube-banner', name: 'YouTube Channel Banner', category: 'YouTube', width: 2560, height: 1440, description: '2560 × 1440 (16:9 TV/Desktop)' },
  { id: 'instagram-square', name: 'Instagram Square Post', category: 'Instagram', width: 1080, height: 1080, description: '1080 × 1080 (1:1)' },
  { id: 'instagram-portrait', name: 'Instagram Portrait Post', category: 'Instagram', width: 1080, height: 1350, description: '1080 × 1350 (4:5)' },
  { id: 'instagram-story', name: 'Instagram Story / Reel', category: 'Instagram', width: 1080, height: 1920, description: '1080 × 1920 (9:16)' },
  { id: 'twitter-post', name: 'Twitter / X Post Image', category: 'Twitter/X', width: 1200, height: 675, description: '1200 × 675 (16:9)' },
  { id: 'twitter-header', name: 'Twitter / X Header Banner', category: 'Twitter/X', width: 1500, height: 500, description: '1500 × 500 (3:1)' },
  { id: 'linkedin-banner', name: 'LinkedIn Cover Banner', category: 'LinkedIn', width: 1584, height: 396, description: '1584 × 396 (4:1)' },
  { id: 'facebook-post', name: 'Facebook Feed Post', category: 'Facebook', width: 1200, height: 630, description: '1200 × 630 (1.91:1)' },
  { id: 'facebook-cover', name: 'Facebook Cover Photo', category: 'Facebook', width: 820, height: 312, description: '820 × 312 (2.6:1)' },
  { id: 'pinterest-pin', name: 'Pinterest Standard Pin', category: 'Pinterest', width: 1000, height: 1500, description: '1000 × 1500 (2:3)' },
];

/**
 * Calculates target dimensions based on ResizeSettings and original dimensions.
 */
export function calculateTargetDimensions(
  origWidth: number,
  origHeight: number,
  settings: ResizeSettings
): { width: number; height: number } {
  if (settings.mode === 'percentage') {
    const factor = Math.max(1, settings.percentage) / 100;
    return {
      width: Math.max(1, Math.round(origWidth * factor)),
      height: Math.max(1, Math.round(origHeight * factor)),
    };
  }

  if (settings.mode === 'preset' && settings.preset) {
    const presetObj = SOCIAL_PRESETS.find((p) => p.id === settings.preset);
    if (presetObj) {
      return { width: presetObj.width, height: presetObj.height };
    }
  }

  // Exact mode
  let targetW = settings.width || origWidth;
  let targetH = settings.height || origHeight;

  if (settings.maintainAspectRatio) {
    if (settings.width && !settings.height) {
      targetH = Math.round(settings.width / (origWidth / origHeight));
    } else if (!settings.width && settings.height) {
      targetW = Math.round(settings.height * (origWidth / origHeight));
    } else if (settings.width && settings.height) {
      // If both provided while maintaining ratio, use standard fit scaling
      const scale = Math.min(settings.width / origWidth, settings.height / origHeight);
      targetW = Math.round(origWidth * scale);
      targetH = Math.round(origHeight * scale);
    }
  }

  return {
    width: Math.max(1, targetW),
    height: Math.max(1, targetH),
  };
}

/**
 * High-quality client-side image resizer using HTML5 Canvas.
 */
export async function resizeImage(
  file: File,
  settings: ResizeSettings,
  onProgress?: (progress: number) => void
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (onProgress) onProgress(30);

      const origWidth = img.naturalWidth;
      const origHeight = img.naturalHeight;

      const { width: targetW, height: targetH } = calculateTargetDimensions(
        origWidth,
        origHeight,
        settings
      );

      const canvas = document.createElement('canvas');
      canvas.width = targetW;
      canvas.height = targetH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to acquire canvas 2D context'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // Background filling (if specified and not transparent)
      if (settings.backgroundColor && settings.backgroundColor !== 'transparent') {
        ctx.fillStyle = settings.backgroundColor;
        ctx.fillRect(0, 0, targetW, targetH);
      }

      if (onProgress) onProgress(60);

      // Render image according to fit mode
      if (settings.fit === 'contain') {
        const hRatio = targetW / origWidth;
        const vRatio = targetH / origHeight;
        const ratio = Math.min(hRatio, vRatio);
        const centerShiftX = (targetW - origWidth * ratio) / 2;
        const centerShiftY = (targetH - origHeight * ratio) / 2;
        ctx.drawImage(
          img,
          0,
          0,
          origWidth,
          origHeight,
          centerShiftX,
          centerShiftY,
          origWidth * ratio,
          origHeight * ratio
        );
      } else if (settings.fit === 'cover') {
        const hRatio = targetW / origWidth;
        const vRatio = targetH / origHeight;
        const ratio = Math.max(hRatio, vRatio);
        const centerShiftX = (targetW - origWidth * ratio) / 2;
        const centerShiftY = (targetH - origHeight * ratio) / 2;
        ctx.drawImage(
          img,
          0,
          0,
          origWidth,
          origHeight,
          centerShiftX,
          centerShiftY,
          origWidth * ratio,
          origHeight * ratio
        );
      } else {
        // Stretch / exact fit
        ctx.drawImage(img, 0, 0, targetW, targetH);
      }

      if (onProgress) onProgress(85);

      const outputType = file.type || 'image/jpeg';
      const qualityFactor = Math.min(1.0, Math.max(0.1, settings.quality / 100));

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas rendering to blob failed'));
            return;
          }
          if (onProgress) onProgress(100);

          const dotIdx = file.name.lastIndexOf('.');
          const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;
          const ext = dotIdx !== -1 ? file.name.substring(dotIdx + 1) : 'jpg';

          const resizedFile = new File([blob], `${baseName}_${targetW}x${targetH}.${ext}`, {
            type: outputType,
            lastModified: Date.now(),
          });

          resolve(resizedFile);
        },
        outputType,
        qualityFactor
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image file for resizing'));
    };
  });
}
