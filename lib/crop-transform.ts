import { CropTransformSettings } from '@/types/image';

/**
 * Calculates cropped rectangle based on aspect ratio preset.
 */
export function calculateCropDimensions(
  origWidth: number,
  origHeight: number,
  aspectPreset: CropTransformSettings['aspectRatioPreset']
): { cropX: number; cropY: number; cropW: number; cropH: number } {
  if (aspectPreset === 'free') {
    return { cropX: 0, cropY: 0, cropW: origWidth, cropH: origHeight };
  }

  let targetRatio = 1;
  if (aspectPreset === '1:1') targetRatio = 1;
  else if (aspectPreset === '16:9') targetRatio = 16 / 9;
  else if (aspectPreset === '9:16') targetRatio = 9 / 16;
  else if (aspectPreset === '4:3') targetRatio = 4 / 3;
  else if (aspectPreset === '3:2') targetRatio = 3 / 2;

  const currentRatio = origWidth / origHeight;
  let cropW = origWidth;
  let cropH = origHeight;

  if (currentRatio > targetRatio) {
    // Image is wider than desired ratio: crop width (center)
    cropW = Math.round(origHeight * targetRatio);
    cropH = origHeight;
  } else {
    // Image is taller than desired ratio: crop height (center)
    cropW = origWidth;
    cropH = Math.round(origWidth / targetRatio);
  }

  const cropX = Math.round((origWidth - cropW) / 2);
  const cropY = Math.round((origHeight - cropH) / 2);

  return { cropX, cropY, cropW, cropH };
}

/**
 * Transforms an image with crop, rotation (90/180/270), and horizontal/vertical mirroring.
 */
export async function transformImage(
  file: File,
  settings: CropTransformSettings,
  onProgress?: (progress: number) => void
): Promise<File> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(img.src);
      if (onProgress) onProgress(30);

      const origW = img.naturalWidth;
      const origH = img.naturalHeight;

      // 1. Calculate Crop
      const { cropX, cropY, cropW, cropH } = calculateCropDimensions(
        origW,
        origH,
        settings.aspectRatioPreset
      );

      // 2. Compute post-rotation dimensions
      const isQuarterTurn = settings.rotation === 90 || settings.rotation === 270;
      const canvasW = isQuarterTurn ? cropH : cropW;
      const canvasH = isQuarterTurn ? cropW : cropH;

      const canvas = document.createElement('canvas');
      canvas.width = canvasW;
      canvas.height = canvasH;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Failed to create canvas context for transformation'));
        return;
      }

      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';

      // 3. Apply Transformations
      ctx.save();
      // Move origin to canvas center
      ctx.translate(canvasW / 2, canvasH / 2);

      // Rotate
      if (settings.rotation) {
        ctx.rotate((settings.rotation * Math.PI) / 180);
      }

      // Flip
      const scaleX = settings.flipHorizontal ? -1 : 1;
      const scaleY = settings.flipVertical ? -1 : 1;
      ctx.scale(scaleX, scaleY);

      if (onProgress) onProgress(65);

      // Draw cropped image centered
      ctx.drawImage(
        img,
        cropX,
        cropY,
        cropW,
        cropH,
        -cropW / 2,
        -cropH / 2,
        cropW,
        cropH
      );

      ctx.restore();

      if (onProgress) onProgress(85);

      const outputType = file.type || 'image/jpeg';
      const qualityFactor = Math.min(1.0, Math.max(0.1, settings.quality / 100));

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas blob transform error'));
            return;
          }
          if (onProgress) onProgress(100);

          const dotIdx = file.name.lastIndexOf('.');
          const baseName = dotIdx !== -1 ? file.name.substring(0, dotIdx) : file.name;
          const ext = dotIdx !== -1 ? file.name.substring(dotIdx + 1) : 'jpg';

          const transformedFile = new File(
            [blob],
            `${baseName}_transformed.${ext}`,
            { type: outputType, lastModified: Date.now() }
          );

          resolve(transformedFile);
        },
        outputType,
        qualityFactor
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(img.src);
      reject(new Error('Failed to load image for transformation'));
    };
  });
}
